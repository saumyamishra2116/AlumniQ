// Config
const API_URL = "http://localhost:5000/api";

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
  // If on a public page and logged in, redirect to dashboard
  const isAuthPage = window.location.pathname.includes("login") || 
                     window.location.pathname.includes("reg") || 
                     window.location.pathname.endsWith("landing.html") ||
                     window.location.pathname === "/";
                     
  const user = JSON.parse(localStorage.getItem("alumiq_user"));

  if (isAuthPage && user) {
    window.location.href = "dashboard.html";
  } else if (!isAuthPage && !user && window.location.pathname.includes("dashboard")) {
    window.location.href = "login.html";
  }

  // Populate user info on dashboard
  if (user && document.getElementById("displayUserName")) {
    document.getElementById("displayUserName").textContent = user.name;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileRole").textContent = user.role.toUpperCase();
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById("avatarLetter").textContent = initial;
    document.getElementById("profileAvatar").textContent = initial;
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
        window.location.href = "dashboard.html";
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
        alertDiv.textContent = "Registration successful! Redirecting to login...";
        alertDiv.className = "alert success";
        setTimeout(() => { window.location.href = "login.html"; }, 2000);
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

// Fetch and Render Data for Dashboard
async function loadDashboardData() {
  if (!document.getElementById("sections-wrapper")) return; // Not on dashboard

  try {
    // Fetch Data
    const [alumniRes, jobsRes, eventsRes] = await Promise.all([
      fetch(`${API_URL}/alumni`),
      fetch(`${API_URL}/jobs`),
      fetch(`${API_URL}/events`)
    ]);

    const alumni = await alumniRes.json();
    const jobs = await jobsRes.json();
    const events = await eventsRes.json();

    // Update Stats
    document.getElementById("statAlumni").textContent = alumni.length;
    document.getElementById("statJobs").textContent = jobs.length;
    document.getElementById("statEvents").textContent = events.length;

    // Render Alumni Table
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

    // Render Mentorship Hub
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
          <button class="btn btn-outline btn-full" onclick="alert('Request sent to ${m.name}!')">Request Mentorship</button>
        </div>
      `).join('');
    } else {
      mentorGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No mentors available right now.</div>';
    }

    // Render Jobs
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

    // Render Events
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

  } catch (err) {
    console.error("Failed to load dashboard data", err);
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupNavigation();
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
