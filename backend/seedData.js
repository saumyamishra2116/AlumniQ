/**
 * AlumniQ - Seed Script
 * Run with: node seedData.js
 * Seeds 25 alumni records into the MongoDB "alumiq" database.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI = "mongodb+srv://alumniq-yt:rez26.LncyKbV3r@alumniq.xg7qyhq.mongodb.net/";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: String,
  college: String,
  roll: String,
  branch: String,
  year: String,
  password: { type: String, required: true },
  role: { type: String, default: "alumni" },
  company: { type: String, default: "" },
  jobRole: { type: String, default: "" },
  location: { type: String, default: "" },
  mentor: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);

const alumniData = [
  { name: "Aarav Sharma",      email: "aarav.sharma@alumiq.in",       phone: "9876543201", college: "NIT Bhopal", roll: "2020CSE001", branch: "CSE",  year: "2020", company: "TCS",            jobRole: "Software Engineer",       location: "Delhi",      mentor: true  },
  { name: "Saumya Verma",      email: "saumya.verma@alumiq.in",       phone: "9876543202", college: "NIT Bhopal", roll: "2019ECE002", branch: "ECE",  year: "2019", company: "Infosys",         jobRole: "System Engineer",         location: "Bengaluru",  mentor: false },
  { name: "Harshit Jain",      email: "harshit.jain@alumiq.in",       phone: "9876543203", college: "NIT Bhopal", roll: "2018IT003",  branch: "IT",   year: "2018", company: "Microsoft",       jobRole: "Cloud Engineer",          location: "Hyderabad",  mentor: true  },
  { name: "Priya Patel",       email: "priya.patel@alumiq.in",        phone: "9876543204", college: "NIT Bhopal", roll: "2021CSE004", branch: "CSE",  year: "2021", company: "Google",          jobRole: "SWE II",                  location: "Bengaluru",  mentor: true  },
  { name: "Rahul Mehta",       email: "rahul.mehta@alumiq.in",        phone: "9876543205", college: "NIT Bhopal", roll: "2020ME005",  branch: "ME",   year: "2020", company: "Bosch",           jobRole: "Design Engineer",         location: "Pune",       mentor: false },
  { name: "Ananya Singh",      email: "ananya.singh@alumiq.in",       phone: "9876543206", college: "NIT Bhopal", roll: "2019CSE006", branch: "CSE",  year: "2019", company: "Amazon",          jobRole: "SDE I",                   location: "Bengaluru",  mentor: true  },
  { name: "Vikram Rao",        email: "vikram.rao@alumiq.in",         phone: "9876543207", college: "NIT Bhopal", roll: "2018EE007",  branch: "EEE",  year: "2018", company: "Siemens",         jobRole: "Electrical Engineer",     location: "Chennai",    mentor: false },
  { name: "Meera Iyer",        email: "meera.iyer@alumiq.in",         phone: "9876543208", college: "NIT Bhopal", roll: "2022CSE008", branch: "CSE",  year: "2022", company: "Wipro",           jobRole: "Associate Engineer",      location: "Noida",      mentor: false },
  { name: "Karan Gupta",       email: "karan.gupta@alumiq.in",        phone: "9876543209", college: "NIT Bhopal", roll: "2017CSE009", branch: "CSE",  year: "2017", company: "Flipkart",        jobRole: "Staff Engineer",          location: "Bengaluru",  mentor: true  },
  { name: "Neha Agarwal",      email: "neha.agarwal@alumiq.in",       phone: "9876543210", college: "NIT Bhopal", roll: "2020DS010",  branch: "DS",   year: "2020", company: "Mu Sigma",        jobRole: "Data Scientist",          location: "Bengaluru",  mentor: false },
  { name: "Rohit Bhatt",       email: "rohit.bhatt@alumiq.in",        phone: "9876543211", college: "NIT Bhopal", roll: "2019CSE011", branch: "CSE",  year: "2019", company: "Zomato",          jobRole: "Backend Engineer",        location: "Gurugram",   mentor: true  },
  { name: "Shreya Kapoor",     email: "shreya.kapoor@alumiq.in",      phone: "9876543212", college: "NIT Bhopal", roll: "2021IT012",  branch: "IT",   year: "2021", company: "Accenture",       jobRole: "Technology Analyst",      location: "Mumbai",     mentor: false },
  { name: "Arjun Nair",        email: "arjun.nair@alumiq.in",         phone: "9876543213", college: "NIT Bhopal", roll: "2018CSE013", branch: "CSE",  year: "2018", company: "Oracle",          jobRole: "Java Developer",          location: "Hyderabad",  mentor: true  },
  { name: "Divya Chaudhary",   email: "divya.chaudhary@alumiq.in",    phone: "9876543214", college: "NIT Bhopal", roll: "2020EC014",  branch: "ECE",  year: "2020", company: "Qualcomm",        jobRole: "VLSI Engineer",           location: "Bengaluru",  mentor: false },
  { name: "Sumit Tiwari",      email: "sumit.tiwari@alumiq.in",       phone: "9876543215", college: "NIT Bhopal", roll: "2017IT015",  branch: "IT",   year: "2017", company: "IBM",             jobRole: "Senior Consultant",       location: "Delhi",      mentor: true  },
  { name: "Pooja Mishra",      email: "pooja.mishra@alumiq.in",       phone: "9876543216", college: "NIT Bhopal", roll: "2021CSE016", branch: "CSE",  year: "2021", company: "Paytm",           jobRole: "Frontend Developer",      location: "Noida",      mentor: false },
  { name: "Aditya Kumar",      email: "aditya.kumar@alumiq.in",       phone: "9876543217", college: "NIT Bhopal", roll: "2019ME017",  branch: "ME",   year: "2019", company: "TATA Motors",     jobRole: "Product Engineer",        location: "Pune",       mentor: false },
  { name: "Ishaan Chatterjee", email: "ishaan.chatterjee@alumiq.in",  phone: "9876543218", college: "NIT Bhopal", roll: "2022CSE018", branch: "CSE",  year: "2022", company: "Razorpay",        jobRole: "SDE I",                   location: "Bengaluru",  mentor: false },
  { name: "Kavya Reddy",       email: "kavya.reddy@alumiq.in",        phone: "9876543219", college: "NIT Bhopal", roll: "2020CSE019", branch: "CSE",  year: "2020", company: "Swiggy",          jobRole: "Data Engineer",           location: "Bengaluru",  mentor: true  },
  { name: "Nikhil Desai",      email: "nikhil.desai@alumiq.in",       phone: "9876543220", college: "NIT Bhopal", roll: "2018IT020",  branch: "IT",   year: "2018", company: "HCL Technologies", jobRole: "System Architect",       location: "Noida",      mentor: true  },
  { name: "Tanvi Malhotra",    email: "tanvi.malhotra@alumiq.in",     phone: "9876543221", college: "NIT Bhopal", roll: "2021EE021",  branch: "EEE",  year: "2021", company: "L&T Technology",  jobRole: "Embedded Engineer",       location: "Pune",       mentor: false },
  { name: "Gaurav Saxena",     email: "gaurav.saxena@alumiq.in",      phone: "9876543222", college: "NIT Bhopal", roll: "2017CSE022", branch: "CSE",  year: "2017", company: "Uber",            jobRole: "Senior SDE",              location: "Bengaluru",  mentor: true  },
  { name: "Riya Pandey",       email: "riya.pandey@alumiq.in",        phone: "9876543223", college: "NIT Bhopal", roll: "2019DS023",  branch: "DS",   year: "2019", company: "PhonePe",         jobRole: "ML Engineer",             location: "Bengaluru",  mentor: false },
  { name: "Aakash Dubey",      email: "aakash.dubey@alumiq.in",       phone: "9876543224", college: "NIT Bhopal", roll: "2020CSE024", branch: "CSE",  year: "2020", company: "Ola",             jobRole: "Full Stack Developer",    location: "Bengaluru",  mentor: true  },
  { name: "Simran Kaur",       email: "simran.kaur@alumiq.in",        phone: "9876543225", college: "NIT Bhopal", roll: "2022IT025",  branch: "IT",   year: "2022", company: "Deloitte",        jobRole: "Technology Consultant",   location: "Mumbai",     mentor: false }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    let inserted = 0;
    let skipped = 0;

    for (const a of alumniData) {
      const existing = await User.findOne({ email: a.email });
      if (existing) {
        console.log(`⏭️  Skipping (already exists): ${a.name}`);
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash("Alumni@123", 10);
      await User.create({
        ...a,
        role: "alumni",
        password: hashedPassword
      });
      console.log(`✅ Inserted: ${a.name}`);
      inserted++;
    }

    console.log(`\n🎉 Seeding complete! Inserted: ${inserted}, Skipped: ${skipped}`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
