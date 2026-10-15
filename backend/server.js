const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Load .env file if present (local dev)
try { require("dotenv").config(); } catch (_) {}

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
// MongoDB Atlas connection — reads from MONGO_URI env var, falls back to hardcoded Atlas URI
const MONGO_URI = process.env.MONGO_URI ||
  "mongodb+srv://alumniq-yt:rez26.LncyKbV3r@alumniq.xg7qyhq.mongodb.net/";

mongoose.connect(MONGO_URI, { appName: "alumiq-backend" })
  .then(() => console.log("✅ MongoDB Connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Full error:", err);
    console.error("⚠️  Server will still run but DB operations will fail. Check your Atlas credentials and IP whitelist.");
  });

// Helper — returns true only when Mongoose is fully connected
function isDbReady() {
  return mongoose.connection.readyState === 1;
}

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

  if (!isDbReady()) {
    console.error("❌ Register failed: MongoDB not connected (state:", mongoose.connection.readyState, ")");
    return res.status(503).json({ message: "Database not connected. Please try again in a moment." });
  }

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
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err.stack || err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

app.post("/api/login", async (req, res) => {
  console.log("LOGIN API HIT");

  if (!isDbReady()) {
    console.error("❌ Login failed: MongoDB not connected (state:", mongoose.connection.readyState, ")");
    return res.status(503).json({ message: "Database not connected. Please try again in a moment." });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({ message: "No account found with that email." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect password." });
    }

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
    console.error("LOGIN ERROR:", err.stack || err);
    res.status(500).json({ message: "Server error: " + err.message });
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
      // Full 25-alumni mock dataset — used when DB is empty
      return res.json([
        { name: "Aarav Sharma", year: "2020", branch: "CSE", college: "NIT Bhopal", location: "Delhi", company: "TCS", jobRole: "Software Engineer", mentor: true },
        { name: "Saumya Mishra", year: "2019", branch: "ECE", college: "NIT Bhopal", location: "Bengaluru", company: "Infosys", jobRole: "System Engineer", mentor: false },
        { name: "Harshit Jain", year: "2018", branch: "IT", college: "NIT Bhopal", location: "Hyderabad", company: "Microsoft", jobRole: "Cloud Engineer", mentor: true },
        { name: "Priya Patel", year: "2021", branch: "CSE", college: "NIT Bhopal", location: "Bengaluru", company: "Google", jobRole: "SWE II", mentor: true },
        { name: "Rahul Mehta", year: "2020", branch: "ME", college: "NIT Bhopal", location: "Pune", company: "Bosch", jobRole: "Design Engineer", mentor: false },
        { name: "Ananya Singh", year: "2019", branch: "CSE", college: "NIT Bhopal", location: "Bengaluru", company: "Amazon", jobRole: "SDE I", mentor: true },
        { name: "Vikram Rao", year: "2018", branch: "EEE", college: "NIT Bhopal", location: "Chennai", company: "Siemens", jobRole: "Electrical Engineer", mentor: false },
        { name: "Meera Iyer", year: "2022", branch: "CSE", college: "NIT Bhopal", location: "Noida", company: "Wipro", jobRole: "Associate Engineer", mentor: false },
        { name: "Karan Gupta", year: "2017", branch: "CSE", college: "NIT Bhopal", location: "Bengaluru", company: "Flipkart", jobRole: "Staff Engineer", mentor: true },
        { name: "Neha Agarwal", year: "2020", branch: "DS", college: "NIT Bhopal", location: "Bengaluru", company: "Mu Sigma", jobRole: "Data Scientist", mentor: false },
        { name: "Rohit Bhatt", year: "2019", branch: "CSE", college: "NIT Bhopal", location: "Gurugram", company: "Zomato", jobRole: "Backend Engineer", mentor: true },
        { name: "Shreya Kapoor", year: "2021", branch: "IT", college: "NIT Bhopal", location: "Mumbai", company: "Accenture", jobRole: "Technology Analyst", mentor: false },
        { name: "Arjun Nair", year: "2018", branch: "CSE", college: "NIT Bhopal", location: "Hyderabad", company: "Oracle", jobRole: "Java Developer", mentor: true },
        { name: "Divya Chaudhary", year: "2020", branch: "ECE", college: "NIT Bhopal", location: "Bengaluru", company: "Qualcomm", jobRole: "VLSI Engineer", mentor: false },
        { name: "Sumit Tiwari", year: "2017", branch: "IT", college: "NIT Bhopal", location: "Delhi", company: "IBM", jobRole: "Senior Consultant", mentor: true },
        { name: "Pooja Mishra", year: "2021", branch: "CSE", college: "NIT Bhopal", location: "Noida", company: "Paytm", jobRole: "Frontend Developer", mentor: false },
        { name: "Aditya Kumar", year: "2019", branch: "ME", college: "NIT Bhopal", location: "Pune", company: "TATA Motors", jobRole: "Product Engineer", mentor: false },
        { name: "Ishaan Chatterjee", year: "2022", branch: "CSE", college: "NIT Bhopal", location: "Bengaluru", company: "Razorpay", jobRole: "SDE I", mentor: false },
        { name: "Kavya Reddy", year: "2020", branch: "CSE", college: "NIT Bhopal", location: "Bengaluru", company: "Swiggy", jobRole: "Data Engineer", mentor: true },
        { name: "Nikhil Desai", year: "2018", branch: "IT", college: "NIT Bhopal", location: "Noida", company: "HCL Technologies", jobRole: "System Architect", mentor: true },
        { name: "Tanvi Malhotra", year: "2021", branch: "EEE", college: "NIT Bhopal", location: "Pune", company: "L&T Technology", jobRole: "Embedded Engineer", mentor: false },
        { name: "Gaurav Saxena", year: "2017", branch: "CSE", college: "NIT Bhopal", location: "Bengaluru", company: "Uber", jobRole: "Senior SDE", mentor: true },
        { name: "Riya Pandey", year: "2019", branch: "DS", college: "NIT Bhopal", location: "Bengaluru", company: "PhonePe", jobRole: "ML Engineer", mentor: false },
        { name: "Aakash Dubey", year: "2020", branch: "CSE", college: "NIT Bhopal", location: "Bengaluru", company: "Ola", jobRole: "Full Stack Developer", mentor: true },
        { name: "Simran Kaur", year: "2022", branch: "IT", college: "NIT Bhopal", location: "Mumbai", company: "Deloitte", jobRole: "Technology Consultant", mentor: false }
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
   START SERVER (local dev only)
   Vercel uses module.exports = app for serverless
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
