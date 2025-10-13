import { Note, formatTimestamp, getRelativeTime } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Copy, Star } from 'lucide-react';
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
  onToggleImportant?: (id: string) => void;
}

export function NoteCard({ note, isActive, onClick, onDelete, onDuplicate, onToggleImportant }: NoteCardProps) {
  const preview = note.content.slice(0, 100) || 'No content';

  return (
    <Card
      className={`p-4 cursor-pointer transition-all justify-between flex hover:shadow-md ${
        isActive ? 'ring-2 ring-primary bg-accent/5' : ''
      } ${note.isImportant ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate font-serif">
            {note.title || 'Untitled Note'}
          </h3>
          {note.isImportant && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
          )}
        </div>
        
        {/* Content preview */}
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {preview}
        </p>
        
        {/* Timestamp Display with improved spacing */}
        <div className="flex flex-col gap-1 pt-2 border-t border-border/50 mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Created: {formatTimestamp(note.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Edited {getRelativeTime(note.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center ml-2">
        <div className="flex gap-1 items-center">
          {/* Important toggle button */}
          {onToggleImportant && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onToggleImportant(note.id);
              }}
              title={note.isImportant ? "Remove from important" : "Mark as important"}
            >
              <Star className={`h-4 w-4 md:h-5 md:w-5 ${note.isImportant ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
            </Button>
          )}

          {/* Duplicate button (optional) */}
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(note.id);
              }}
              title="Duplicate note"
            >
              <Copy className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:text-destructive/80 touch-manipulation"
                onClick={(e) => e.stopPropagation()} // prevent opening editor
                title="Delete note"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(note.id)} 
                  className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
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
