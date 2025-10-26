const User = require('../models/User');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    if(!username || !email || !password){
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    try {
        const user = await User.create({ username, email, password });
        if(!user){
           return res.status(500).json({ message: 'Failed to create user, try again later' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ user: { id: user._id, username, email }, token });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password){
        return res.status(400).json({ message: 'Invalid credentials' })
    }
    try {
        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if(!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ user: { id: user._id, username: user.username, email }, token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {loginUser, registerUser, getCurrentUser};   