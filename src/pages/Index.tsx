import { useState, useEffect } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NotesSidebar } from '@/components/NotesSidebar';
import { NoteEditor } from '@/components/NoteEditor';
import { FileText, ArrowLeft } from 'lucide-react';

const Index = () => {
  const { notes, createNote, updateNote, deleteNote, softDeleteNote } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
  const handleSoftDeleteNote = (id: string) => {
    softDeleteNote(id);
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const activeNote = notes.find((note) => note.id === activeNoteId && !note.deleted);

  return (
    <div className="flex h-screen  overflow-hidden bg-background">
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
            onDelete={handleSoftDeleteNote}
          />
          <main className="flex-1 overflow-hidden">
            {activeNote ? (
              <div className="h-full p-8">
                <NoteEditor
                  note={activeNote}
                  onUpdate={updateNote}
                  onDelete={handleSoftDeleteNote}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-24 w-24 mb-4 opacity-20" />
                <p className="text-xl">Select a note or create a new one to get started</p>
              </div>
            )}
          </main>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <main className="flex-1 overflow-hidden">
          {activeNote ? (
            <div className="h-full p-4">
              {/* Back button */}
              <button
                onClick={() => setActiveNoteId(null)}
                className="mb-4 flex items-center text-sm text-blue-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </button>
              <NoteEditor
                note={activeNote}
                onUpdate={updateNote}
                onDelete={handleSoftDeleteNote}
              />
            </div>
          ) : (
            <NotesSidebar
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onCreateNote={handleCreateNote}
              onDelete={handleSoftDeleteNote}
            />
          )}
        </main>
      )}
    </div>
  );
};

export default Index;
