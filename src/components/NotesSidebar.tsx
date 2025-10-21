// path: components/NotesSidebar.tsx
import { Note } from "@/types/note";
import { NoteCard } from "./NoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, FileDown, LogIn, LogOut } from "lucide-react";
import jsPDF from "jspdf";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme/themeToggle";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { AuthModal } from "@/components/ui/AuthModal";
import { showToast } from "@/lib/toast";

interface NotesSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDuplicateNote?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotesSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDelete
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { isLoggedIn, logout, user } = useCurrentUser(); // reactive to login/logout

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAuthAction = () => {
    if (isLoggedIn) {
      logout(); // logout instantly
      showToast("Logged out successfully", "success");
    } else {
      setIsAuthOpen(true); // open modal
    }
  };

  const handleLoginSuccess = (loggedInUser: { username?: string; email?: string }) => {
    setIsAuthOpen(false);
    showToast(`Welcome back, ${loggedInUser.username || loggedInUser.email}!`, "success");
  };


  const handleExportPDF = () => {
    if (!activeNoteId) return;
    const activeNote = notes.find((note) => note.id === activeNoteId);
    if (!activeNote) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    doc.setFontSize(16);
    doc.text(activeNote.title || "Untitled Note", margin, margin);

    doc.setFontSize(12);
    const contentLines = doc.splitTextToSize(activeNote.content, contentWidth);

    let yOffset = margin + 10;
    const lineHeight = 7;

    contentLines.forEach((line: string) => {
      if (yOffset > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yOffset = margin;
      }
      doc.text(line, margin, yOffset);
      yOffset += lineHeight;
    });

    doc.save(`${activeNote.title || "note"}.pdf`);
  };

  return (
    <div className="w-screen md:w-80 border-r bg-secondary/30 flex flex-col h-screen">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle/>
            <Button
              disabled={notes.length === 0 || !activeNoteId}
              onClick={() => {
                if (!activeNoteId) return;

                const activeNote = notes.find(note => note.id === activeNoteId);
                if (!activeNote) return;

                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 10;
                const contentWidth = pageWidth - (margin * 2);

                doc.setFontSize(16);
                doc.text(activeNote.title || 'Untitled Note', margin, margin);

                doc.setFontSize(12);
                const contentLines = doc.splitTextToSize(activeNote.content, contentWidth);

                let yOffset = margin + 10;
                const lineHeight = 7;

                contentLines.forEach((line: string) => {
                  if (yOffset > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    yOffset = margin;
                  }
                  doc.text(line, margin, yOffset);
                  yOffset += lineHeight;
                });

                doc.save(`${activeNote.title || 'note'}.pdf`);
              }}
              size="icon"
              variant="outline"
              className="hover:bg-secondary"
              title={notes.length === 0 || !activeNoteId ? "Select a note to export" : "Export as PDF"}
            >
              <FileDown className="h-5 w-5" />
            </Button>
            <Button onClick={onCreateNote} size="icon" variant="default" title="Create Note">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="relative px-4">
          <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No notes found" : "No notes yet. Create one!"}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onClick={() => onSelectNote(note.id)}
                onDelete={() => onDelete(note.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Greeting + Login/Logout */}
      <div className="p-4 border-t flex flex-col items-center gap-2">
        {isLoggedIn && (
          <div className="text-sm font-medium text-foreground">
            Hello, {user?.username || user?.email}!
          </div>
        )}

        <Button
          onClick={handleAuthAction}
          size="sm"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          {isLoggedIn ? (
            <>
              <LogOut className="h-4 w-4" /> Logout
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Login
            </>
          )}
        </Button>
      </div>

      {/* Auth modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess} // pass callback
      />
    </div>
  );
}
