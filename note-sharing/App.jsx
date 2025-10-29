import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, setLogLevel } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { Plus, Trash2, Share2, Clipboard, X, Loader2, Save } from 'lucide-react';

// --- Firebase Configuration ---
// These global variables are expected to be injected by the environment.
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : { apiKey: "DEFAULT_API_KEY", authDomain: "DEFAULT_AUTH_DOMAIN", projectId: "DEFAULT_PROJECT_ID" };

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

// --- Firebase Initialization ---
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setLogLevel('debug');
} catch (e) {
  console.error("Firebase initialization error:", e);
}

// --- Main App Component ---
export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  // 'personal' for user's own notes, 'shared' for viewing a shared link
  const [viewMode, setViewMode] = useState('personal'); 
  
  // State for personal notes
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  
  // State for viewing a single shared note
  const [sharedNote, setSharedNote] = useState(null);
  const [isSharedNoteLoading, setIsSharedNoteLoading] = useState(true);

  // State for the share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isLoadingShare, setIsLoadingShare] = useState(false);

  // Effect 1: Handle Authentication
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Authentication error:", error);
          setIsAuthReady(true); // Still ready, even if auth failed
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Effect 2: Check for Shared Note URL (?view=...)
  useEffect(() => {
    // This effect runs once on load to check the URL
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');

    if (viewId) {
      // If a 'view' ID is in the URL, switch to shared mode
      setViewMode('shared');
      loadSharedNote(viewId);
    } else {
      // Otherwise, load personal notes
      setViewMode('personal');
    }
  }, [isAuthReady]); // Depend on isAuthReady to ensure db is ready

  // Effect 3: Listen for Personal Notes (if in 'personal' mode)
  useEffect(() => {
    if (viewMode === 'personal' && isAuthReady && db && userId) {
      const notesCollectionPath = `artifacts/${appId}/users/${userId}/notes`;
      const q = query(collection(db, notesCollectionPath));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(notesData);
        
        // If no note is selected, or selected note was deleted, select the first one
        if (!selectedNoteId || !notesData.find(n => n.id === selectedNoteId)) {
          setSelectedNoteId(notesData[0]?.id || null);
        }
      }, (error) => {
        console.error("Error listening to notes:", error);
      });

      return () => unsubscribe();
    }
  }, [viewMode, isAuthReady, userId, db]); // Re-run if any of these change

  // --- Data Functions ---

  // Load a single shared note from the public collection
  const loadSharedNote = async (viewId) => {
    if (!db) return;
    setIsSharedNoteLoading(true);
    try {
      const noteRef = doc(db, `artifacts/${appId}/public/data/sharedNotes`, viewId);
      const docSnap = await getDoc(noteRef);

      if (docSnap.exists()) {
        setSharedNote(docSnap.data());
      } else {
        setSharedNote({ title: "Note Not Found", content: "This note may have been deleted or the link is incorrect." });
      }
    } catch (error) {
      console.error("Error fetching shared note:", error);
      setSharedNote({ title: "Error", content: "Could not load this note." });
    } finally {
      setIsSharedNoteLoading(false);
    }
  };

  const selectedNote = useMemo(() => {
    return notes.find(note => note.id === selectedNoteId);
  }, [notes, selectedNoteId]);

  const handleNewNote = async () => {
    if (!db || !userId) return;
    const newNote = {
      title: "New Note",
      content: "Start writing...",
      createdAt: serverTimestamp(),
      shareId: null, // No share link initially
    };
    try {
      const notesCollectionPath = `artifacts/${appId}/users/${userId}/notes`;
      const docRef = await addDoc(collection(db, notesCollectionPath), newNote);
      setSelectedNoteId(docRef.id);
    } catch (error) {
      console.error("Error creating new note:", error);
    }
  };

  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
  };

  const handleUpdateNote = async (id, title, content) => {
    if (!db || !userId) return;
    const noteRef = doc(db, `artifacts/${appId}/users/${userId}/notes`, id);
    try {
      await setDoc(noteRef, { title, content }, { merge: true });
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!db || !userId) return;
    // We won't delete the public note, but we could by grabbing the shareId first.
    // For now, deleting the private note just orphans the public link.
    const noteRef = doc(db, `artifacts/${appId}/users/${userId}/notes`, id);
    try {
      await deleteDoc(noteRef);
      setSelectedNoteId(null); // Deselect
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // --- Sharing Logic ---
  const handleShareNote = async () => {
    if (!selectedNote || !db || !userId) return;

    setIsLoadingShare(true);
    
    const publicNoteData = {
      title: selectedNote.title,
      content: selectedNote.content,
      ownerId: userId,
      originalNoteId: selectedNote.id,
      sharedAt: serverTimestamp(),
    };

    try {
      let shareId = selectedNote.shareId;

      if (shareId) {
        // This note is already shared, just update the public copy
        const publicNoteRef = doc(db, `artifacts/${appId}/public/data/sharedNotes`, shareId);
        await setDoc(publicNoteRef, publicNoteData, { merge: true }); // Update existing
      } else {
        // This is the first time sharing this note
        const publicCollectionRef = collection(db, `artifacts/${appId}/public/data/sharedNotes`);
        const newPublicDoc = await addDoc(publicCollectionRef, publicNoteData);
        shareId = newPublicDoc.id;

        // Save the new shareId back to the private note
        const privateNoteRef = doc(db, `artifacts/${appId}/users/${userId}/notes`, selectedNote.id);
        await setDoc(privateNoteRef, { shareId: shareId }, { merge: true });
      }

      // Generate and show the link
      const link = `${window.location.origin}${window.location.pathname}?view=${shareId}`;
      setShareLink(link);
      setShowShareModal(true);

    } catch (error) {
      console.error("Error sharing note:", error);
    } finally {
      setIsLoadingShare(false);
    }
  };

  // --- Render Logic ---

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <span className="ml-4 text-xl font-semibold">Loading...</span>
      </div>
    );
  }

  // Render Mode 1: Viewing a Shared Note
  if (viewMode === 'shared') {
    return (
      <SharedNoteView 
        note={sharedNote} 
        isLoading={isSharedNoteLoading} 
      />
    );
  }

  // Render Mode 2: Personal Notes Dashboard
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <NoteList
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectNote}
        onNewNote={handleNewNote}
        onDeleteNote={handleDeleteNote}
      />
      <NoteEditor
        note={selectedNote}
        onUpdate={handleUpdateNote}
        onShare={handleShareNote}
        isLoadingShare={isLoadingShare}
        key={selectedNote?.id || 'empty'} // Force re-render on note change
      />
      {showShareModal && (
        <ShareModal
          link={shareLink}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// --- Sub-Components ---

function NoteList({ notes, selectedNoteId, onSelectNote, onNewNote, onDeleteNote }) {
  return (
    <div className="w-1/3 max-w-xs border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">My Notes</h1>
        <button
          onClick={onNewNote}
          className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="New Note"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        {notes.length === 0 && (
          <p className="p-4 text-gray-500">No notes yet. Create one!</p>
        )}
        {notes.map(note => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`p-4 border-b border-gray-200 cursor-pointer ${
              selectedNoteId === note.id ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <h2 className="font-semibold text-gray-900 truncate pr-2">
                {note.title || "Untitled"}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Don't trigger select
                  onDeleteNote(note.id);
                }}
                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-100 flex-shrink-0"
                title="Delete Note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {note.content ? note.content.substring(0, 50).replace(/(\r\n|\n|\r)/gm, " ") + "..." : "No content"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteEditor({ note, onUpdate, onShare, isLoadingShare }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when note prop changes
  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note]);

  // Debounced save
  useEffect(() => {
    if (!note) return; // Don't save if no note is selected
    
    setIsSaving(true);
    const handler = setTimeout(() => {
      onUpdate(note.id, title, content);
      setIsSaving(false);
    }, 1000); // Save 1 second after user stops typing

    return () => {
      clearTimeout(handler);
    };
  }, [title, content, note?.id]);


  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Select a note to start editing or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isSaving ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Save className="w-5 h-5 text-green-600" />
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold text-gray-900 w-full focus:outline-none"
            placeholder="Note Title"
          />
        </div>
        <button
          onClick={onShare}
          disabled={isLoadingShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isLoadingShare ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Share2 className="w-5 h-5" />
          )}
          Share
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 p-6 text-gray-800 bg-white focus:outline-none resize-none"
        placeholder="Start writing..."
      />
    </div>
  );
}

// Read-only view for a shared note
function SharedNoteView({ note, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <span className="ml-4 text-xl font-semibold">Loading Shared Note...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 lg:p-12">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {note?.title || "Untitled Note"}
          </h1>
          <a 
            href={window.location.pathname} // Link to root
            className="text-blue-600 hover:underline"
          >
            &larr; Back to my notes
          </a>
        </div>
        <div 
          className="prose prose-lg max-w-none"
          // Using whitespace-pre-wrap to respect newlines from the textarea
          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
        >
          {note?.content || "This note has no content."}
        </div>
      </div>
    </div>
  );
}

function ShareModal({ link, onClose }) {
  const [copied, setCopied] = useState(false);
  const inputRef = React.useRef(null);

  const copyToClipboard = () => {
    if (inputRef.current) {
      inputRef.current.select();
      
      try {
        // Use execCommand as navigator.clipboard might be restricted in iframes
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2s
      } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for user
        alert("Failed to copy. Please copy the link manually.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Share this note</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Anyone with this link will be able to view a read-only copy of this note.
        </p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={link}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-md font-semibold ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
          >
            {copied ? 'Copied!' : 'Copy'}
            <Clipboard className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}


