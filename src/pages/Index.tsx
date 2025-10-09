import { useState, useEffect, useCallback } from "react";
import { useNotes } from "@/hooks/useNotes";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { notes, createNote, updateNote, deleteNote, duplicateNote, toggleImportant } =
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

  // Enhanced Keyboard shortcuts - handles all shortcuts directly
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const metaKey = isMac ? event.metaKey : event.ctrlKey;
      
      if (metaKey) {
        const key = event.key.toLowerCase();

        switch (key) {
          case "k": {
            event.preventDefault();
            event.stopPropagation();
            handleCreateNote();
            toast.success("New note created (Ctrl/Cmd + K)");
            break;
          }
          case "n": {
            event.preventDefault();
            event.stopPropagation();
            handleCreateNote();
            toast.success("New note created (Ctrl/Cmd + N)");
            break;
          }
          case "s": {
            event.preventDefault();
            event.stopPropagation();
            const currentNote = notes.find((note) => note.id === activeNoteId);
            if (currentNote) {
              toast.success("Notes are saved automatically");
            }
            break;
          }
          case "d": {
            event.preventDefault();
            event.stopPropagation();
            if (activeNoteId) {
              handleDuplicateNote(activeNoteId);
              toast.success("Note duplicated (Ctrl/Cmd + D)");
            }
            break;
          }
          case "delete": {
            event.preventDefault();
            event.stopPropagation();
            if (activeNoteId) {
              handleDeleteNote(activeNoteId);
              toast.success("Note deleted (Ctrl/Cmd + Delete)");
            }
            break;
          }
          case "f": {
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent("focus-search"));
            toast.success("Search focused (Ctrl/Cmd + F)");
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
          case "1": {
            event.preventDefault();
            event.stopPropagation();
            if (notes.length > 0) {
              setActiveNoteId(notes[0].id);
              toast.success("Switched to first note");
            }
            break;
          }
          case "i": {
            event.preventDefault();
            event.stopPropagation();
            if (activeNoteId) {
              toggleImportant(activeNoteId);
              const currentNote = notes.find((note) => note.id === activeNoteId);
              toast.success(currentNote?.isImportant ? "Removed from important" : "Marked as important");
            }
            break;
          }
        }
      }

      // Escape key to clear selection
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveNoteId(null);
        toast.success("Note selection cleared (Esc)");
      }
      
      // Number keys for quick note selection (1-9)
      if (event.key >= "1" && event.key <= "9" && !metaKey) {
        const noteIndex = parseInt(event.key) - 1;
        if (noteIndex < notes.length) {
          event.preventDefault();
          setActiveNoteId(notes[noteIndex].id);
          toast.success(`Switched to note ${event.key}`);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [notes, activeNoteId, handleDuplicateNote, handleCreateNote, handleDeleteNote]);

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
            onToggleImportant={toggleImportant}
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
                    Cmd/Ctrl+K/N
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Save note</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+S
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Duplicate note</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+D
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Mark important</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+I
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Delete note</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+Del
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Search notes</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Cmd/Ctrl+F
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Navigate notes</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    ↑/↓
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Quick select</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    1-9
                  </kbd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Clear selection</span>
                  <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                    Esc
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
