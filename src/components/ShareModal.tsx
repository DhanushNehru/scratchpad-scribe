// src/components/ShareModal.tsx
import React, { useState } from "react";

type Props = {
  noteId: string;
  onClose: () => void;
};

export default function ShareModal({ noteId, onClose }: Props) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expires, setExpires] = useState<string>('never'); // 'never' | '1h' | '1d'

  async function createShare() {
    setLoading(true);
    try {
      const expiresMapping: Record<string, number | undefined> = {
        '1h': 3600,
        '1d': 86400,
      };
      const body: any = { noteId };
      if (expires !== 'never') body.expiresInSeconds = expiresMapping[expires];

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setLink(data.url);
      } else {
        alert(data.message || 'Failed to create share link');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating share link');
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(()=> {
      alert('Copied!');
    }).catch(()=> alert('Failed to copy'));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded p-4 shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share Note (read-only)</h3>
          <button onClick={onClose} className="text-sm opacity-70">Close</button>
        </div>

        {!link ? (
          <>
            <div className="mb-3">
              <label className="block text-sm">Expires</label>
              <select className="mt-1 p-2 border rounded w-full" value={expires} onChange={e=>setExpires(e.target.value)}>
                <option value="never">Never</option>
                <option value="1h">1 hour</option>
                <option value="1d">1 day</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
              <button onClick={createShare} className="px-3 py-2 rounded bg-blue-600 text-white" disabled={loading}>
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 break-words">
              <p className="text-sm">Share link (read-only):</p>
              <div className="mt-2 p-3 bg-gray-100 rounded">{link}</div>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={copyLink} className="px-3 py-2 rounded border">Copy</button>
              <button onClick={()=> { setLink(null); }} className="px-3 py-2 rounded">Create New</button>
              <button onClick={onClose} className="px-3 py-2 rounded bg-gray-800 text-white">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
