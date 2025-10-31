// backend/controllers/shareController.js
const crypto = require('crypto');
const Share = require('../models/Share');
const Note = require('../models/Note');

function makeToken(len = 24) {
  // produce URL-safe token (base64url)
  return crypto.randomBytes(len).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

exports.createShare = async (req, res) => {
  try {
    const { noteId, expiresInSeconds } = req.body;
    if (!noteId) return res.status(400).json({ message: 'noteId is required' });

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const token = makeToken(18);
    const shareDoc = new Share({
      token,
      noteId: note._id,
      readOnly: true,
      expiresAt: expiresInSeconds ? new Date(Date.now() + expiresInSeconds * 1000) : null
    });
    await shareDoc.save();

    const base = process.env.SHARE_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const shareUrl = `${base.replace(/\/$/,'')}/s/${token}`;

    res.json({ url: shareUrl, token, expiresAt: shareDoc.expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSharedNote = async (req, res) => {
  try {
    const { token } = req.params;
    const share = await Share.findOne({ token }).lean();
    if (!share) return res.status(404).json({ message: 'Share link not found' });

    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(410).json({ message: 'Link has expired' });
    }

    const note = await Note.findById(share.noteId).lean();
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Return only read-only safe fields
    return res.json({
      note: {
        id: note._id,
        title: note.title || 'Untitled',
        content: note.content || '',
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      },
      readOnly: true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.revokeShare = async (req, res) => {
  try {
    const { token } = req.params;
    await Share.deleteOne({ token });
    return res.json({ message: 'Share link revoked' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
