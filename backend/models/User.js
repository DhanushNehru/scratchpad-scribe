const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true 
    },
    email: {
       type: String, 
       required: true, 
       unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
      },
    password: { 
      type: String, 
      required: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Use this check to prevent OverwriteModelError
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
