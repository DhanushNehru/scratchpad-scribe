import { useState, useEffect } from 'react';
import { Note } from '@/types/note';

const STORAGE_KEY = 'notes-app-data';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const notesWithDates = parsed.map((note: Note & { createdAt: string; updatedAt: string }) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
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
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote.id;
  };

  const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
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

  const softDeleteNote = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, deleted: true } : note
      )
    );
  }
  
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
      };

      // Insert duplicated note immediately after the original
      const next = [...prev.slice(0, idx + 1), duplicated, ...prev.slice(idx + 1)];

      return next;
    });

    return newId;
  };

  return {
    notes,
    createNote,
    updateNote,
    deleteNote,
    softDeleteNote,
    duplicateNote,
  };
}
