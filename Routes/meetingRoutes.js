const express = require("express");
const Meeting = require("../models/Meeting");
const router = express.Router();

// CREATE meeting (admin)
router.post("/", async (req, res) => {
  try {
    const meeting = new Meeting(req.body);
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
    const meetings = await Meeting.find({ date: { $gte: now } })
      .sort({ date: 1 });
    res.json({ success: true, data: meetings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE meeting (admin - recording add)
router.put("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: meeting });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
