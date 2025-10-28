import { Note, formatTimestamp, getRelativeTime } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Copy, Star, Paperclip, Link, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge'; // Import Badge

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
}

export function NoteCard({ note, isActive, onClick, onDelete, onDuplicate, onToggleFavorite, onRename }: NoteCardProps) {
  const preview = note.content.slice(0, 100) || 'No content';
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(note.title);

  return (
    <Card
      className={`p-4 cursor-pointer transition-all justify-between flex hover:shadow-md ${
        isActive ? 'ring-2 ring-primary bg-accent/5' : ''
      }`}
      onClick={onClick}
    >
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
          {/* Favorite */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleFavorite) onToggleFavorite(note.id);
            }}
            title={note.favorite ? 'Unfavorite' : 'Add to favorites'}
          >
            <Star className={`h-5 w-5 ${note.favorite ? 'text-yellow-400' : ''}`} />
          </Button>

          {/* Copy Link */}
          <Button
            variant="ghost"
            size="icon"
            onClick={async (e) => {
              e.stopPropagation();
              
              // Create shareable link with note ID as query parameter
              const shareUrl = `${window.location.origin}${window.location.pathname}?note=${note.id}`;
              
              try {
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(shareUrl);
                  showToast('Note link copied to clipboard', 'success');
                } else {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = shareUrl;
                  textArea.style.position = 'fixed';
                  textArea.style.opacity = '0';
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  showToast('Note link copied to clipboard', 'success');
                }
              } catch (err) {
                console.error('Copy link failed', err);
                showToast('Could not copy link', 'error');
              }
            }}
            title="Copy link to note"
          >
            <Link className="h-5 w-5" />
          </Button>

          {/* Duplicate Note (Copy) */}
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

          {/* Rename button */}
          {onRename && (
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewTitle(note.title);
                  }}
                  title="Rename note"
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Rename Note</DialogTitle>
                  <DialogDescription>
                    Enter a new name for this note.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Note title..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newTitle.trim()) {
                        onRename(note.id, newTitle.trim());
                        setIsRenameOpen(false);
                        showToast('Note renamed successfully', 'success');
                      }
                    }
                  }}
                  autoFocus
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRenameOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (newTitle.trim()) {
                        onRename(note.id, newTitle.trim());
                        setIsRenameOpen(false);
                        showToast('Note renamed successfully', 'success');
                      }
                    }}
                    disabled={!newTitle.trim()}
                  >
                    Rename
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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