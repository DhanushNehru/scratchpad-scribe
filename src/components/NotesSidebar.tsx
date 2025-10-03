import { Note } from '@/types/note';
import { NoteCard } from './NoteCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, FileDown, Trash2, Home } from 'lucide-react';
import jsPDF from 'jspdf';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from "@/components/theme/themeToggle";
import { Link, useLocation } from 'react-router-dom';

interface NotesSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDelete: (id: string) => void;
}

export function NotesSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDelete,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const path = useLocation()?.pathname
  const deletePage = path === '/recycle-bin'

  console.log(notes)
  console.log(activeNoteId)

  const filteredNotes = notes.filter(
    (note) =>
      (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())) && (!!note?.deleted === deletePage)
  );

  return (
    <div className="w-screen md:w-80 border-r bg-secondary/30 flex flex-col h-screen">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{ deletePage ? "Recycle Bin" : "Notes"}</h1>
          <div className="flex items-center gap-2">
            {!deletePage &&  (
              <>
                <ThemeToggle />
                <Button
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
                >
                  <FileDown className="h-5 w-5" />
                </Button>
                <Button onClick={onCreateNote} size="icon" variant="default">
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {(searchQuery ? 'No notes found' : (deletePage ? 'Recycle Bin is empty' : 'No notes yet. Create one!'))}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onClick={() => onSelectNote(note.id)}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="border-t">
        {!deletePage ? (
          <Link to="/recycle-bin" className="w-full">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-14 pl-4 justify-start text-red-600 hover:text-red-700 hover:bg-red-300 dark:hover:bg-red-950 rounded-none"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Recycle Bin
            </Button>
          </Link>
        ) : (
          <Link to="/" className="w-full">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-14 pl-4 justify-start rounded-none"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
