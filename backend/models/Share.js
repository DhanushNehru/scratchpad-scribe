// backend/models/Share.js
const mongoose = require('mongoose');

const ShareSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  expiresAt: { type: Date, default: null }, // null = never expires
  readOnly: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

ShareSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('Share', ShareSchema);
