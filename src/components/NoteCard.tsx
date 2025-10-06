import { Note, formatTimestamp, getRelativeTime } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLocation } from 'react-router-dom';
interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function NoteCard({ note, isActive, onClick, onDelete, onDuplicate }: NoteCardProps) {
  const path = useLocation()?.pathname;
    const deletePage = path === '/recycle-bin';
  const preview = note.content.slice(0, 100) || 'No content';

  return (
    <Card
      className={`p-4 cursor-pointer transition-all justify-between flex hover:shadow-md ${
        isActive ? 'ring-2 ring-primary bg-accent/5' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col">
        <h3 className="font-semibold text-foreground mb-1 truncate font-serif">
          {note.title || 'Untitled Note'}
        </h3>
        
        {/* Timestamp Display */}
        <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatTimestamp(note.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Edited {getRelativeTime(note.updatedAt)}</span>
          </div>
        </div>
        </div>

      <div className="flex justify-center items-center">
        <div className="flex gap-2 items-center">
          {/* Duplicate button (optional) */}
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(note.id);
              }}
              title="Duplicate note"
            >
              <Copy className="h-5 w-5" />
            </Button>          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive/80"
                onClick={(e) => e.stopPropagation()} // prevent opening editor
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  { 
                  deletePage ? "This note will be permanently deleted and cannot be recovered. Are you sure you want to continue?" :
                  "This note will be moved to the recycle bin and can be restored later. Are you sure you want to continue?"
                }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(note.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
