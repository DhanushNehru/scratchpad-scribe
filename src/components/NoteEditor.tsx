import { useState, useEffect } from "react";
import { Note, formatTimestamp, getRelativeTime } from "@/types/note";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Clock } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

interface NoteEditorProps {
  note: Note;
  onUpdate: (
    id: string,
    updates: Partial<Pick<Note, "title" | "content">>
  ) => void;
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
      <div className="flex items-center justify-between">
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
              className="text-destructive hover:text-white"
              title="Delete Note"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this note? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(note.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Timestamp Display */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground pb-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>Created: {formatTimestamp(note.createdAt)}</span>
        </div>
        <span className="text-muted-foreground/40">•</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Edited {getRelativeTime(note.updatedAt)}</span>
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed"
        placeholder="Start writing..."
      />
    </div>
  );
}
