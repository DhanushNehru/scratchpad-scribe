import { Note, formatTimestamp, getRelativeTime } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Copy, Share2, Mail, Link as LinkIcon, Pin, PinOff } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge'; // Import Badge
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showToast } from '@/lib/toast';

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

export function NoteCard({ note, isActive, onClick, onDelete, onDuplicate, onTogglePin }: NoteCardProps) {
  const preview = note.content.slice(0, 100) || 'No content';

  return (
    <Card
      className={`relative p-4 cursor-pointer transition-all justify-between flex hover:shadow-md ${
        isActive ? 'ring-2 ring-primary bg-accent/5' : ''
      }`}
      onClick={onClick}
    >
      {onTogglePin && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 hover:bg-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note.id);
          }}
          title={note.pinned ? 'Unpin note' : 'Pin note'}
          aria-pressed={note.pinned}
        >
          <Pin
            className={`${note.pinned ? 'text-primary' : ''} h-4 w-4`}
            fill={note.pinned ? 'currentColor' : 'none'}
          />
        </Button>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="font-semibold text-foreground mb-1 truncate font-serif">
          {note.title || 'Untitled Note'}
        </h3>
        
        {/* Tags Display - NEW UI */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.tags.map(tag => (
              // Display tag as [emoji] [text]
              <Badge key={tag.label} variant="outline" className="text-xs px-1.5 py-0.5 font-normal border-primary/50 text-primary/80 dark:border-primary-foreground/20 dark:text-primary-foreground/80">
                {tag.emoji} {tag.label}
              </Badge>
            ))}
          </div>
        )}
        
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
          {/* Share menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                title="Share note"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={async () => {
                  const url = `${window.location.origin}${window.location.pathname}?note=${note.id}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: note.title || 'Untitled Note',
                        text: preview,
                        url,
                      });
                      showToast('Shared successfully', 'success');
                    } catch {
                      // user canceled or share failed; do nothing
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(url);
                      showToast('Link copied to clipboard', 'success');
                    } catch {
                      showToast('Unable to copy link', 'error');
                    }
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4" /> Share...
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const url = `${window.location.origin}${window.location.pathname}?note=${note.id}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    showToast('Link copied to clipboard', 'success');
                  } catch {
                    showToast('Unable to copy link', 'error');
                  }
                }}
              >
                <LinkIcon className="mr-2 h-4 w-4" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?note=${note.id}`;
                  const subject = encodeURIComponent(note.title || 'Note');
                  const body = encodeURIComponent(`${preview}\n\n${url}`);
                  window.location.href = `mailto:?subject=${subject}&body=${body}`;
                }}
              >
                <Mail className="mr-2 h-4 w-4" /> Share via email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-white"
                onClick={(e) => e.stopPropagation()} // prevent opening editor
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this note?
                  <span className="font-semibold text-destructive"> "{note.title || 'Untitled Note'}"</span>?
                  This action cannot be undone.
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