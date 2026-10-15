// Config — auto-detect local vs. Vercel deployment
const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000/api"
  : "/api";

// Cache for alumni data (used by search)
let allAlumni = [];

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
    if (document.getElementById("profileAvatar")) document.getElementById("profileAvatar").textContent = initial;

    // Show profile detail previews if available
    if (user.company && document.getElementById("profileCompanyDisplay")) {
      document.getElementById("profileCompanyText").textContent = user.company;
      document.getElementById("profileCompanyDisplay").style.display = "inline";
    }
    if (user.jobRole && document.getElementById("profileJobRoleDisplay")) {
      document.getElementById("profileJobRoleText").textContent = user.jobRole;
      document.getElementById("profileJobRoleDisplay").style.display = "inline";
    }
    if (user.location && document.getElementById("profileLocationDisplay")) {
      document.getElementById("profileLocationText").textContent = user.location;
      document.getElementById("profileLocationDisplay").style.display = "inline";
    }

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

    // Cache & Render Alumni Table
    allAlumni = alumni;
    renderAlumniTable(alumni);
    setupAlumniSearch();

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

/* ==============================================
   ALUMNI TABLE RENDER HELPER
============================================== */
function renderAlumniTable(list) {
  const tbody = document.getElementById("alumniTableBody");
  const countEl = document.getElementById("alumniCount");
  if (!tbody) return;

  if (countEl) {
    countEl.textContent = list.length > 0
      ? `Showing ${list.length} of ${allAlumni.length} alumni`
      : "";
  }

  if (list.length > 0) {
    tbody.innerHTML = list.map(a => `
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
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No alumni match your search.</td></tr>';
  }
}

/* ==============================================
   ALUMNI SEARCH & FILTER
============================================== */
function setupAlumniSearch() {
  const input     = document.getElementById("alumniSearchInput");
  const clearBtn  = document.getElementById("alumniSearchClear");
  const chips     = document.querySelectorAll(".chip[data-filter]");
  if (!input) return;

  let activeFilter = "all";

  function applyFilters() {
    const query = input.value.trim().toLowerCase();
    let result = allAlumni;

    // Chip filter
    if (activeFilter === "mentor") {
      result = result.filter(a => a.mentor);
    } else if (activeFilter !== "all") {
      result = result.filter(a => (a.branch || "").toLowerCase() === activeFilter);
    }

    // Text search — matches name, company, role, location, branch, year
    if (query) {
      result = result.filter(a =>
        (a.name      || "").toLowerCase().includes(query) ||
        (a.company   || "").toLowerCase().includes(query) ||
        (a.jobRole   || "").toLowerCase().includes(query) ||
        (a.location  || "").toLowerCase().includes(query) ||
        (a.branch    || "").toLowerCase().includes(query) ||
        (a.year      || "").toLowerCase().includes(query)
      );
    }

    renderAlumniTable(result);
    clearBtn.classList.toggle("d-none", !query);
  }

  input.addEventListener("input", applyFilters);

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.classList.add("d-none");
    applyFilters();
    input.focus();
  });

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("chip-active"));
      chip.classList.add("chip-active");
      activeFilter = chip.getAttribute("data-filter");
      applyFilters();
    });
  });
}

/* ==============================================
   MODAL LOGIC
============================================== */
function setupModals() {
  const user = JSON.parse(localStorage.getItem("alumiq_user"));

  // Edit Profile Modal
  const editModal = document.getElementById("editProfileModal");
  const btnEdit = document.getElementById("btnEditProfile");
  const closeEdit = document.getElementById("closeEditProfile");
  if (btnEdit && editModal && closeEdit) {
    btnEdit.addEventListener("click", () => editModal.classList.remove("d-none"));
    closeEdit.addEventListener("click", () => editModal.classList.add("d-none"));
    editModal.addEventListener("click", (e) => { if (e.target === editModal) editModal.classList.add("d-none"); });
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
          showToast("Profile updated successfully! ✅");
          editModal.classList.add("d-none");
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showToast("Failed to update: " + data.message, true);
        }
      } catch (err) {
        showToast("Server error connecting to backend.", true);
      } finally {
        submitBtn.textContent = "Save Changes";
      }
    });
  }

  // Post Job Modal
  const jobModal = document.getElementById("postJobModal");
  const btnPostJob = document.getElementById("btnPostJob");
  const closeJob = document.getElementById("closePostJob");
  if (btnPostJob && jobModal && closeJob) {
    btnPostJob.addEventListener("click", () => jobModal.classList.remove("d-none"));
    closeJob.addEventListener("click", () => jobModal.classList.add("d-none"));
    jobModal.addEventListener("click", (e) => { if (e.target === jobModal) jobModal.classList.add("d-none"); });
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
        submitBtn.textContent = "Post Job";
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
    eventModal.addEventListener("click", (e) => { if (e.target === eventModal) eventModal.classList.add("d-none"); });
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
        submitBtn.textContent = "Create Event";
      }
    });
  }
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
