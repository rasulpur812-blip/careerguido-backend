const express = require("express");
const Meeting = require("../models/Meeting");
const router = express.Router();

// Input validation middleware
const validateMeeting = async (req, res, next) => {
  try {
    req.body.date = new Date(req.body.date);
    if (isNaN(req.body.date)) {
      return res.status(400).json({ error: "Valid date required" });
    }
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid meeting data" });
  }
};

// CREATE meeting (admin)
router.post("/", validateMeeting, async (req, res) => {
  try {
    const meeting = new Meeting(req.body);
    await meeting.validate();  // Schema validation
    await meeting.save();
    res.status(201).json({ success: true, data: meeting });
  } catch (err) {
    console.error("❌ Create meeting error:", err);
    res.status(400).json({ error: err.message });
  }
});

// GET upcoming meetings (students)
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const meetings = await Meeting.find({ 
      date: { $gte: now },
      isActive: true  // Add this field in schema
    })
      .sort({ date: 1 })
      .select('-__v');  // Hide version field
    res.json({ success: true, data: meetings });
  } catch (err) {
    console.error("❌ Get meetings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE meeting (admin)
router.put("/:id", validateMeeting, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    
    // Only allow specific fields to update
    const allowedUpdates = ['date', 'topic', 'recordingUrl', 'isActive'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    Object.assign(meeting, updates);
    await meeting.save();
    
    res.json({ success: true, data: meeting });
  } catch (err) {
    console.error("❌ Update meeting error:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE meeting (admin)
router.delete("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json({ success: true, message: "Meeting deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
