import { useState, useEffect } from 'react';
import { Note, AttachmentMeta } from '@/types/note';
import { deleteAttachment as idbDelete, getAttachment as idbGet, putAttachment as idbPut } from '@/lib/attachments';

const STORAGE_KEY = 'notes-app-data';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const notesWithDates = parsed.map((note: Note & { createdAt: string; updatedAt: string; attachments?: (AttachmentMeta & { createdAt: string })[] }) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          attachments: (note.attachments || []).map((a) => ({ ...a, createdAt: new Date(a.createdAt) })),
        }));
        setNotes(notesWithDates);
      } catch (error) {
        console.error('Failed to parse notes from localStorage:', error);
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const getUniqueTitle = (baseTitle: string, excludeId?: string) => {
    const escapedBase = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + escapedBase + '(?: \\(([0-9]+)\\))?$');
    let max = 0;
    let hasExactMatch = false;
    notes.forEach((n) => {
      if (excludeId && n.id === excludeId) return;
      const m = n.title.match(regex);
      if (m) {
        const num = m[1] ? parseInt(m[1], 10) : 0;
        if (!isNaN(num)) {
          if (num > max) max = num;
          if (num === 0) hasExactMatch = true;
        }
      }
    });

    if (hasExactMatch || max > 0) {
      return `${baseTitle} (${max + 1})`;
    }
    return baseTitle;
  };

  const createNote = () => {
    const title = getUniqueTitle('Untitled Note');
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      attachments: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote.id;
  };

  const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'attachments'>>) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === id) {
          const updatedNote = { ...note, ...updates, updatedAt: new Date() };
          // If title is being updated, ensure it's unique
          if (updates.title !== undefined) {
            updatedNote.title = getUniqueTitle(updates.title, id);
          }
          return updatedNote;
        }
        return note;
      })
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const duplicateNote = (id: string) => {
    const newId = crypto.randomUUID();

    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;

      const original = prev[idx];

      // Determine base title (remove any existing numbering)
      const baseTitle = original.title.replace(/\s*\(\d+\)$/, '');

      // Get unique title for the duplicate
      const newTitle = getUniqueTitle(baseTitle);

      const duplicated: Note = {
        ...original,
        id: newId,
        title: newTitle,
        // Treat duplicated note as newly created/updated
        createdAt: new Date(),
        updatedAt: new Date(),
        pinned: false,
        // Do not copy attachments by default to avoid duplicating large blobs silently
        attachments: [],
      };

      // Insert duplicated note immediately after the original
      const next = [...prev.slice(0, idx + 1), duplicated, ...prev.slice(idx + 1)];

      return next;
    });

    return newId;
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned, updatedAt: new Date() } : note
      )
    );
  };

  const addAttachments = async (id: string, files: FileList | File[]) => {
    const filesArray = Array.from(files as Iterable<File>);
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB per file
    const ALLOWED_PREFIXES = [
      'image/',
      'application/pdf',
    ];
    const metas: AttachmentMeta[] = [];
    for (const file of filesArray) {
      if (file.size > MAX_SIZE) {
        console.warn(`File too large: ${file.name}`);
        continue;
      }
      if (file.type && !ALLOWED_PREFIXES.some(p => file.type.startsWith(p))) {
        console.warn(`Unsupported file type: ${file.name} (${file.type})`);
        continue;
      }
      const attachmentId = crypto.randomUUID();
      await idbPut(attachmentId, file);
      metas.push({
        id: attachmentId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        createdAt: new Date(),
      });
    }
    if (metas.length === 0) {
      throw new Error('No supported files to add');
    }
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              attachments: [...(note.attachments || []), ...metas],
              updatedAt: new Date(),
            }
          : note
      )
    );
  };

  const removeAttachment = async (id: string, attachmentId: string) => {
    await idbDelete(attachmentId);
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              attachments: (note.attachments || []).filter((a) => a.id !== attachmentId),
              updatedAt: new Date(),
            }
          : note
      )
    );
  };

  const getAttachmentBlob = async (attachmentId: string) => {
    return await idbGet(attachmentId);
  };

  return {
    notes,
    createNote,
    updateNote,
    deleteNote,
    duplicateNote,
    togglePin,
    addAttachments,
    removeAttachment,
    getAttachmentBlob,
  };
}
