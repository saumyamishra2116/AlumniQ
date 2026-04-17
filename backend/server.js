const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

/* =========================
   DATABASE CONNECTION
========================= */
// MongoDB Atlas connection with full replica-set URI (includes database name)
const MONGO_URI = "mongodb://saumyamishra6:saumyaalumniq@ac-yllvsg4-shard-00-00.fmdhrdf.mongodb.net:27017,ac-yllvsg4-shard-00-01.fmdhrdf.mongodb.net:27017,ac-yllvsg4-shard-00-02.fmdhrdf.mongodb.net:27017/alumiq?ssl=true&replicaSet=atlas-hgcwyb-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("⚠️  Server will still run but DB operations will fail. Check your Atlas credentials and IP whitelist.");
  });

/* =========================
   USER SCHEMA
========================= */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: String,
  college: String,
  roll: String,
  branch: String,
  year: String,
  password: { type: String, required: true },
  role: { type: String, default: "student" }, // student, alumni, faculty, admin
  company: { type: String, default: "" },
  jobRole: { type: String, default: "" },
  location: { type: String, default: "" },
  mentor: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);

/* =========================
   MOCK SCHEMAS FOR DEMO
========================= */
// In a fuller app, these would have their own endpoints. 
// For this rewrite, we will send static-like data as a response or save it simply.
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  type: String,
  postedBy: String,
  skills: [String]
});
const Job = mongoose.model("Job", jobSchema);

const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  mode: String,
  description: String,
  organizer: String
});
const Event = mongoose.model("Event", eventSchema);

const mentorshipRequestSchema = new mongoose.Schema({
  requesterId: { type: String }, // stored as string to support mock data without real ObjectId
  requesterName: String,
  mentorId: { type: String },
  mentorName: String,
  status: { type: String, default: "pending" }, // pending, accepted, rejected
  createdAt: { type: Date, default: Date.now }
});
const MentorshipRequest = mongoose.model("MentorshipRequest", mentorshipRequestSchema);

/* =========================
   AUTH APIs
========================= */
app.post("/api/register", async (req, res) => {
  console.log("REGISTER API HIT");
  try {
    const { name, email, phone, college, roll, branch, year, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name, email, phone, college, roll, branch, year, role,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.log("REAL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  console.log("LOGIN API HIT");
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // Usually we would send a JWT here, for this simplified version, we just send user info.
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.log("REAL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   DATA APIs
========================= */
app.get("/api/alumni", async (req, res) => {
  try {
    // Return all users or just alumni
    const alumni = await User.find({ role: "alumni" }).select("-password");

    // If DB is empty, let's return some mock data to show the premium UI works!
    if (alumni.length === 0) {
      return res.json([
        { name: "Aarav Sharma", year: "2020", branch: "CSE", location: "Delhi", company: "TCS", jobRole: "Software Engineer", mentor: true },
        { name: "Saumya Verma", year: "2019", branch: "ECE", location: "Bengaluru", company: "Infosys", jobRole: "System Engineer", mentor: false },
        { name: "Harshit Jain", year: "2018", branch: "IT", location: "Noida", company: "Microsoft", jobRole: "Cloud Engineer", mentor: true }
      ]);
    }

    res.json(alumni);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    if (jobs.length === 0) {
      return res.json([
        { title: "Frontend Intern (React)", company: "AlumniQ Labs", location: "Remote", type: "Internship", postedBy: "Aarav Sharma", skills: ["React", "HTML", "CSS", "JavaScript"] },
        { title: "Data Analyst", company: "EduAnalytics Pvt Ltd", location: "Bengaluru", type: "Full-time", postedBy: "Saumya Verma", skills: ["SQL", "Power BI", "Excel"] },
        { title: "Backend Developer (Node.js)", company: "CloudBridge", location: "Noida", type: "Full-time", postedBy: "Harshit Jain", skills: ["Node.js", "MongoDB", "REST API"] }
      ]);
    }
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const { title, company, location, type, postedBy, skills } = req.body;
    let skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()) : []);

    const newJob = new Job({ title, company, location, type, postedBy, skills: skillsArray });
    await newJob.save();

    res.status(201).json({ message: "Job posted successfully", job: newJob });
  } catch (err) {
    res.status(500).json({ message: "Server error while posting job" });
  }
});

app.put("/api/user/:id", async (req, res) => {
  try {
    const { company, jobRole, location, mentor } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { company, jobRole, location, mentor } },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Send back minimal updated info
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        jobRole: user.jobRole,
        location: user.location,
        mentor: user.mentor
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Server error while updating profile", error: err.message });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    if (events.length === 0) {
      return res.json([
        { title: "Annual Alumni Meet 2026", date: "2026-12-20", mode: "On-Campus", description: "Reunion, networking and success story sessions.", organizer: "Institute Admin" },
        { title: "Web3 & Startups Webinar", date: "2026-12-10", mode: "Online", description: "Alumni entrepreneurs share their journey.", organizer: "Alumni Association" }
      ]);
    }
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const { title, date, mode, description, organizer } = req.body;
    const newEvent = new Event({ title, date, mode, description, organizer });
    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    res.status(500).json({ message: "Server error while creating event" });
  }
});

app.post("/api/mentorship/request", async (req, res) => {
  try {
    const { requesterId, requesterName, mentorId, mentorName } = req.body;

    if (!requesterName || !mentorName) {
      return res.status(400).json({ message: "Requester and mentor names are required." });
    }

    // Only check for duplicates if both IDs are non-empty (real DB records)
    if (requesterId && mentorId) {
      const existing = await MentorshipRequest.findOne({ requesterId, mentorId });
      if (existing) {
        return res.status(400).json({ message: "Mentorship request already sent to this mentor." });
      }
    } else {
      // For mock data: check by name to prevent duplicate requests
      const existingByName = await MentorshipRequest.findOne({ requesterName, mentorName });
      if (existingByName) {
        return res.status(400).json({ message: "Mentorship request already sent to this mentor." });
      }
    }

    const request = new MentorshipRequest({ requesterId, requesterName, mentorId, mentorName });
    await request.save();
    res.status(201).json({ message: "Mentorship request sent successfully!" });
  } catch (err) {
    console.error("Mentorship request error:", err);
    res.status(500).json({ message: "Server error while sending mentorship request", detail: err.message });
  }
});

/* =========================
   GLOBAL ERROR HANDLER (Required for Express 5 async errors)
========================= */
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
