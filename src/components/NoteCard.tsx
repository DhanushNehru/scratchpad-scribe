import { Note } from '@/types/note';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
}

export function NoteCard({ note, isActive, onClick }: NoteCardProps) {
  // Strip HTML tags for plain text preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const preview = note.content ? stripHtml(note.content).slice(0, 100) : 'No content';
  
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
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        {preview}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
      </p>
    </Card>
  );
}
