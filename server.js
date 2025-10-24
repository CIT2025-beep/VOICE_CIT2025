// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "1000mb" })); // for large base64 images
app.use(express.urlencoded({ limit: "1000mb", extended: true }));

// ✅ MongoDB Atlas connection
mongoose.connect(
  "mongodb+srv://CIT2025:CIT2025@voicecit.q5o6vba.mongodb.net/?appName=VoiceCIT"
)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Schema
const complaintSchema = new mongoose.Schema({
  name: String,
  email: String,
  complaint: String,
  evidence: { type: String, default: "No file" },
  status: { type: String, default: "Submitted" },
  statusTime: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model("Complaint", complaintSchema);

// ✅ POST: Submit a complaint
app.post("/submit", async (req, res) => {
  try {
    const { name, email, complaint, evidence, status } = req.body;

    if (!name || !complaint) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newComplaint = new Complaint({
      name,
      email,
      complaint,
      evidence: evidence || "No file",
      status: status || "Submitted",
      statusTime: new Date()
    });

    await newComplaint.save();
    console.log("📝 New complaint saved:", newComplaint._id);
    res.status(200).json({ message: "Complaint submitted successfully!" });
  } catch (err) {
    console.error("❌ Error submitting complaint:", err);
    res.status(500).json({ error: "Failed to submit complaint." });
  }
});

// ✅ GET: Fetch all complaints
app.get("/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error("❌ Error fetching complaints:", err);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

// ✅ PUT: Update complaint status
app.put("/complaints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { status, statusTime: new Date() },
      { new: true }
    );

    res.json({ message: "Complaint status updated successfully!", complaint: updatedComplaint });
  } catch (err) {
    console.error("❌ Error updating complaint:", err);
    res.status(500).json({ error: "Failed to update complaint status." });
  }
});

// ✅ Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));





