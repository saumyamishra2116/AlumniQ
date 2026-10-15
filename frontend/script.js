// Config — auto-detect local vs. Vercel deployment
const API_URL = "http:///alumniq-btu5.onrender.com/register";

// Helper to handle navigation between sections
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".page-section");
  const topbarTitle = document.getElementById("topbarTitle");

  if (!navItems.length) return; // Not on the dashboard page

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      // Remove active class from all
      navItems.forEach(nav => nav.classList.remove("active"));
      sections.forEach(sec => sec.classList.remove("active"));

      // Add active class to clicked item and target section
      item.classList.add("active");
      const targetId = item.getAttribute("data-target");
      const targetSection = document.getElementById(`section-${targetId}`);
      
      if (targetSection) {
        targetSection.classList.add("active");
        // Update topbar title based on clicked item text
        topbarTitle.textContent = item.textContent.replace(/[^a-zA-Z &]/g, "").trim();
      }
    });
  });
}

// User Session Management
function checkAuth() {
  const isDashboard = window.location.pathname.includes("dashboard");
  const isAuthPage = window.location.pathname.includes("login") || 
                     window.location.pathname.includes("reg") || 
                     window.location.pathname.endsWith("landing.html") ||
                     window.location.pathname === "/";

  // STEP 1: If we landed on the dashboard with user data in the URL hash,
  // save it to localStorage immediately (registration/login put it there).
  if (isDashboard && window.location.hash.startsWith("#userdata=")) {
    try {
      const encoded = window.location.hash.substring("#userdata=".length);
      const userData = JSON.parse(decodeURIComponent(encoded));
      if (userData && userData.name) {
        localStorage.setItem("alumiq_user", JSON.stringify(userData));
      }
    } catch (e) {
      console.error("Failed to parse user data from URL hash:", e);
    }
    // Clean the hash from the URL without reloading
    history.replaceState(null, "", window.location.pathname);
  }

  // STEP 2: Now read user from localStorage (guaranteed to be there if step 1 ran)
  const user = JSON.parse(localStorage.getItem("alumiq_user"));

  // STEP 3: Redirect logic
  if (isAuthPage && user) {
    window.location.replace("dashboard.html");
    return;
  }
  if (isDashboard && !user) {
    window.location.replace("login.html");
    return;
  }

  // STEP 4: Populate user info on dashboard
  if (user && document.getElementById("displayUserName")) {
    document.getElementById("displayUserName").textContent = user.name;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileRole").textContent = user.role.toUpperCase();
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById("avatarLetter").textContent = initial;
    document.getElementById("profileAvatar").textContent = initial;
    
    // Setup Edit Profile Modal fields
    if (document.getElementById("editCompany")) {
      document.getElementById("editCompany").value = user.company || "";
      document.getElementById("editJobRole").value = user.jobRole || "";
      document.getElementById("editLocation").value = user.location || "";
      document.getElementById("editMentor").checked = user.mentor || false;
      if (user.role === "alumni" || user.role === "faculty") {
        document.getElementById("mentorGroup").classList.remove("d-none");
      }
    }
  }
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("alumiq_user");
    window.location.href = "landing.html";
  });
}

// Auth Logic (Login)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("loginError");
    
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("alumiq_user", JSON.stringify(data.user));
        const userHash = encodeURIComponent(JSON.stringify(data.user));
        window.location.replace("dashboard.html#userdata=" + userHash);
      } else {
        errorDiv.textContent = data.message;
        errorDiv.classList.remove("d-none");
      }
    } catch (err) {
      errorDiv.textContent = "Server error. Please make sure backend is running on port 5000.";
      errorDiv.classList.remove("d-none");
    }
  });
}

// Auth Logic (Register)
const regForm = document.getElementById("regForm");
if (regForm) {
  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertDiv = document.getElementById("regAlert");
    
    const payload = {
      name: document.getElementById("regName").value,
      email: document.getElementById("regEmail").value,
      phone: document.getElementById("regPhone").value,
      college: document.getElementById("regCollege").value,
      branch: document.getElementById("regBranch").value,
      year: document.getElementById("regYear").value,
      role: document.getElementById("regRole").value,
      password: document.getElementById("regPassword").value
    };

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("alumiq_user", JSON.stringify(data.user));
        // Pass user data in URL hash so dashboard gets it even if localStorage has a timing issue
        const userHash = encodeURIComponent(JSON.stringify(data.user));
        window.location.replace("dashboard.html#userdata=" + userHash);
        return;
      } else {
        alertDiv.textContent = data.message;
        alertDiv.className = "alert error";
      }
    } catch (err) {
      alertDiv.textContent = "Server error. Is the backend running?";
      alertDiv.className = "alert error";
    }
  });
}

// Modal Logic Setup
function setupModals() {
  const user = JSON.parse(localStorage.getItem("alumiq_user"));
  
  // Edit Profile Modal
  const editModal = document.getElementById("editProfileModal");
  const btnEdit = document.getElementById("btnEditProfile");
  const closeEdit = document.getElementById("closeEditProfile");
  if (btnEdit && editModal && closeEdit) {
    btnEdit.addEventListener("click", () => editModal.classList.remove("d-none"));
    closeEdit.addEventListener("click", () => editModal.classList.add("d-none"));
  }
  
  const editForm = document.getElementById("editProfileForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!user) return;
      const payload = {
        company: document.getElementById("editCompany").value,
        jobRole: document.getElementById("editJobRole").value,
        location: document.getElementById("editLocation").value,
        mentor: document.getElementById("editMentor").checked
      };
      
      const submitBtn = editForm.querySelector("button[type=submit]");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Saving...";
      
      try {
        const res = await fetch(`${API_URL}/user/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("alumiq_user", JSON.stringify(data.user));
          alert("Profile updated successfully!");
          window.location.reload();
        } else {
          alert("Failed to update profile: " + data.message);
        }
      } catch (err) {
        alert("Server error connecting to backend.");
      } finally {
        submitBtn.textContent = originalText;
      }
    });
  }

  // Post Job Modal
  const jobModal = document.getElementById("postJobModal");
  const btnPost = document.getElementById("btnPostJob");
  const closeJob = document.getElementById("closePostJob");
  if (btnPost && jobModal && closeJob) {
    btnPost.addEventListener("click", () => jobModal.classList.remove("d-none"));
    closeJob.addEventListener("click", () => jobModal.classList.add("d-none"));
  }
  
  const jobForm = document.getElementById("postJobForm");
  if (jobForm) {
    jobForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!user) return;
      const payload = {
        title: document.getElementById("jobTitle").value,
        company: document.getElementById("jobCompany").value,
        location: document.getElementById("jobLocation").value,
        type: document.getElementById("jobType").value,
        skills: document.getElementById("jobSkills").value,
        postedBy: user.name
      };
      
      const submitBtn = jobForm.querySelector("button[type=submit]");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Posting...";
      
      try {
        const res = await fetch(`${API_URL}/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast("Job posted successfully! 🎉");
          jobModal.classList.add("d-none");
          jobForm.reset();
          loadDashboardData();
        } else {
          const data = await res.json();
          showToast("Failed to post job: " + data.message, true);
        }
      } catch (err) {
        showToast("Server error connecting to backend.", true);
      } finally {
        submitBtn.textContent = originalText;
      }
    });
  }

  // Create Event Modal
  const eventModal = document.getElementById("postEventModal");
  const btnPostEvent = document.getElementById("btnPostEvent");
  const closeEvent = document.getElementById("closePostEvent");
  if (btnPostEvent && eventModal && closeEvent) {
    btnPostEvent.addEventListener("click", () => eventModal.classList.remove("d-none"));
    closeEvent.addEventListener("click", () => eventModal.classList.add("d-none"));
  }

  const eventForm = document.getElementById("postEventForm");
  if (eventForm) {
    eventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!user) return;
      const payload = {
        title: document.getElementById("eventTitle").value,
        date: document.getElementById("eventDate").value,
        mode: document.getElementById("eventMode").value,
        description: document.getElementById("eventDesc").value,
        organizer: user.name
      };

      const submitBtn = eventForm.querySelector("button[type=submit]");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Creating...";

      try {
        const res = await fetch(`${API_URL}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast("Event created successfully! 📅");
          eventModal.classList.add("d-none");
          eventForm.reset();
          loadDashboardData();
        } else {
          const data = await res.json();
          showToast("Failed to create event: " + data.message, true);
        }
      } catch (err) {
        showToast("Server error connecting to backend.", true);
      } finally {
        submitBtn.textContent = originalText;
      }
    });
  }
}

/* ==============================================
   RENDER HELPERS (shared by API + fallback)
============================================== */
function renderAlumni(alumni) {
  const tbody = document.getElementById("alumniTableBody");
  if (alumni.length > 0) {
    tbody.innerHTML = alumni.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.year || 'N/A'}</td>
        <td>${a.company || 'N/A'}</td>
        <td>${a.jobRole || 'N/A'}</td>
        <td>${a.location || 'N/A'}</td>
        <td>${a.mentor ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-info">No</span>'}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No alumni found.</td></tr>';
  }

  const mentors = alumni.filter(a => a.mentor);
  const mentorGrid = document.getElementById("mentorshipGrid");
  if (mentors.length > 0) {
    mentorGrid.innerHTML = mentors.map(m => `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${m.name}</h3>
          <span class="badge badge-success">Mentor</span>
        </div>
        <p style="margin-bottom: 0.5rem"><strong>${m.jobRole || 'Professional'}</strong> @ ${m.company || 'Industry'}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem">
          ${m.branch || 'Unknown Branch'} • Class of ${m.year || 'Unknown'} • ${m.location || 'Remote'}
        </p>
        <button
          class="btn btn-outline btn-full"
          data-mentor-id="${m._id || ''}"
          data-mentor-name="${m.name}"
          onclick="requestMentorship(this)"
        >Request Mentorship</button>
      </div>
    `).join('');
  } else {
    mentorGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No mentors available right now.</div>';
  }
}

function renderJobs(jobs) {
  const jobsGrid = document.getElementById("jobsGrid");
  if (jobs.length > 0) {
    jobsGrid.innerHTML = jobs.map(j => `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${j.title}</h3>
          <span class="badge ${j.type === 'Internship' ? 'badge-info' : 'badge-success'}">${j.type}</span>
        </div>
        <p style="margin-bottom: 0.5rem"><strong>${j.company}</strong> • ${j.location}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem">
          Posted by: ${j.postedBy}
        </p>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom: 1.5rem;">
          ${j.skills.map(s => `<span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">${s}</span>`).join('')}
        </div>
        <button class="btn btn-primary btn-full" onclick="alert('Applied for ${j.title} at ${j.company}!')">Apply Now</button>
      </div>
    `).join('');
  } else {
    jobsGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No jobs available right now.</div>';
  }
}

function renderEvents(events) {
  const eventsTimeline = document.getElementById("eventsTimeline");
  if (events.length > 0) {
    eventsTimeline.innerHTML = events.map(e => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card card" style="margin-bottom: 1rem;">
          <div class="card-header">
            <h3 class="card-title">${e.title}</h3>
          </div>
          <p style="color: var(--accent); font-weight: 500; font-size: 0.9rem; margin-bottom: 0.5rem;">${e.date} • ${e.mode}</p>
          <p style="margin-bottom: 0.5rem;">${e.description}</p>
          <p style="color: var(--text-muted); font-size: 0.8rem;">Organizer: ${e.organizer}</p>
        </div>
      </div>
    `).join('');
  } else {
    eventsTimeline.innerHTML = '<div class="empty-state">No upcoming events.</div>';
  }
}

/* ==============================================
   FETCH AND RENDER DASHBOARD DATA
   Falls back to inline mock data if API fails
============================================== */
async function loadDashboardData() {
  if (!document.getElementById("sections-wrapper")) return; // Not on dashboard

  try {
    const [alumniRes, jobsRes, eventsRes] = await Promise.all([
      fetch(`${API_URL}/alumni`),
      fetch(`${API_URL}/jobs`),
      fetch(`${API_URL}/events`)
    ]);

    // If any response is not OK, jump straight to fallback
    if (!alumniRes.ok || !jobsRes.ok || !eventsRes.ok) {
      throw new Error("API responded with an error status.");
    }

    const alumni = await alumniRes.json();
    const jobs   = await jobsRes.json();
    const events = await eventsRes.json();

    // Stats
    document.getElementById("statAlumni").textContent = alumni.length;
    document.getElementById("statJobs").textContent   = jobs.length;
    document.getElementById("statEvents").textContent = events.length;

    renderAlumni(alumni);
    renderJobs(jobs);
    renderEvents(events);

  } catch (err) {
    // Backend unreachable (Live Server, Vercel cold-start, etc.) — show inline data
    console.warn("Backend unreachable — using offline mock data.", err.message);
    renderFallbackData();
  }
}

/* ==============================================
   OFFLINE FALLBACK DATA
   Shown whenever the API cannot be reached.
   Alumni, Jobs, and Events are all pre-loaded.
============================================== */
function renderFallbackData() {
  const MOCK_ALUMNI = [
    { name: "Aarav Sharma",      year: "2020", branch: "CSE", company: "TCS",             jobRole: "Software Engineer",     location: "Delhi",     mentor: true  },
    { name: "Saumya Mishra",     year: "2019", branch: "ECE", company: "Infosys",          jobRole: "System Engineer",       location: "Bengaluru", mentor: false },
    { name: "Harshit Jain",      year: "2018", branch: "IT",  company: "Microsoft",        jobRole: "Cloud Engineer",        location: "Hyderabad", mentor: true  },
    { name: "Priya Patel",       year: "2021", branch: "CSE", company: "Google",           jobRole: "SWE II",                location: "Bengaluru", mentor: true  },
    { name: "Rahul Mehta",       year: "2020", branch: "ME",  company: "Bosch",            jobRole: "Design Engineer",       location: "Pune",      mentor: false },
    { name: "Ananya Singh",      year: "2019", branch: "CSE", company: "Amazon",           jobRole: "SDE I",                 location: "Bengaluru", mentor: true  },
    { name: "Vikram Rao",        year: "2018", branch: "EEE", company: "Siemens",          jobRole: "Electrical Engineer",   location: "Chennai",   mentor: false },
    { name: "Meera Iyer",        year: "2022", branch: "CSE", company: "Wipro",            jobRole: "Associate Engineer",    location: "Noida",     mentor: false },
    { name: "Karan Gupta",       year: "2017", branch: "CSE", company: "Flipkart",         jobRole: "Staff Engineer",        location: "Bengaluru", mentor: true  },
    { name: "Neha Agarwal",      year: "2020", branch: "DS",  company: "Mu Sigma",         jobRole: "Data Scientist",        location: "Bengaluru", mentor: false },
    { name: "Rohit Bhatt",       year: "2019", branch: "CSE", company: "Zomato",           jobRole: "Backend Engineer",      location: "Gurugram",  mentor: true  },
    { name: "Shreya Kapoor",     year: "2021", branch: "IT",  company: "Accenture",        jobRole: "Technology Analyst",    location: "Mumbai",    mentor: false },
    { name: "Arjun Nair",        year: "2018", branch: "CSE", company: "Oracle",           jobRole: "Java Developer",        location: "Hyderabad", mentor: true  },
    { name: "Divya Chaudhary",   year: "2020", branch: "ECE", company: "Qualcomm",         jobRole: "VLSI Engineer",         location: "Bengaluru", mentor: false },
    { name: "Sumit Tiwari",      year: "2017", branch: "IT",  company: "IBM",              jobRole: "Senior Consultant",     location: "Delhi",     mentor: true  },
    { name: "Pooja Mishra",      year: "2021", branch: "CSE", company: "Paytm",            jobRole: "Frontend Developer",    location: "Noida",     mentor: false },
    { name: "Aditya Kumar",      year: "2019", branch: "ME",  company: "TATA Motors",      jobRole: "Product Engineer",      location: "Pune",      mentor: false },
    { name: "Ishaan Chatterjee", year: "2022", branch: "CSE", company: "Razorpay",         jobRole: "SDE I",                 location: "Bengaluru", mentor: false },
    { name: "Kavya Reddy",       year: "2020", branch: "CSE", company: "Swiggy",           jobRole: "Data Engineer",         location: "Bengaluru", mentor: true  },
    { name: "Nikhil Desai",      year: "2018", branch: "IT",  company: "HCL Technologies", jobRole: "System Architect",      location: "Noida",     mentor: true  },
    { name: "Tanvi Malhotra",    year: "2021", branch: "EEE", company: "L&T Technology",   jobRole: "Embedded Engineer",     location: "Pune",      mentor: false },
    { name: "Gaurav Saxena",     year: "2017", branch: "CSE", company: "Uber",             jobRole: "Senior SDE",            location: "Bengaluru", mentor: true  },
    { name: "Riya Pandey",       year: "2019", branch: "DS",  company: "PhonePe",          jobRole: "ML Engineer",           location: "Bengaluru", mentor: false },
    { name: "Aakash Dubey",      year: "2020", branch: "CSE", company: "Ola",              jobRole: "Full Stack Developer",  location: "Bengaluru", mentor: true  },
    { name: "Simran Kaur",       year: "2022", branch: "IT",  company: "Deloitte",         jobRole: "Technology Consultant", location: "Mumbai",    mentor: false }
  ];

  const MOCK_JOBS = [
    { title: "Frontend Intern (React)", company: "AlumniQ Labs",         location: "Remote",    type: "Internship", postedBy: "Aarav Sharma", skills: ["React", "HTML", "CSS", "JavaScript"] },
    { title: "Data Analyst",            company: "EduAnalytics Pvt Ltd", location: "Bengaluru", type: "Full-time",  postedBy: "Kavya Reddy",  skills: ["SQL", "Power BI", "Excel"] },
    { title: "Backend Developer",       company: "CloudBridge",          location: "Noida",     type: "Full-time",  postedBy: "Harshit Jain", skills: ["Node.js", "MongoDB", "REST API"] },
    { title: "ML Engineer Intern",      company: "PhonePe",              location: "Bengaluru", type: "Internship", postedBy: "Riya Pandey",  skills: ["Python", "TensorFlow", "SQL"] },
    { title: "Full Stack Developer",    company: "Ola",                  location: "Bengaluru", type: "Full-time",  postedBy: "Aakash Dubey", skills: ["React", "Node.js", "MongoDB"] }
  ];

  const MOCK_EVENTS = [
    { title: "Annual Alumni Meet 2026", date: "2026-12-20", mode: "On-Campus", description: "Reunion, networking and success story sessions.",        organizer: "Institute Admin"    },
    { title: "Web3 & Startups Webinar", date: "2026-12-10", mode: "Online",    description: "Alumni entrepreneurs share their startup journey.",       organizer: "Alumni Association" },
    { title: "Resume & Interview Prep", date: "2026-11-15", mode: "Online",    description: "Mock interviews and resume review by industry mentors.",  organizer: "Placement Cell"     }
  ];

  // Stats
  document.getElementById("statAlumni").textContent = MOCK_ALUMNI.length;
  document.getElementById("statJobs").textContent   = MOCK_JOBS.length;
  document.getElementById("statEvents").textContent = MOCK_EVENTS.length;

  renderAlumni(MOCK_ALUMNI);
  renderJobs(MOCK_JOBS);
  renderEvents(MOCK_EVENTS);
}

/* ==============================================
   MENTORSHIP REQUEST
============================================== */
async function requestMentorship(btn) {
  const user = JSON.parse(localStorage.getItem("alumiq_user"));
  if (!user) {
    showToast("Please log in to request mentorship.", true);
    return;
  }

  const mentorId   = btn.getAttribute("data-mentor-id");
  const mentorName = btn.getAttribute("data-mentor-name");

  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    const res = await fetch(`${API_URL}/mentorship/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId:   user.id,
        requesterName: user.name,
        mentorId:      mentorId,
        mentorName:    mentorName
      })
    });
    const data = await res.json();
    if (res.ok) {
      btn.textContent = "✅ Request Sent";
      btn.classList.remove("btn-outline");
      btn.classList.add("btn-primary");
      showToast(`Mentorship request sent to ${mentorName}! 🤝`);
    } else {
      btn.disabled = false;
      btn.textContent = "Request Mentorship";
      showToast(data.message || "Failed to send request.", true);
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Request Mentorship";
    showToast("Server error. Is the backend running?", true);
  }
}

/* ==============================================
   TOAST NOTIFICATION
============================================== */
function showToast(message, isError = false) {
  const existing = document.getElementById("aq-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "aq-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    background: ${isError ? 'rgba(220, 53, 69, 0.9)' : 'rgba(52, 211, 153, 0.9)'};
    color: #fff;
    font-family: var(--font-body, Inter, sans-serif);
    font-size: 0.95rem;
    font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    backdrop-filter: blur(10px);
    z-index: 9999;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.transform = "translateY(20px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ==============================================
   INITIALIZATION
============================================== */
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupNavigation();
  setupModals();
  loadDashboardData();
  
  // Mobile sidebar toggle
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  if (menuToggle && sidebar) {
    menuToggle.classList.remove("d-none");
    menuToggle.style.cursor = "pointer";
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
});
