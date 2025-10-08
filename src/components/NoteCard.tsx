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

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function NoteCard({ note, isActive, onClick, onDelete, onDuplicate }: NoteCardProps) {
  const preview = note.content.slice(0, 100) || 'No content';

  return (
    <Card
      className={`p-4 rounded-xl cursor-pointer transition-all flex flex-col gap-2 shadow-sm border border-border hover:shadow-lg ${
        isActive ? 'ring-2 ring-primary bg-accent/10 border-primary' : 'bg-card'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-lg text-foreground truncate font-serif">
          {note.title || 'Untitled Note'}
        </h3>
        <p className="text-xs text-muted-foreground font-sans">
          {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
        </p>
      </div>
      <p className="text-sm text-muted-foreground truncate mb-2">
        {preview}
      </p>
      <div className="flex justify-end items-center mt-auto">
        <AlertDialog>
          <AlertDialogTrigger asChild>
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
            </Button>
          )}

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
                  Are you sure you want to delete this note? This action cannot be undone.
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
