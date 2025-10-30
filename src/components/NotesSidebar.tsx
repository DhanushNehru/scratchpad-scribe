// path: components/NotesSidebar.tsx
import { Note } from "@/types/note";
import { NoteCard } from "./NoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, FileDown, LogIn, LogOut, Pin } from "lucide-react";
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
  onTogglePin?: (id: string) => void;
  onOpenPinned?: () => void;
}

export function NotesSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDelete,
  onDuplicateNote,
  onTogglePin,
  onOpenPinned,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { isLoggedIn, logout, user } = useCurrentUser(); // reactive to login/logout

  const filteredNotes = notes.filter(
    (note) => {
      const query = searchQuery.toLowerCase();
      const rawQuery = searchQuery; // Use raw query for emoji matching

      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);

      // UPDATED: Filtering must work by searching for the tag label OR the tag emoji.
      const tagMatch = (note.tags || []).some(tag =>
        tag.label.toLowerCase().includes(query) ||
        tag.emoji.includes(rawQuery) // Check the emoji directly against the search query
      );

      return titleMatch || contentMatch || tagMatch;
    }
  );

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

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

  return (
    <div className="w-screen md:w-96 border-r bg-secondary/30 flex flex-col h-screen">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="hover:bg-secondary"
              title={notes.some(n => n.pinned) ? "Open all pinned in main" : "No pinned notes"}
              disabled={!notes.some(n => n.pinned)}
              onClick={() => onOpenPinned && onOpenPinned()}
            >
              <Pin className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button
              disabled={notes.length === 0 || !activeNoteId}
              onClick={() => {
                if (!activeNoteId) return;

                const activeNote = notes.find(note => note.id === activeNoteId);
                if (!activeNote) return;

                try {
                  const doc = new jsPDF();
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const margin = 10;
                  const contentWidth = pageWidth - (margin * 2);

                  const safeTitle = (activeNote.title || 'Untitled Note').trim();
                  doc.setFontSize(16);
                  doc.text(safeTitle, margin, margin);

                  doc.setFontSize(10);
                  const tagString = (activeNote.tags || []).map(t => `${t.emoji} ${t.label}`).join(', ');
                  if (tagString) {
                    doc.text(`Tags: ${tagString}`, margin, margin + 5);
                  }

                  doc.setFontSize(12);
                  const content = typeof activeNote.content === 'string' ? activeNote.content : '';
                  const contentLines = doc.splitTextToSize(content, contentWidth);

                  let yOffset = margin + 15;
                  const lineHeight = 7;

                  contentLines.forEach((line: string) => {
                    if (yOffset > doc.internal.pageSize.getHeight() - margin) {
                      doc.addPage();
                      yOffset = margin;
                    }
                    doc.text(line, margin, yOffset);
                    yOffset += lineHeight;
                  });

                  const fileName = `${safeTitle.replace(/[\\/:*?"<>|]/g, '_')}.pdf`;
                  doc.save(fileName);
                  showToast(`"${safeTitle}" exported to PDF.`, "success");
                } catch (err) {
                  console.error('PDF export failed', err);
                  showToast('There was a problem exporting this note.', 'error');
                }
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, tags, or emojis..." // Updated placeholder
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No matching notes, tags, or emojis found" : "No notes yet. Create one!"}
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Pinned</div>
                  <div className="space-y-2">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isActive={note.id === activeNoteId}
                        onClick={() => onSelectNote(note.id)}
                        onDelete={onDelete || (() => { })}
                        onDuplicate={onDuplicateNote}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                {pinnedNotes.length > 0 && (
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mt-2 mb-2">Others</div>
                )}
                <div className="space-y-2">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isActive={note.id === activeNoteId}
                      onClick={() => onSelectNote(note.id)}
                      onDelete={onDelete || (() => { })}
                      onDuplicate={onDuplicateNote}
                      onTogglePin={onTogglePin}
                    />
                  ))}
                </div>
              </div>
            </>
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
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}