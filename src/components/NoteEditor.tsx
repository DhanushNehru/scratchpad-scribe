import { useState, useEffect } from 'react';
import { Note, formatTimestamp, getRelativeTime } from '@/types/note';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Clock } from 'lucide-react';
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

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onDelete: (id: string) => void;
}

export function NoteEditor({ note, onUpdate, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        onUpdate(note.id, { title, content });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, content, note.id, note.title, note.content, onUpdate]);

  return (
   <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            placeholder="Note title..."
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:text-white touch-manipulation" 
                title="Delete Note"
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

        {/* Timestamp Display with improved spacing */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-6 px-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Created: {formatTimestamp(note.createdAt)}</span>
          </div>
          <span className="text-muted-foreground/40 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Edited {getRelativeTime(note.updatedAt)}</span>
          </div>
        </div>
        
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed px-1"
        placeholder="Start writing..."
      />
    </div>
  );
}
