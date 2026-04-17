const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

/* =========================
   DATABASE CONNECTION
========================= */
// Reusing provided MongoDB URI. In production, use environment variables.
mongoose.connect("mongodb+srv://Saumydatabase94523:Saumya%40harsh@cluster0.0thxzxa.mongodb.net/?appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

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
  res.json([
    { title: "Frontend Intern (React)", company: "AlumniQ Labs", location: "Remote", type: "Internship", postedBy: "Aarav Sharma", skills: ["React", "HTML", "CSS", "JavaScript"] },
    { title: "Data Analyst", company: "EduAnalytics Pvt Ltd", location: "Bengaluru", type: "Full-time", postedBy: "Saumya Verma", skills: ["SQL", "Power BI", "Excel"] },
    { title: "Backend Developer (Node.js)", company: "CloudBridge", location: "Noida", type: "Full-time", postedBy: "Harshit Jain", skills: ["Node.js", "MongoDB", "REST API"] }
  ]);
});

app.get("/api/events", async (req, res) => {
  res.json([
    { title: "Annual Alumni Meet 2026", date: "2026-12-20", mode: "On-Campus", description: "Reunion, networking and success story sessions.", organizer: "Institute Admin" },
    { title: "Web3 & Startups Webinar", date: "2026-12-10", mode: "Online", description: "Alumni entrepreneurs share their journey.", organizer: "Alumni Association" }
  ]);
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
