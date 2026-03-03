require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://careerguido.surge.sh'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true, unique: true },
  password: String,
  role: { type: String, default: "student" }
});
const User = mongoose.model("User", userSchema);

const meetingSchema = new mongoose.Schema({
  title: String,
  date: String,
  createdBy: String
});
const Meeting = mongoose.model("Meeting", meetingSchema);

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, message: 'Email exists' });
    
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    
    const user = new User({ name, email, password: hashed });
    await user.save();
    
    res.json({ success: true, user: { id: user._id, name, email } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/student-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.json({ success: false, message: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: 'Invalid credentials' });
    
    res.json({ success: true, user: { id: user._id, name: user.name, email } });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@guido.com" && password === "ravi12345") {
    res.json({ success: true, user: { _id: "admin", name: "Admin", role: "admin" } });
  } else {
    res.json({ success: false });
  }
});

app.get('/api/health', (req, res) => res.json({ success: true }));
app.get('/api/debug', async (req, res) => {
  const users = await User.find().limit(5);
  res.json({ success: true, usersCount: users.length });
});

// FIXED START - Connection first
async function startServer() {
  try {
    console.log("🔄 MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected!");
    
    app.listen(8000, () => {
      console.log("🚀 Backend: http://localhost:8000");
      console.log("✅ Health: http://localhost:8000/api/health");
    });
  } catch (e) {
    console.log("❌ MongoDB Error:", e.message);
  }
}

startServer();
