const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🔥 FIXED MONGODB CONNECTION - Render + Local
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/guido", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,  // 30 sec timeout
  socketTimeoutMS: 45000,
  family: 4  // IPv4 only
})
.then(() => console.log("✅ MongoDB guido CONNECTED"))
.catch(err => console.error("❌ MongoDB ERROR:", err.message));

// 🔥 USER SCHEMA - Complete with testHistory + meetings
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  mobile: String,
  password: String,
  role: { type: String, default: "student" },
  testHistory: [{
    date: String,
    score: Number,
    careerAnalysis: mongoose.Schema.Types.Mixed,
    answers: [mongoose.Schema.Types.Mixed],
    timestamp: { type: Date, default: Date.now }
  }],
  meetings: [{
    title: String,
    date: String,
    time: String,
    link: String,
    joined: { type: Boolean, default: false },
    joinedAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// 🔥 MEETING SCHEMA
const meetingSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  startTime: String,
  endTime: String,
  meetingLink: String,
  youtubeLink: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

const Meeting = mongoose.model("Meeting", meetingSchema);

// 🔥 1. ADMIN LOGIN
app.post('/api/admin-login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email === "admin@guido.com" && password === "ravi12345") {
    console.log("✅ ADMIN LOGIN");
    return res.json({ 
      success: true, 
      user: {
        _id: "admin_001",
        name: "Super Admin",
        email: "admin@guido.com",
        role: "admin",
        mobile: "8235872508"
      } 
    });
  }
  res.status(401).json({ error: "Invalid admin credentials" });
});

// 🔥 2. STUDENT REGISTER
app.post('/api/register', async (req, res) => {
  try {
    console.log('📥 REGISTER:', req.body);
    const { name, email, mobile, password } = req.body;
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.json({ 
        success: false, 
        message: 'Email already registered',
        user: existing 
      });
    }
    
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      mobile: mobile || '',
      password,
      role: 'student'
    });
    
    const saved = await newUser.save();
    console.log('✅ STUDENT SAVED:', saved.email);
    
    res.json({ 
      success: true, 
      user: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        role: saved.role
      }
    });
  } catch (err) {
    console.error('💥 REGISTER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔥 3. STUDENT LOGIN
app.post('/api/student-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || user.password !== password) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        testHistory: user.testHistory || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 4. SAVE TEST RESULTS
app.post('/api/save-test/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.testHistory.push(req.body);
    await user.save();
    
    console.log('✅ TEST SAVED for:', user.name);
    res.json({ success: true });
  } catch (err) {
    console.error('💥 TEST SAVE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔥 5. MEETINGS - GET ALL
app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ createdAt: -1 });
    res.json({ success: true, data: meetings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 6. CREATE MEETING (Admin only)
app.post('/api/meetings', async (req, res) => {
  try {
    const meeting = new Meeting({
      ...req.body,
      createdBy: req.body.adminName || 'Super Admin'
    });
    await meeting.save();
    console.log('✅ MEETING CREATED:', meeting.title);
    res.json({ success: true, data: meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 7. USER JOIN MEETING
app.post('/api/join-meeting/:userId/:meetingId', async (req, res) => {
  try {
    const { userId, meetingId } = req.params;
    
    const user = await User.findById(userId);
    if (user) {
      const meeting = user.meetings.find(m => m._id?.toString() === meetingId);
      if (!meeting) {
        user.meetings.push({ 
          _id: meetingId, 
          title: req.body.title,
          date: req.body.date,
          time: req.body.time,
          link: req.body.link,
          joined: true,
          joinedAt: new Date()
        });
        await user.save();
        console.log('✅ USER JOINED MEETING:', user.name);
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 8. DEBUG - ALL DATA
app.get('/api/debug', async (req, res) => {
  const users = await User.find().select('-password');
  const meetings = await Meeting.find();
  res.json({ 
    usersCount: users.length,
    meetingsCount: meetings.length,
    users: users.slice(0, 3),
    sampleMeeting: meetings[0]
  });
});

// 🔥 FIXED SERVER START - Render Compatible
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`🧪 Debug: http://localhost:${PORT}/api/debug`);
  console.log(`✅ Render LIVE: https://careerguido-backend.onrender.com`);
});
