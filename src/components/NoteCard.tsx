import { Note, formatTimestamp, getRelativeTime } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
}

export function NoteCard({ note, isActive, onClick }: NoteCardProps) {
  const preview = note.content.slice(0, 100) || 'No content';
  
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary bg-accent/5' : ''
      }`}
      onClick={onClick}
    >
      <h3 className="font-semibold text-foreground mb-1 truncate">
        {note.title || 'Untitled Note'}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {preview}
      </p>
      
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
    </Card>
  );
}