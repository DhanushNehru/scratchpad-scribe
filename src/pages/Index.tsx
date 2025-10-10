import { useState, useEffect, useCallback } from "react";
import { useNotes } from "@/hooks/useNotes";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { notes, createNote, updateNote, deleteNote, duplicateNote } =
    useNotes();
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

  const handleDuplicateNote = useCallback(
    (id: string) => {
      const newId = duplicateNote(id);
      if (newId) setActiveNoteId(newId);
    },
    [duplicateNote]
  );

  // Keyboard shortcut: Ctrl/Cmd + D to duplicate active note
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const metaKey = isMac ? e.metaKey : e.ctrlKey;
      if (metaKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (activeNoteId) {
          handleDuplicateNote(activeNoteId);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeNoteId, notes, handleDuplicateNote]);
  const navigateNotes = (direction: "up" | "down") => {
    if (notes.length === 0) return;

    const currentIndex = notes.findIndex((note) => note.id === activeNoteId);

    if (currentIndex === -1) {
      setActiveNoteId(notes[0].id);
      return;
    }

    if (direction === "up" && currentIndex > 0) {
      setActiveNoteId(notes[currentIndex - 1].id);
    } else if (direction === "down" && currentIndex < notes.length - 1) {
      setActiveNoteId(notes[currentIndex + 1].id);
    }
  };

  // Keyboard shortcuts - handles all shortcuts directly
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();

        switch (key) {
          case "k": {
            event.preventDefault();
            event.stopPropagation();
            handleCreateNote();
            toast.success("New note created");
            break;
          }
          case "s": {
            event.preventDefault();
            event.stopPropagation();
            const currentNote = notes.find((note) => note.id === activeNoteId);

            if (!currentNote) return;

            const trimmedTitle = currentNote.title.trim();
            const trimmedContent = currentNote.content.trim();

            if (!trimmedTitle || !trimmedContent) {
              toast.error("Cannot save: Please enter a valid title and non-empty content.");
              return;
            }

           
            if (currentNote) {
              toast.success("Notes are saved automatically");
            }
            break;
          }
          case "d": {
            event.preventDefault();
            event.stopPropagation();
            if (activeNoteId) {
              handleDeleteNote(activeNoteId);
              toast.success("Note deleted");
            }
            break;
          }
          case "f": {
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent("focus-search"));
            break;
          }
          case "arrowup": {
            event.preventDefault();
            event.stopPropagation();
            navigateNotes("up");
            break;
          }
          case "arrowdown": {
            event.preventDefault();
            event.stopPropagation();
            navigateNotes("down");
            break;
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [notes, activeNoteId]);

  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
            onDuplicateNote={handleDuplicateNote}
            onDelete={handleDeleteNote}
          />
          <main className="flex-1 overflow-hidden relative">
            {/* Keyboard Shortcuts Helper */}
            <div
              className=" hidden md:block absolute bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg text-xs z-10"
              role="region"
              aria-labelledby="shortcuts-heading"
            >
              <div
                id="shortcuts-heading"
                className="font-semibold text-foreground mb-2 text-sm"
              >
                Keyboard Shortcuts
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex items-center justify-between gap-4">
                  <span>New note</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+K
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Save note</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+S
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Delete note</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+D
                  </kbd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span>Navigate</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+↑↓
                  </kbd>
                </div>
              </div>
            </div>

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
                <p className="text-xl">
                  Select a note or create a new one to get started
                </p>
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
              <button
                onClick={() => setActiveNoteId(null)}
                className="mb-4 flex items-center text-sm text-blue-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </button>
              <NoteEditor
                note={activeNote}
                onUpdate={updateNote}
                onDelete={handleDeleteNote}
              />
            </div>
          ) : (
            <NotesSidebar
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onCreateNote={handleCreateNote}
              onDuplicateNote={handleDuplicateNote}
              onDelete={handleDeleteNote}
            />
          )}
        </main>
      )}
    </div>
  );
};

export default Index;
