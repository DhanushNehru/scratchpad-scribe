import { useState, useEffect, useMemo } from "react";
import { Note, formatTimestamp, getRelativeTime, AttachmentMeta } from "@/types/note";
import { showToast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Clock, X, Smile } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


// --- START: THIRD-PARTY EMOJI LIBRARY IMPORTS ---
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
// --- END: THIRD-PARTY EMOJI LIBRARY IMPORTS ---


interface Tag {
  emoji: string;
  label: string;
}

interface NoteEditorProps {
  note: Note & { tags?: Tag[] };
  onUpdate: (
    id: string,
    updates: Partial<Pick<Note, "title" | "content" | "attachments"> & { tags?: Tag[] }>
  ) => void;
  onDelete: (id: string) => void;
  onAddAttachments?: (id: string, files: FileList | File[]) => Promise<void> | void;
  onRemoveAttachment?: (id: string, attachmentId: string) => Promise<void> | void;
  onGetAttachmentBlob?: (attachmentId: string) => Promise<Blob | undefined>;
}

const KEYWORD_SUGGESTIONS: { keyword: string, emoji: string, label: string }[] = [
  { keyword: "bug", emoji: "🐛", label: "Bug" },
  { keyword: "error", emoji: "🐞", label: "Issue" },
  { keyword: "todo", emoji: "✅", label: "Task" },
  { keyword: "fix", emoji: "🛠️", label: "Fix" },
  { keyword: "plan", emoji: "📅", label: "Planning" },
  { keyword: "idea", emoji: "💡", label: "Idea" },
  { keyword: "concept", emoji: "🧠", label: "Concept" },
  { keyword: "project", emoji: "🚀", label: "Project" },
];

export function NoteEditor({ note, onUpdate, onDelete, onAddAttachments, onRemoveAttachment, onGetAttachmentBlob }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<Tag[]>(note.tags || []);
  const [newTagInput, setNewTagInput] = useState<{ emoji: string; label: string }>({ emoji: '🏷️', label: '' });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
  }, [note.id, note.title, note.content, note.tags]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        JSON.stringify(tags) !== JSON.stringify(note.tags)
      ) {
        onUpdate(note.id, { title, content, tags });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, content, tags, note.id, note.title, note.content, note.tags, onUpdate]);

  const handleAddTag = () => {
    const trimmedLabel = newTagInput.label.trim();
    if (trimmedLabel !== '') {
      const existing = tags.find(t => t.label.toLowerCase() === trimmedLabel.toLowerCase());
      if (existing) {
        setNewTagInput({ emoji: '🏷️', label: '' });
        return;
      }

      const tag: Tag = {
        emoji: newTagInput.emoji,
        label: trimmedLabel,
      };
      setTags([...tags, tag]);
      setNewTagInput({ emoji: '🏷️', label: '' });
    }
  };

  const handleRemoveTag = (label: string) => {
    setTags(tags.filter(t => t.label !== label));
  };

  const handleEmojiSelect = (emojiData: { native: string }) => {
    setNewTagInput({ ...newTagInput, emoji: emojiData.native });
    setIsPopoverOpen(false);
  };

  const triggerFileDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    // Hide input but attach to DOM to ensure reliable change event firing across browsers
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.width = '0';
    input.style.height = '0';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.onchange = async () => {
      const files = input.files;
      if (!files) return;
      if (onAddAttachments) {
        try {
          await onAddAttachments(note.id, files);
          showToast(`${files.length} file(s) attached.`, 'success');
        } catch (e) {
          showToast('Unable to attach selected file(s).', 'error');
        }
      }
      // Clean up the input element
      input.remove();
    };
    // Fallback cleanup in case user cancels selection (onchange won't fire)
    setTimeout(() => {
      if (document.body.contains(input)) {
        input.remove();
      }
    }, 10000);
    input.click();
  };

  const handleDownload = async (attachment: AttachmentMeta) => {
    if (!onGetAttachmentBlob) return;
    const blob = await onGetAttachmentBlob(attachment.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleRemove = async (attachment: AttachmentMeta) => {
    if (onRemoveAttachment) {
      await onRemoveAttachment(note.id, attachment.id);
    }
  };

  const getSuggestions = (noteContent: string, currentTags: Tag[]): Tag[] => {
    if (!noteContent || currentTags.length >= 5) return [];

    const lowerContent = noteContent.toLowerCase();
    const existingLabels = new Set(currentTags.map(t => t.label.toLowerCase()));
    const existingEmojis = new Set(currentTags.map(t => t.emoji));

    const suggestions: Tag[] = [];

    for (const { keyword, emoji, label } of KEYWORD_SUGGESTIONS) {
      if (lowerContent.includes(keyword) &&
        !existingLabels.has(label.toLowerCase()) &&
        !existingEmojis.has(emoji)) {
        suggestions.push({ emoji, label });
        if (suggestions.length >= 3) break;
      }
    }

    return suggestions;
  };

  const suggestedTags = useMemo(() => getSuggestions(content, tags), [content, tags]);

  const handleApplySuggestion = (suggestion: Tag) => {
    setTags(prev => {
      const existing = prev.find(t => t.label === suggestion.label);
      if (existing) return prev;
      return [...prev, suggestion];
    });
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 mb-2"
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
                Are you sure you want to delete this note
                <span className="font-semibold text-destructive"> "{note.title || 'Untitled Note'}"</span>?
                This action cannot be undone.
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

      {/* Tags Display and Editor */}
      <div className="flex flex-col gap-2 pb-2 border-b border-border/50 dark:border-border/50">
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.label}
              variant="secondary"
              className="cursor-pointer group hover:bg-destructive/10 dark:hover:bg-destructive/10"
              onClick={() => handleRemoveTag(tag.label)}
            >
              {tag.emoji} {tag.label}
              <X className="w-3 h-3 ml-1 text-muted-foreground group-hover:text-destructive" />
            </Badge>
          ))}
        </div>

        {/* New Tag Input */}
        <div className="flex items-center gap-1.5 pt-2">
          {/* EMOJI PICKER INTEGRATION */}
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="text-lg p-0 w-8 h-8 flex-shrink-0 relative"
                title="Select Emoji"
              >
                {/* Show selected emoji or a smile icon */}
                {newTagInput.emoji === '🏷️' ? <Smile className="w-4 h-4" /> : null}
                {/* Overlay the actual emoji if one is selected */}
                {newTagInput.emoji !== '🏷️' &&
                  <span className="absolute text-base pointer-events-none">{newTagInput.emoji}</span>
                }
              </Button>
            </PopoverTrigger>
            {/* PopoverContent houses the library Picker component */}
            <PopoverContent className="w-[300px] p-0" side="bottom" align="start">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="auto"
                previewPosition="none"
                // REMOVED: searchPosition="none" -> The search bar is now visible by default
                categories={['frequent', 'people', 'nature', 'food', 'activity', 'travel', 'objects', 'symbols']}
              />
            </PopoverContent>
          </Popover>

          <Input
            value={newTagInput.label}
            onChange={(e) => setNewTagInput({ ...newTagInput, label: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag label..."
            className="h-8 text-sm flex-1"
            maxLength={30}
          />
          <Button
            size="sm"
            onClick={handleAddTag}
            disabled={newTagInput.label.trim() === '' || tags.length >= 5}
            title={tags.length >= 5 ? "Max 5 tags allowed" : "Add Tag"}
          >
            Add Tag
          </Button>
        </div>

        {/* Suggested Tags based on Content */}
        {suggestedTags.length > 0 && tags.length < 5 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Suggestions:</span>
            {suggestedTags.map((tag) => (
              <Badge
                key={tag.label}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleApplySuggestion(tag)}
                title={`Click to add ${tag.label} tag`}
              >
                {tag.emoji} {tag.label}
              </Badge>
            ))}
          </div>
        )}

        {tags.length >= 5 && <p className="text-xs text-muted-foreground text-right pt-1">Max 5 tags per note</p>}
      </div>


      {/* Timestamp Display */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground pb-2 mt-1">
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
      {/* Attachments Section */}
      <div className="mt-4 border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-foreground">Attachments</div>
          <Button size="sm" variant="outline" onClick={triggerFileDialog}>Add files</Button>
        </div>
        {note.attachments && note.attachments.length > 0 ? (
          <div className="space-y-2">
            {note.attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between text-sm bg-muted/40 rounded px-2 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate max-w-[260px]" title={`${att.name} (${Math.round(att.size / 1024)} KB)`}>{att.name}</span>
                  <span className="text-muted-foreground text-xs">{Math.round(att.size / 1024)} KB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(att)}>Download</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemove(att)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No attachments</div>
        )}
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