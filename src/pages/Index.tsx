import { useState, useEffect, useCallback } from "react";
import { useNotes } from "@/hooks/useNotes";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { notes, createNote, updateNote, deleteNote, duplicateNote } =
    useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

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

  const handleDeleteRequest = (id: string) => {
    setNoteToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (noteToDelete) {
      handleDeleteNote(noteToDelete);
      toast.success("Note deleted");
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setNoteToDelete(null);
  };

  const handleDuplicateNote = useCallback(
    (id: string) => {
      const newId = duplicateNote(id);
      if (newId) setActiveNoteId(newId);
    },
    [duplicateNote]
  );

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
      const key = event.key.toLowerCase();
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      // Handle Ctrl/Cmd + key combinations
      if (isCtrlOrMeta && !isShift) {
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
            if (currentNote) {
              toast.success("Notes are saved automatically");
            }
            break;
          }
          case "d": {
            event.preventDefault();
            event.stopPropagation();
            if (activeNoteId) {
              handleDeleteRequest(activeNoteId);
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

      // Handle Ctrl/Cmd + Shift + key combinations
      if (isCtrlOrMeta && isShift) {
        switch (key) {
          case "d": {
            event.preventDefault();
            event.stopPropagation();
            if (activeNoteId) {
              handleDuplicateNote(activeNoteId);
              toast.success("Note duplicated");
            }
            break;
          }
        }
      }

      // Handle Shift + key combinations (without Ctrl/Cmd)
      if (isShift && !isCtrlOrMeta) {
        switch (key) {
          case "d": {
            event.preventDefault();
            event.stopPropagation();
            if (activeNoteId) {
              handleDuplicateNote(activeNoteId);
              toast.success("Note duplicated");
            }
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
    <>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    <span>Delete note</span>
                    <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                      Cmd/Ctrl+D
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Duplicate note</span>
                    <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono">
                      Ctrl+Shift+D
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
    </>
  );
};

export default Index;
