import { useState, useEffect } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NotesSidebar } from '@/components/NotesSidebar';
import { NoteEditor } from '@/components/NoteEditor';
import { FileText } from 'lucide-react';

const Index = () => {
  const { notes, createNote, updateNote, deleteNote } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const handleLogin = () => { 
    console.log('Login successful');
  };

  const handleCreateNote = () => {
    const newId = createNote();
    setActiveNoteId(newId);
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    if (activeNoteId === id) {
      setActiveNoteId(notes.length > 1 ? notes[0].id : null);
    }
  };

  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      
      {/* Simple login form at the top of the page */}
      <div className="absolute top-4 right-4 z-50 bg-white shadow-md rounded px-6 py-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Username"
          className="border rounded px-2 py-1"
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded px-2 py-1"
        />
        <button onClick={handleLogin}
        className="bg-primary text-white px-3 py-1 rounded hover:bg-primary/80">
          Log in
        </button>
      </div>
      <NotesSidebar
        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={setActiveNoteId}
        onCreateNote={handleCreateNote}
      />
      <main className="flex-1 overflow-hidden">
        {activeNote ? (
          <div className="h-full p-8">
            <NoteEditor
              note={activeNote}
              onUpdate={updateNote}
              onDelete={handleDeleteNote}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="h-24 w-24 mb-4 opacity-20" />
            <p className="text-xl">Select a note or create a new one to get started</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
