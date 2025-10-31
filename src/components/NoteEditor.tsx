import { useState, useEffect, useMemo } from "react";
import { Note, formatTimestamp, getRelativeTime, AttachmentMeta } from "@/types/note";
import { showToast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Clock, X, Smile } from "lucide-react";
import ShareModal from "./ShareModal"; // <-- new

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
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
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

export function NoteEditor({
  note,
  onUpdate,
  onDelete,
  onAddAttachments,
  onRemoveAttachment,
  onGetAttachmentBlob,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<Tag[]>(note.tags || []);
  const [newTagInput, setNewTagInput] = useState<{ emoji: string; label: string }>({
    emoji: "🏷️",
    label: "",
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showShare, setShowShare] = useState(false); // ✅ moved inside component

  const KEYWORD_SUGGESTIONS: { keyword: string; emoji: string; label: string }[] = [
    { keyword: "bug", emoji: "🐛", label: "Bug" },
    { keyword: "error", emoji: "🐞", label: "Issue" },
    { keyword: "todo", emoji: "✅", label: "Task" },
    { keyword: "fix", emoji: "🛠️", label: "Fix" },
    { keyword: "plan", emoji: "📅", label: "Planning" },
    { keyword: "idea", emoji: "💡", label: "Idea" },
    { keyword: "concept", emoji: "🧠", label: "Concept" },
    { keyword: "project", emoji: "🚀", label: "Project" },
  ];

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
    if (trimmedLabel !== "") {
      const existing = tags.find(
        (t) => t.label.toLowerCase() === trimmedLabel.toLowerCase()
      );
      if (existing) {
        setNewTagInput({ emoji: "🏷️", label: "" });
        return;
      }

      const tag: Tag = {
        emoji: newTagInput.emoji,
        label: trimmedLabel,
      };
      setTags([...tags, tag]);
      setNewTagInput({ emoji: "🏷️", label: "" });
    }
  };

  const handleRemoveTag = (label: string) => {
    setTags(tags.filter((t) => t.label !== label));
  };

  const handleEmojiSelect = (emojiData: { native: string }) => {
    setNewTagInput({ ...newTagInput, emoji: emojiData.native });
    setIsPopoverOpen(false);
  };

  const triggerFileDialog = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,application/pdf";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.onchange = async () => {
      const files = input.files;
      if (!files) return;
      if (onAddAttachments) {
        try {
          await onAddAttachments(note.id, files);
          showToast(`${files.length} file(s) attached.`, "success");
        } catch (e) {
          showToast("Unable to attach selected file(s).", "error");
        }
      }
      input.remove();
    };
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
    const a = document.createElement("a");
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
    const existingLabels = new Set(currentTags.map((t) => t.label.toLowerCase()));
    const existingEmojis = new Set(currentTags.map((t) => t.emoji));
    const suggestions: Tag[] = [];

    for (const { keyword, emoji, label } of KEYWORD_SUGGESTIONS) {
      if (
        lowerContent.includes(keyword) &&
        !existingLabels.has(label.toLowerCase()) &&
        !existingEmojis.has(emoji)
      ) {
        suggestions.push({ emoji, label });
        if (suggestions.length >= 3) break;
      }
    }
    return suggestions;
  };

  const suggestedTags = useMemo(() => getSuggestions(content, tags), [content, tags]);

  const handleApplySuggestion = (suggestion: Tag) => {
    setTags((prev) => {
      const existing = prev.find((t) => t.label === suggestion.label);
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

        <div className="flex items-center gap-2">
          {/* Delete Button */}
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
                  Are you sure you want to delete this note? This action cannot be undone.
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

          {/* Share Button */}
          <button
            onClick={() => setShowShare(true)}
            className="px-3 py-1 border rounded hover:bg-gray-100"
            title="Share (read-only)"
          >
            Share
          </button>
        </div>
      </div>

      {/* --- Tags, Time, Attachments, and Editor (unchanged) --- */}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed"
        placeholder="Start writing..."
      />

      {showShare && (
        <ShareModal noteId={note.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
