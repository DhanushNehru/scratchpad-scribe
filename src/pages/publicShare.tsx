// src/pages/publicShare.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PublicShare() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(()=> {
    async function fetchNote(){
      setLoading(true);
      try {
        const res = await fetch(`/s/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(()=>({message: 'Not found'}));
          setErr(body.message || 'Error');
          setNote(null);
        } else {
          const data = await res.json();
          setNote(data.note);
        }
      } catch (e) {
        setErr('Network error');
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchNote();
  }, [token]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!note) return <div className="p-6">Note not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{note.title}</h1>
      <div className="prose whitespace-pre-wrap">
        {note.content}
      </div>
      <div className="mt-6 text-sm text-gray-600">Read-only view</div>
    </div>
  );
}
