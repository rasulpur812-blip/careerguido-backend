const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  meetingLink: { type: String, required: true },
  recordingLink: { type: String },
  youtubeLinks: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("Meeting", meetingSchema);
