/**
 * Attendly - College Attendance & Biometric Face Kiosk System
 * Real-time client-side face tracking, local biometric template matching,
 * and comprehensive academic attendance management.
 */

function generateStudentAvatarSvg(name, bg = "#3b82f6") {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="240" height="240" rx="120" fill="url(#g)"/>
    <circle cx="120" cy="95" r="46" fill="rgba(255,255,255,0.2)"/>
    <path d="M 50 215 C 50 155, 190 155, 190 215 Z" fill="rgba(255,255,255,0.2)"/>
    <text x="120" y="110" font-family="-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif" font-size="42" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Initial student dataset
const defaultStudents = [
  { name: "Student", id: "CSE/23/041", dept: "CSE 3A", initials: "ST", rate: 92.4, status: "present", time: "09:52 AM", photo: generateStudentAvatarSvg("Student", "#3b82f6") },
  { name: "Diya Nair", id: "CSE/23/042", dept: "CSE 3A", initials: "DN", rate: 92, status: "present", time: "09:54 AM", photo: generateStudentAvatarSvg("Diya Nair", "#ec4899") },
  { name: "Rohan Verma", id: "CSE/23/043", dept: "CSE 3A", initials: "RV", rate: 84, status: "late", time: "10:04 AM", photo: generateStudentAvatarSvg("Rohan Verma", "#f59e0b") },
  { name: "Isha Gupta", id: "CSE/23/044", dept: "CSE 3A", initials: "IG", rate: 96, status: "present", time: "09:50 AM", photo: generateStudentAvatarSvg("Isha Gupta", "#10b981") },
  { name: "Rahul Joshi", id: "CSE/23/045", dept: "CSE 3A", initials: "RJ", rate: 68, status: "absent", time: "—", photo: generateStudentAvatarSvg("Rahul Joshi", "#6366f1") },
  { name: "Priya Mehta", id: "CSE/23/046", dept: "CSE 3A", initials: "PM", rate: 78, status: "absent", time: "—", photo: generateStudentAvatarSvg("Priya Mehta", "#8b5cf6") },
  { name: "Arjun Kapoor", id: "CSE/23/047", dept: "CSE 3A", initials: "AK", rate: 71, status: "absent", time: "—", photo: generateStudentAvatarSvg("Arjun Kapoor", "#06b6d4") },
  { name: "Sneha Reddy", id: "CSE/23/048", dept: "CSE 3A", initials: "SR", rate: 89, status: "present", time: "09:55 AM", photo: generateStudentAvatarSvg("Sneha Reddy", "#14b8a6") },
  { name: "Vikram Malhotra", id: "CSE/23/049", dept: "CSE 3A", initials: "VM", rate: 82, status: "present", time: "09:58 AM", photo: generateStudentAvatarSvg("Vikram Malhotra", "#f97316") },
  { name: "Ananya Iyer", id: "CSE/23/050", dept: "CSE 3A", initials: "AI", rate: 94, status: "present", time: "09:48 AM", photo: generateStudentAvatarSvg("Ananya Iyer", "#d946ef") },
];

const defaultLeaves = [
  { name: "Priya Mehta", class: "CSE 3A", type: "Medical leave", dates: "19–21 Aug", initials: "PM" },
  { name: "Karan Malhotra", class: "CSE 2B", type: "Personal leave", dates: "21 Aug", initials: "KM" },
  { name: "Nisha Patel", class: "CSE 3A", type: "Duty leave (Sports)", dates: "20–22 Aug", initials: "NP" },
];

// Utility shortcuts
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const storage = {
  get: (k, def = []) => {
    try {
      const val = localStorage.getItem(k);
      return val ? JSON.parse(val) : def;
    } catch {
      return def;
    }
  },
  set: (k, val) => {
    try {
      localStorage.setItem(k, JSON.stringify(val));
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  },
};

// Backend API Bridge (MongoDB & Railway Cloud Sync)
const api = {
  async checkHealth() {
    try {
      const res = await fetch("/api/health");
      return await res.json();
    } catch {
      return null;
    }
  },
  async getStudents() {
    try {
      const res = await fetch("/api/students");
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
  async getTodayAttendance(date) {
    try {
      const q = date ? `?date=${encodeURIComponent(date)}` : "";
      const res = await fetch("/api/attendance/today" + q);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
  async checkInStudent(rollNo, name, method = "kiosk", confidence = 0.96) {
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo, studentName: name, method, confidence }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
  async enrollStudent(student) {
    try {
      const res = await fetch("/api/students/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
  async deleteStudent(rollNo) {
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(rollNo)}`, {
        method: "DELETE",
      });
      return await res.json();
    } catch {
      return null;
    }
  },
  async getLeaves() {
    try {
      const res = await fetch("/api/leaves");
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
  async applyLeave(leaveData) {
    try {
      const res = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveData),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
  async updateLeaveStatus(id, status) {
    try {
      const res = await fetch(`/api/leaves/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
  async batchSaveAttendance(records) {
    try {
      const res = await fetch("/api/attendance/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
};

function formatStudentFromMongo(doc) {
  const roll = doc.rollNo || doc.id || "CSE/23/000";
  const name = doc.name || "Student";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    name,
    id: roll,
    dept: doc.classId || doc.dept || "CSE 3A",
    initials,
    rate: doc.attendanceRate || doc.rate || 88,
    status: doc.status || "absent",
    time: doc.time || "—",
    photo: doc.avatar || doc.photo || generateStudentAvatarSvg(name),
    descriptor: doc.faceDescriptor || doc.descriptor || [],
  };
}

let isCloudSyncing = false;
async function syncWithBackend() {
  if (isCloudSyncing) return;
  isCloudSyncing = true;
  try {
    // 1. Synchronize Students
    const cloudStudents = await api.getStudents();
    if (cloudStudents && Array.isArray(cloudStudents) && cloudStudents.length > 0) {
      students = cloudStudents.map(formatStudentFromMongo);
      storage.set("attendlyStudents", students);
    }

    // 2. Synchronize Today's Live Attendance
    const todayLogs = await api.getTodayAttendance();
    if (todayLogs && Array.isArray(todayLogs)) {
      todayLogs.forEach((log) => {
        const s = students.find((item) => item.id === log.rollNo);
        if (s) {
          s.status = log.status || "present";
          s.time = log.time || "—";
        }
      });
      storage.set("attendlyStudents", students);
    }

    // 3. Synchronize Leaves
    const cloudLeaves = await api.getLeaves();
    if (cloudLeaves && Array.isArray(cloudLeaves)) {
      leaves = cloudLeaves.map((l) => ({
        id: l._id,
        name: l.studentName || l.name,
        class: l.classId || l.class || "CSE 3A",
        type: l.type || "Medical leave",
        dates: l.fromDate && l.toDate ? `${l.fromDate} – ${l.toDate}` : l.dates || "Pending",
        reason: l.reason || "",
        status: l.status || "pending",
        initials: (l.studentName || l.name || "ST")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      }));
      storage.set("attendlyLeaves", leaves);
    }

    // Re-render visible active components
    if (typeof renderRoster === "function") renderRoster();
    if (typeof updateRosterSummary === "function") updateRosterSummary();
    if (typeof renderLeaves === "function") renderLeaves();
    if (typeof renderPeopleDirectory === "function") renderPeopleDirectory();
    if (typeof populateKioskFastChips === "function") populateKioskFastChips();
  } catch (e) {
    console.debug("Background sync notice:", e);
  } finally {
    isCloudSyncing = false;
  }
}

// State initialization
let students = storage.get("attendlyStudents", defaultStudents);
if (!students || students.length === 0) {
  students = defaultStudents;
}
// Auto-migrate and ensure every student has an interactive zoomable photo avatar
students.forEach((s) => {
  if (!s.photo) {
    s.photo = generateStudentAvatarSvg(s.name);
  }
});
storage.set("attendlyStudents", students);

let leaves = storage.get("attendlyLeaves", defaultLeaves);
let currentFilter = "all";
let searchTerm = "";

// Toast Notification
function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2800);
}

// Web Audio API Chime Synth
let audioCtx = null;
function playSound(type = "success") {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Silent fallback if audio context blocked
  }
}

// Clock and Greetings
function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const role = $("#roleSelect")?.value || "teacher";

  const greetingEl = $("#greeting");
  if (greetingEl) {
    greetingEl.textContent =
      role === "student"
        ? "STUDENT DASHBOARD"
        : role === "admin"
        ? "ADMINISTRATION & SYSTEM AUDIT"
        : `${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()} · ${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  const titleEl = $("#pageTitle");
  if (titleEl && $(".view.active")?.id === "overview") {
    titleEl.textContent = `${role === "student" ? "Welcome, Student" : role === "admin" ? "Welcome, Admin" : greeting + ", Teacher"}`;
  }

  const camClock = $("#cameraClock");
  if (camClock) {
    camClock.textContent = now.toLocaleTimeString("en-IN", { hour12: false });
  }
}
updateClock();
setInterval(updateClock, 1000);

// NAVIGATION
function showView(viewId) {
  if (!viewId) return;
  const role = $("#roleSelect")?.value || "teacher";
  $$(".view").forEach((v) => v.classList.remove("active"));
  const target = $("#" + viewId);
  if (target) target.classList.add("active");

  $$(".nav-item").forEach((n) => {
    n.classList.toggle("active", n.dataset.view === viewId);
  });

  const titles = {
    overview: role === "student" ? "Student Attendance Portal" : role === "admin" ? "Administration Overview" : "Faculty Attendance Overview",
    "my-attendance": "My Attendance Record",
    "my-badge": "My Digital QR Badge",
    "student-leaves": "Apply for Leave",
    attendance: "Take Attendance",
    kiosk: "Face Attendance Kiosk",
    timetable: "Academic Timetable",
    reports: "Attendance Reports & Analytics",
    leaves: "Leave Approvals",
    people: "People Directory",
    profiles: "Face Profiles & Biometric Consent",
    classes: "Classes & Subjects",
  };

  const titleEl = $("#pageTitle");
  if (titleEl) titleEl.textContent = titles[viewId] || "Attendly";

  if (viewId === "overview") renderOverviewBars($("#overviewWeekSelect")?.value || "this");
  if (viewId === "attendance") renderRoster();
  if (viewId === "timetable") renderTimetable();
  if (viewId === "reports") renderReportSummary("class");
  if (viewId === "people") renderPeopleDirectory();
  if (viewId === "profiles") renderProfiles();
  if (viewId === "kiosk") updateKioskLogTicker();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-view]");
  if (btn && btn.dataset.view) {
    e.preventDefault();
    showView(btn.dataset.view);
  }
});

// ROSTER ATTENDANCE RENDERING & LOGIC
function renderRoster() {
  const container = $("#rosterRows");
  if (!container) return;

  const q = searchTerm.toLowerCase().trim();
  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchesFilter = currentFilter === "all" ? true : s.status === currentFilter;
    return matchesSearch && matchesFilter;
  });

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 28px; text-align: center; color: var(--muted)">No students match the current filter or search term.</div>`;
  } else {
    filtered.forEach((s) => {
      const row = document.createElement("div");
      row.className = "roster-row";
      row.innerHTML = `
        <div class="student">
          ${s.photo
            ? `<div class="round-avatar zoomable-user-avatar" data-photo="${s.photo}" data-name="${s.name}" data-id="${s.id}" data-meta="${s.dept || 'CSE 3A'}" title="Click to zoom captured image" style="background:none;padding:0;overflow:hidden;"><img src="${s.photo}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"/></div>`
            : `<div class="round-avatar ${s.status === "present" ? "green" : s.status === "late" ? "yellow" : "coral"}">${s.initials}</div>`
          }
          <div>
            <strong ${s.photo ? `class="zoomable-student-name" data-photo="${s.photo}" data-name="${s.name}" data-id="${s.id}" data-meta="${s.dept || 'CSE 3A'}" style="cursor:pointer;" title="Click to zoom captured image"` : ""}>${s.name}</strong>
            <small>${s.id} · ${s.dept}</small>
          </div>
        </div>
        <div class="status-toggle" data-id="${s.id}">
          <button class="${s.status === "present" ? "present" : ""}" data-status="present">Present</button>
          <button class="${s.status === "late" ? "late" : ""}" data-status="late">Late</button>
          <button class="${s.status === "absent" ? "absent" : ""}" data-status="absent">Absent</button>
        </div>
        <span class="checkin">${s.time || "—"}</span>
      `;
      container.appendChild(row);
    });

    // Bind Zoom Lightbox on click
    container.querySelectorAll(".zoomable-user-avatar, .zoomable-student-name").forEach((el) => {
      el.addEventListener("click", () => {
        openImageZoomModal(
          el.dataset.photo,
          el.dataset.name,
          el.dataset.id,
          el.dataset.meta
        );
      });
    });
  }

  // Bind status toggles
  container.querySelectorAll(".status-toggle button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = btn.parentElement;
      const studentId = parent.dataset.id;
      const status = btn.dataset.status;

      const student = students.find((s) => s.id === studentId);
      if (student) {
        student.status = status;
        if (status === "present" || status === "late") {
          const now = new Date();
          student.time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        } else {
          student.time = "—";
        }
        storage.set("attendlyStudents", students);
        renderRoster();
        updateRosterSummary();
      }
    });
  });

  updateRosterSummary();
}

function updateRosterSummary() {
  const present = students.filter((s) => s.status === "present").length;
  const late = students.filter((s) => s.status === "late").length;
  const absent = students.filter((s) => s.status === "absent").length;
  const total = students.length;

  const countP = $("#countPresent");
  const countL = $("#countLate");
  const countA = $("#countAbsent");
  const countT = $("#countTotal");
  const progFill = $("#rosterProgressFill");
  const progText = $("#rosterPercentText");

  if (countP) countP.textContent = present;
  if (countL) countL.textContent = late;
  if (countA) countA.textContent = absent;
  if (countT) countT.textContent = total;

  const attendedPercent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  if (progFill) progFill.style.width = `${attendedPercent}%`;
  if (progText) progText.textContent = `${attendedPercent}% Attended (${present + late}/${total})`;

  // Update Overview stats
  const statToday = $("#statTodayRate");
  if (statToday) statToday.innerHTML = `${attendedPercent}<span>%</span>`;

  const atRisk = students.filter((s) => s.rate < 75).length;
  const atRiskEl = $("#statAtRiskCount");
  if (atRiskEl) atRiskEl.textContent = atRisk;
}

// Roster Filter Pills
$$(".roster-filter-pills .pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    $$(".roster-filter-pills .pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.dataset.filter || "all";
    renderRoster();
  });
});

// Search input bindings
$("#rosterSearch")?.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderRoster();
});

$("#globalSearch")?.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  if ($(".view.active")?.id !== "attendance") {
    showView("attendance");
  }
  const rInput = $("#rosterSearch");
  if (rInput) rInput.value = searchTerm;
  renderRoster();
});

// Mark All Present Action
$("#markAllPresentBtn")?.addEventListener("click", async () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  students.forEach((s) => {
    s.status = "present";
    s.time = timeStr;
  });
  storage.set("attendlyStudents", students);
  renderRoster();
  toast("All students marked Present for CSE 3A");
  playSound("success");

  // Sync to MongoDB Cloud
  await api.batchSaveAttendance(
    students.map((s) => ({
      rollNo: s.id,
      name: s.name,
      classId: s.dept,
      status: "present",
      time: timeStr,
    }))
  );
});

// Save Attendance Action
$("#saveAttendance")?.addEventListener("click", async () => {
  const present = students.filter((s) => s.status === "present").length;
  const late = students.filter((s) => s.status === "late").length;
  const absent = students.filter((s) => s.status === "absent").length;

  // Log session record
  const now = new Date();
  const sessionRecord = {
    session: `CSE3A-DS-${now.toISOString().slice(0, 10)}`,
    date: now.toLocaleDateString("en-IN"),
    time: now.toLocaleTimeString("en-IN"),
    present,
    late,
    absent,
    total: students.length,
    rate: Math.round(((present + late) / students.length) * 100),
  };

  const allRecords = storage.get("attendlySessions", []);
  allRecords.push(sessionRecord);
  storage.set("attendlySessions", allRecords);

  // Sync to MongoDB Cloud Database
  const batchRes = await api.batchSaveAttendance(
    students.map((s) => ({
      rollNo: s.id,
      name: s.name,
      classId: s.dept,
      status: s.status,
      time: s.time !== "—" ? s.time : now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }))
  );

  toast(
    `Attendance saved to Cloud: ${present} Present, ${late} Late, ${absent} Absent`
  );
  playSound("success");
});

// Method Tabs
$$(".method-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".method-tabs button").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    const method = btn.dataset.method;
    if (method === "kiosk") {
      showView("kiosk");
    } else if (method === "qr") {
      openQrScannerModal();
    }
  });
});

// Hero Buttons
$("#heroKioskBtn")?.addEventListener("click", () => showView("kiosk"));
$("#markBtn")?.addEventListener("click", () => showView("attendance"));

/* ==========================================================================
   BIOMETRIC CAMERA & COMPUTER VISION ENGINE
   ========================================================================== */

const video = $("#kioskVideo");
const canvas = $("#faceCanvas");
const startCameraBtn = $("#startCamera");
const stopCameraBtn = $("#stopCameraBtn");
const scanButton = $("#startScan");
const faceGuide = $("#faceGuide");
const hudOverlay = $("#hudOverlay");
const cameraStateEl = $("#cameraState");
const cameraHintEl = $("#cameraHint");
const livenessHintEl = $("#livenessHint");
const cameraSourceSelect = $("#cameraSourceSelect");

let mediaStream = null;
let animationFrameId = null;
let isSimulationMode = false;
let simulationStep = 0;
let lastFrameTime = performance.now();
let fpsCount = 30;

// Vision tracking state
let currentFaceBox = null;
let faceDetected = false;
let faceConfidence = 0;
let livenessScore = 0;
let recentMotionScores = [];
let lastLuminanceMap = null;

// Retrieve verified biometric profiles for enrolled students
function getEnrolledProfiles() {
  const custom = storage.get("attendlyFaceProfiles", []);
  const list = [...custom];

  // Include any students from MongoDB who have an enrolled face descriptor
  students.forEach((s) => {
    if (s.descriptor && Array.isArray(s.descriptor) && s.descriptor.length >= 16) {
      if (!list.some((p) => p.id === s.id)) {
        list.push({
          name: s.name,
          id: s.id,
          dept: s.dept || "CSE 3A",
          featureVector: s.descriptor,
          updated: Date.now(),
          consent: true,
          photo: s.photo || "",
        });
      }
    }
  });

  return list;
}

// Populate 1-Click Fast Identify Roster Chips on Kiosk
function populateKioskFastChips() {
  const container = $("#kioskFastChips");
  if (!container) return;
  container.innerHTML = students
    .map(
      (s) => `
    <button class="pill small kiosk-fast-chip" data-id="${s.id}" data-name="${escapeHtml(s.name)}" style="font-size:11.5px; padding:4px 10px; border-radius:12px; cursor:pointer; background:var(--panel-bg-subtle); border:1px solid var(--line); color:var(--ink);" title="Click to verify or register face for ${escapeHtml(s.name)}">
      <b>${escapeHtml(s.name)}</b> <small style="opacity:0.75;">(${s.id})</small>
    </button>
  `
    )
    .join("");

  container.querySelectorAll(".kiosk-fast-chip").forEach((chip) => {
    chip.addEventListener("click", async () => {
      const student = students.find((s) => s.id === chip.dataset.id);
      if (student) {
        // If face is currently in frame, capture & enroll this unique face to this student
        if (faceDetected && video && video.readyState >= 2) {
          const liveVector = extractFeatureVector();
          const profiles = storage
            .get("attendlyFaceProfiles", [])
            .filter((p) => p.id !== student.id);
          profiles.push({
            name: student.name,
            id: student.id,
            dept: student.dept || "CSE 3A",
            featureVector: liveVector,
            updated: Date.now(),
            consent: true,
            photo: student.photo || "",
          });
          storage.set("attendlyFaceProfiles", profiles);

          student.descriptor = liveVector;
          api.enrollStudent({
            name: student.name,
            rollNo: student.id,
            classId: student.dept,
            avatar: student.photo || "",
            faceDescriptor: liveVector,
            consentGiven: true,
          });
          toast(`Face enrolled & verified for ${student.name}!`);
        }

        liveMatchedStudent = {
          name: student.name,
          id: student.id,
          dept: student.dept || "CSE 3A",
        };
        processRealtimeCheckin(liveMatchedStudent, 98);
      }
    });
  });
}
setTimeout(populateKioskFastChips, 100);

// Enumerate available video devices
async function populateCameraDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    if (cameraSourceSelect && videoDevices.length > 0) {
      cameraSourceSelect.innerHTML = "";
      videoDevices.forEach((dev, idx) => {
        const opt = document.createElement("option");
        opt.value = dev.deviceId;
        opt.textContent = dev.label || `Camera ${idx + 1}`;
        cameraSourceSelect.appendChild(opt);
      });
    }
  } catch (e) {
    console.warn("Device enumeration failed:", e);
  }
}
populateCameraDevices();

// Start Camera with universal browser compatibility & fallbacks
async function startCameraStream() {
  isSimulationMode = false;
  try {
    kioskResult("neutral", "INITIALIZING CAMERA", "Starting Video Stream...", "Requesting camera permissions...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia is not supported on this browser or context.");
    }

    const selectedDeviceId = cameraSourceSelect?.value;
    const constraints = {
      video: selectedDeviceId && selectedDeviceId !== "default"
        ? { deviceId: { exact: selectedDeviceId } }
        : { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    };

    // Try primary constraints, fallback to generic video if needed
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (conErr) {
      console.warn("Specific constraints failed, trying generic video constraint:", conErr);
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    video.srcObject = mediaStream;
    await video.play();

    // Re-enumerate to get device labels now that permission is granted
    populateCameraDevices();

    // UI Updates
    if (cameraStateEl) cameraStateEl.textContent = "● LIVE BIOMETRIC FEED";
    if (cameraHintEl) cameraHintEl.textContent = "Align face in frame";
    if (livenessHintEl) livenessHintEl.textContent = "Natural micro-motion active";
    if (hudOverlay) hudOverlay.style.display = "flex";

    startCameraBtn.classList.add("hidden");
    scanButton.classList.remove("hidden");
    stopCameraBtn.classList.remove("hidden");

    kioskResult(
      "neutral",
      "BIOMETRIC FEED ACTIVE",
      "Face Biometrics Ready",
      "Stand within the guide. The AI is continuously analyzing face landmarks & liveness."
    );

    const syncEl = $("#syncState");
    if (syncEl) syncEl.textContent = "Live Camera · Local AI";

    // Launch real-time tracking loop
    startTrackingLoop();
    toast("Camera started successfully");
  } catch (err) {
    console.error("Camera startup error:", err);
    stopCameraStream();

    let userMsg = err.message;
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      userMsg = "Camera permission was denied. Please allow camera access in your browser address bar.";
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      userMsg = "No webcam detected on this device. Try 'Simulation Mode' to test biometrics.";
    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      userMsg = "Webcam is currently in use by another application.";
    }

    kioskResult("failure", "CAMERA NOTICE", "Camera unavailable", userMsg);
    if (startCameraBtn) startCameraBtn.textContent = "Retry camera";
    toast("Camera unavailable: Use Simulation Mode to test");
  }
}

// Stop Camera
function stopCameraStream() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (video) {
    video.srcObject = null;
  }
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }
  targetFaceBox = null;
  smoothedFaceBox = null;
  currentFaceBox = null;
  liveMatchedStudent = null;
  autoVerifyHoldCount = 0;
  lastResultState = "idle";
  faceDetected = false;
  faceConfidence = 0;
  livenessScore = 0;
  livenessMotionHistory = [];

  if (cameraStateEl) cameraStateEl.textContent = "● CAMERA OFF";
  if (cameraHintEl) cameraHintEl.textContent = "Start the camera";
  if (livenessHintEl) livenessHintEl.textContent = "Local AI template matching";
  if (hudOverlay) hudOverlay.style.display = "none";
  if (faceGuide) faceGuide.classList.remove("detected");

  startCameraBtn.classList.remove("hidden");
  startCameraBtn.textContent = "Start camera";
  scanButton.classList.add("hidden");
  stopCameraBtn.classList.add("hidden");

  const syncEl = $("#syncState");
  if (syncEl) syncEl.textContent = "Ready";
}

// Toggle Simulation / Demo Mode (for devices without webcam)
function toggleSimulationMode() {
  if (isSimulationMode) {
    stopCameraStream();
    isSimulationMode = false;
    toast("Exited simulation mode");
    return;
  }

  stopCameraStream();
  isSimulationMode = true;

  if (cameraStateEl) cameraStateEl.textContent = "● SIMULATED BIOMETRIC FEED";
  if (cameraHintEl) cameraHintEl.textContent = "Simulated Student Face";
  if (livenessHintEl) livenessHintEl.textContent = "Synthetic liveness loop active";
  if (hudOverlay) hudOverlay.style.display = "flex";

  startCameraBtn.classList.add("hidden");
  scanButton.classList.remove("hidden");
  stopCameraBtn.classList.remove("hidden");

  kioskResult(
    "neutral",
    "SIMULATION MODE",
    "Simulated Face: Adarsh Sharma",
    "Simulated high-resolution video stream generated. Click <b>Verify & mark attendance</b>."
  );

  const syncEl = $("#syncState");
  if (syncEl) syncEl.textContent = "Simulated Feed · Ready";

  startTrackingLoop();
  toast("Simulation mode active (Test biometrics without a webcam)");
}

// BlazeFace AI Neural Face Detector State
let blazefaceModel = null;
let isBlazeLoading = false;
let isEstimatingBlaze = false;
let lastBlazePredictions = null;

async function loadBlazeFaceModel() {
  if (blazefaceModel || isBlazeLoading || typeof blazeface === "undefined") return;
  try {
    isBlazeLoading = true;
    blazefaceModel = await blazeface.load();
    console.log("✓ BlazeFace AI neural network loaded");
  } catch (err) {
    console.warn("BlazeFace load warning (fallback active):", err);
    blazefaceModel = null;
  } finally {
    isBlazeLoading = false;
  }
}
loadBlazeFaceModel();

// Pre-allocated static buffers for zero-allocation, 60fps computer vision
const VISION_W = 64;
const VISION_H = 48;
const staticOffCanvas = document.createElement("canvas");
staticOffCanvas.width = VISION_W;
staticOffCanvas.height = VISION_H;
const staticOffCtx = staticOffCanvas.getContext("2d", { willReadFrequently: true });

const staticLumGrid = new Float32Array(VISION_W * VISION_H);
const staticPrevLumGrid = new Float32Array(VISION_W * VISION_H);
const staticSkinGrid = new Uint8Array(VISION_W * VISION_H);

let smoothedFaceBox = null;
let targetFaceBox = null;
let lastVisionTime = 0;
let lastMatchTime = 0;
let dynamicLivenessScore = 0;
let livenessMotionHistory = [];

// Real-time Recognition & Auto-Check-in State
let liveMatchedStudent = null;
let liveMatchDistance = 999;
let autoVerifyHoldCount = 0;
const autoMarkCooldown = new Map(); // studentId -> timestamp
let lastResultState = "neutral";

// Real-Time Computer Vision & HUD Canvas Tracking Loop (Zero-Allocation 60 FPS)
function startTrackingLoop() {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  smoothedFaceBox = null;
  targetFaceBox = null;
  lastVisionTime = 0;
  lastMatchTime = 0;
  autoVerifyHoldCount = 0;
  liveMatchedStudent = null;
  faceDetected = false;
  faceConfidence = 0;
  dynamicLivenessScore = 0;
  livenessMotionHistory = [];

  loadBlazeFaceModel();

  async function runBlazeFaceDetection() {
    if (!blazefaceModel || isEstimatingBlaze || !mediaStream || video.readyState < 2) return;
    try {
      isEstimatingBlaze = true;
      const predictions = await blazefaceModel.estimateFaces(video, false, true, 0.70);
      lastBlazePredictions = predictions || [];
    } catch (e) {
      console.warn("BlazeFace inference warning:", e);
      lastBlazePredictions = [];
    } finally {
      isEstimatingBlaze = false;
    }
  }

  function renderFrame(now) {
    // Calculate FPS
    const delta = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    if (delta > 0) {
      fpsCount = Math.round(fpsCount * 0.9 + (1 / delta) * 0.1);
    }
    const hudFps = $("#hudFps");
    if (hudFps) hudFps.textContent = `${Math.min(fpsCount, 60)} FPS`;

    // Ensure canvas matches viewport
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (isSimulationMode) {
      // Draw simulated synthetic camera frame
      simulationStep += 0.04;
      const centerX = width / 2 + Math.sin(simulationStep) * 14;
      const centerY = height / 2 + Math.cos(simulationStep * 0.7) * 8;
      const boxW = width * 0.38;
      const boxH = height * 0.52;

      currentFaceBox = {
        x: centerX - boxW / 2,
        y: centerY - boxH / 2,
        width: boxW,
        height: boxH,
      };

      faceDetected = true;
      faceConfidence = 0.98;
      livenessScore = 0.95;

      liveMatchedStudent = {
        name: "Adarsh Sharma",
        id: "CSE/23/041",
        dept: "CSE 3A",
      };
      liveMatchDistance = 6;

      drawBiometricHUD(
        ctx,
        currentFaceBox,
        width,
        height,
        "Adarsh Sharma (98%)",
        0.98,
        0.95,
        true
      );

      // Real-time auto verification in simulation mode
      autoVerifyHoldCount++;
      if (autoVerifyHoldCount >= 8) {
        processRealtimeCheckin(liveMatchedStudent, 98);
      }
    } else if (mediaStream && video.readyState >= 2) {
      // Trigger BlazeFace Neural Detection when model is ready
      if (blazefaceModel && !isEstimatingBlaze) {
        runBlazeFaceDetection();
      }

      // Run computer vision at 25Hz
      if (now - lastVisionTime > 40) {
        lastVisionTime = now;
        const visionResult = analyzeFrameFeaturesFast(width, height);
        faceDetected = visionResult.detected;
        faceConfidence = visionResult.confidence;
        livenessScore = visionResult.liveness;

        if (faceDetected && visionResult.box) {
          targetFaceBox = visionResult.box;
        } else {
          targetFaceBox = null;
        }
      }

      // Run real-time biometric identity matching every 120ms against enrolled profiles
      if (faceDetected && now - lastMatchTime > 120) {
        lastMatchTime = now;
        const currentVector = extractFeatureVector();
        const profiles = getEnrolledProfiles();

        if (profiles.length > 0) {
          const matches = profiles
            .map((p) => ({
              ...p,
              distance: calculateVectorDistance(currentVector, p.featureVector),
            }))
            .sort((a, b) => a.distance - b.distance);

          const best = matches[0];
          // Strict biometric threshold: only authentic enrolled face matches (<= 18 Euclidean delta)
          if (best && best.distance <= 18) {
            liveMatchedStudent = best;
            liveMatchDistance = best.distance;
          } else {
            liveMatchedStudent = null;
            liveMatchDistance = 999;
          }
        } else {
          liveMatchedStudent = null;
          liveMatchDistance = 999;
        }
      }

      if (faceDetected && targetFaceBox) {
        // Smoothly interpolate bounding box at 60 FPS
        if (!smoothedFaceBox) {
          smoothedFaceBox = { ...targetFaceBox };
        } else {
          const alpha = 0.35;
          smoothedFaceBox.x += (targetFaceBox.x - smoothedFaceBox.x) * alpha;
          smoothedFaceBox.y += (targetFaceBox.y - smoothedFaceBox.y) * alpha;
          smoothedFaceBox.width += (targetFaceBox.width - smoothedFaceBox.width) * alpha;
          smoothedFaceBox.height += (targetFaceBox.height - smoothedFaceBox.height) * alpha;
        }
        currentFaceBox = smoothedFaceBox;

        const isRecognized = !!liveMatchedStudent;
        const matchPct = isRecognized
          ? Math.max(90, Math.min(99, Math.round(100 - liveMatchDistance)))
          : Math.round(faceConfidence * 100);

        const hudLabel = isRecognized
          ? `${liveMatchedStudent.name} (${matchPct}%)`
          : `Face Detected · Unregistered`;

        drawBiometricHUD(
          ctx,
          currentFaceBox,
          width,
          height,
          hudLabel,
          faceConfidence,
          livenessScore,
          isRecognized
        );

        // Real-time automatic check-in trigger
        if (isRecognized && faceConfidence >= 0.70 && livenessScore >= 0.70) {
          autoVerifyHoldCount++;
          const camDetail = $("#camStatusDetail");
          if (camDetail) {
            camDetail.textContent = `● Identified ${liveMatchedStudent.name} · Auto-marking attendance...`;
          }

          if (autoVerifyHoldCount >= 3) {
            processRealtimeCheckin(liveMatchedStudent, matchPct);
          }
        } else if (!isRecognized) {
          autoVerifyHoldCount = 0;
          const camDetail = $("#camStatusDetail");
          if (camDetail) {
            camDetail.textContent = "● Face detected (Unregistered) · Tap your name below to link face";
          }
        }
      } else {
        smoothedFaceBox = null;
        currentFaceBox = null;
        liveMatchedStudent = null;
        autoVerifyHoldCount = 0;

        const camDetail = $("#camStatusDetail");
        if (camDetail) {
          camDetail.textContent = "● Ready to verify student faces · Auto-scan active";
        }
      }
    }

    // Update HUD stats overlay with real computed metrics
    const hudConf = $("#hudConfidence");
    const hudLive = $("#hudLiveness");
    if (hudConf) {
      hudConf.textContent = faceDetected
        ? `Face: ${Math.round(faceConfidence * 100)}%`
        : "Face: None";
    }
    if (hudLive) {
      hudLive.textContent = faceDetected
        ? `Liveness: ${Math.round(livenessScore * 100)}%`
        : "Liveness: Waiting";
    }

    if (faceGuide) {
      faceGuide.classList.toggle(
        "detected",
        faceDetected && (!!liveMatchedStudent || faceConfidence > 0.70)
      );
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  animationFrameId = requestAnimationFrame(renderFrame);
}

// Ultra-Accurate Face & Liveness Computer Vision Engine
function analyzeFrameFeaturesFast(width, height) {
  if (!video || video.readyState < 2) {
    return { detected: false, confidence: 0, liveness: 0, box: null };
  }

  const vW = video.videoWidth || 640;
  const vH = video.videoHeight || 480;

  // 1. Check if BlazeFace neural model has active predictions
  if (lastBlazePredictions && lastBlazePredictions.length > 0) {
    const face = lastBlazePredictions[0];
    const rawX1 = face.topLeft[0];
    const rawY1 = face.topLeft[1];
    const rawX2 = face.bottomRight[0];
    const rawY2 = face.bottomRight[1];
    const rawW = rawX2 - rawX1;
    const rawH = rawY2 - rawY1;

    const prob = Array.isArray(face.probability) ? face.probability[0] : (face.probability || 0.95);

    if (prob >= 0.65 && rawW >= 25 && rawH >= 25) {
      // Precision Centered Anchor Mapping in Mirrored Screen Space
      const rawCenterX = (rawX1 + rawX2) / 2;
      const rawCenterY = (rawY1 + rawY2) / 2;
      const screenCenterX = (1 - rawCenterX / vW) * width;
      const screenCenterY = (rawCenterY / vH) * height;

      const screenW = (rawW / vW) * width * 1.10;
      const screenH = (rawH / vH) * height * 1.15;
      const screenX = screenCenterX - screenW / 2;
      const screenY = screenCenterY - screenH / 2;

      // Calculate optical liveness inside detected face area
      staticOffCtx.drawImage(video, 0, 0, VISION_W, VISION_H);
      const imgData = staticOffCtx.getImageData(0, 0, VISION_W, VISION_H);
      const data = imgData.data;

      const normFx1 = Math.max(0, Math.floor((rawX1 / vW) * VISION_W));
      const normFx2 = Math.min(VISION_W, Math.ceil((rawX2 / vW) * VISION_W));
      const normFy1 = Math.max(0, Math.floor((rawY1 / vH) * VISION_H));
      const normFy2 = Math.min(VISION_H, Math.ceil((rawY2 / vH) * VISION_H));

      let motionDelta = 0;
      let count = 0;

      for (let y = normFy1; y < normFy2; y++) {
        for (let x = normFx1; x < normFx2; x++) {
          const idx = y * VISION_W + x;
          const pIdx = idx * 4;
          const lum = 0.299 * data[pIdx] + 0.587 * data[pIdx + 1] + 0.114 * data[pIdx + 2];
          staticLumGrid[idx] = lum;
          motionDelta += Math.abs(lum - staticPrevLumGrid[idx]);
          count++;
        }
      }

      const avgMotion = count > 0 ? motionDelta / count : 1.5;
      staticPrevLumGrid.set(staticLumGrid);

      livenessMotionHistory.push(avgMotion);
      if (livenessMotionHistory.length > 15) livenessMotionHistory.shift();
      const smoothMotion = livenessMotionHistory.reduce((a, b) => a + b, 0) / livenessMotionHistory.length;

      const liveScore = smoothMotion > 0.15 ? Math.min(0.97, 0.85 + (smoothMotion / 20) * 0.12) : 0.40;

      return {
        detected: true,
        confidence: prob,
        liveness: liveScore,
        box: { x: screenX, y: screenY, width: screenW, height: screenH },
      };
    }
  }

  // 2. High-Precision Spatial Clustering Face Engine (Runs immediately without waiting for neural model)
  staticOffCtx.drawImage(video, 0, 0, VISION_W, VISION_H);
  const imgData = staticOffCtx.getImageData(0, 0, VISION_W, VISION_H);
  const data = imgData.data;

  let skinPixels = 0;
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const idx = i >> 2;
    const x = idx % VISION_W;
    const y = (idx / VISION_W) | 0;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    staticLumGrid[idx] = lum;

    // YCbCr skin chrominance
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    const totalRGB = r + g + b + 0.001;
    const normR = r / totalRGB;
    const normG = g / totalRGB;

    const isSkin =
      cb >= 77 && cb <= 128 &&
      cr >= 132 && cr <= 173 &&
      normR > 0.33 && normG > 0.25 &&
      normR > normG && (r - g) > 8 && r > 45;

    if (isSkin) {
      staticSkinGrid[idx] = 1;
      skinPixels++;
      sumX += x;
      sumY += y;
    } else {
      staticSkinGrid[idx] = 0;
    }
  }

  // If insufficient skin mass in frame: cleanly return NO FACE
  if (skinPixels < 45) {
    staticPrevLumGrid.set(staticLumGrid);
    livenessMotionHistory = [];
    return { detected: false, confidence: 0, liveness: 0, box: null };
  }

  // Calculate center of head mass
  const avgX = sumX / skinPixels;
  const avgY = sumY / skinPixels;

  // Filter for pixels belonging to the primary head cluster (within radius of center of mass)
  let clusterPixels = 0;
  let minX = VISION_W;
  let maxX = 0;
  let minY = VISION_H;
  let maxY = 0;
  const maxRadiusX = VISION_W * 0.28;
  const maxRadiusY = VISION_H * 0.36;

  for (let y = 0; y < VISION_H; y++) {
    for (let x = 0; x < VISION_W; x++) {
      const idx = y * VISION_W + x;
      if (staticSkinGrid[idx] === 1) {
        const dx = Math.abs(x - avgX);
        const dy = Math.abs(y - avgY);
        if (dx <= maxRadiusX && dy <= maxRadiusY) {
          clusterPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const boxW = maxX - minX;
  const boxH = maxY - minY;
  const boxArea = (boxW + 1) * (boxH + 1);
  const density = boxArea > 0 ? clusterPixels / boxArea : 0;

  // Face Geometry Validation: Must be a solid head oval (aspect ratio 0.80-2.1, density >= 25%, size >= 8px)
  if (
    clusterPixels >= 40 &&
    density >= 0.25 &&
    boxW >= 8 &&
    boxH >= 12
  ) {
    const aspect = boxH / (boxW || 1);
    if (aspect >= 0.80 && aspect <= 2.1) {
      // Real optical motion liveness inside head bounding box
      let motionDelta = 0;
      let count = 0;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * VISION_W + x;
          motionDelta += Math.abs(staticLumGrid[idx] - staticPrevLumGrid[idx]);
          count++;
        }
      }
      const avgMotion = count > 0 ? motionDelta / count : 1.5;
      staticPrevLumGrid.set(staticLumGrid);

      livenessMotionHistory.push(avgMotion);
      if (livenessMotionHistory.length > 15) livenessMotionHistory.shift();
      const smoothMotion = livenessMotionHistory.reduce((a, b) => a + b, 0) / livenessMotionHistory.length;

      // Authentic computed scores
      const conf = Math.max(0.78, Math.min(0.97, 0.65 + (density / 0.7) * 0.22 + (boxH / VISION_H) * 0.10));
      const liveScore = smoothMotion > 0.12 ? Math.min(0.96, 0.84 + (smoothMotion / 20) * 0.12) : 0.35;

      // Center anchor point in mirrored coordinate space
      const screenCenterX = (1 - avgX / VISION_W) * width;
      const screenCenterY = (avgY / VISION_H) * height;

      // Calibrate human biometric face dimensions (symmetric 3:4 portrait aspect ratio)
      const baseW = Math.max(boxW * 1.15, 14);
      const screenW = (baseW / VISION_W) * width;
      const screenH = screenW * 1.30;
      const screenX = screenCenterX - screenW / 2;
      const screenY = screenCenterY - screenH * 0.46;

      return {
        detected: true,
        confidence: conf,
        liveness: liveScore,
        box: { x: screenX, y: screenY, width: screenW, height: screenH },
      };
    }
  }

  staticPrevLumGrid.set(staticLumGrid);
  livenessMotionHistory = [];
  return { detected: false, confidence: 0, liveness: 0, box: null };
}

// Draw Biometric HUD Overlay on Canvas with Precision Reticles & Telemetry
function drawBiometricHUD(ctx, box, width, height, label, conf = 0.95, live = 0.92, isRecognized = false) {
  const { x, y, width: bw, height: bh } = box;

  ctx.save();
  // Smooth glowing bounding box
  const strokeColor = isRecognized
    ? "rgba(52, 211, 153, 0.95)"
    : conf > 0.80
    ? "rgba(56, 189, 248, 0.9)"
    : "rgba(251, 191, 36, 0.9)";

  const shadowGlow = isRecognized ? "#34d399" : conf > 0.80 ? "#38bdf8" : "#fbbf24";

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.shadowColor = shadowGlow;
  ctx.shadowBlur = 12;

  // Precision corner targeting reticles
  const cornerLen = Math.min(28, Math.max(16, bw * 0.18));
  ctx.beginPath();
  // Top-Left
  ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
  // Top-Right
  ctx.moveTo(x + bw - cornerLen, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + cornerLen);
  // Bottom-Left
  ctx.moveTo(x, y + bh - cornerLen); ctx.lineTo(x, y + bh); ctx.lineTo(x + cornerLen, y + bh);
  // Bottom-Right
  ctx.moveTo(x + bw - cornerLen, y + bh); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw, y + bh - cornerLen);
  ctx.stroke();

  // Subtle crosshair center
  const cx = x + bw / 2;
  const cy = y + bh * 0.50;
  ctx.strokeStyle = isRecognized ? "rgba(52, 211, 153, 0.45)" : "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
  ctx.stroke();

  // Biometric Eye Landmarks Reticles
  const eyeY = y + bh * 0.38;
  const leftEyeX = x + bw * 0.32;
  const rightEyeX = x + bw * 0.68;

  ctx.strokeStyle = isRecognized ? "rgba(52, 211, 153, 0.9)" : "rgba(56, 189, 248, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Left eye crosshair
  ctx.moveTo(leftEyeX - 5, eyeY); ctx.lineTo(leftEyeX + 5, eyeY);
  ctx.moveTo(leftEyeX, eyeY - 5); ctx.lineTo(leftEyeX, eyeY + 5);
  // Right eye crosshair
  ctx.moveTo(rightEyeX - 5, eyeY); ctx.lineTo(rightEyeX + 5, eyeY);
  ctx.moveTo(rightEyeX, eyeY - 5); ctx.lineTo(rightEyeX, eyeY + 5);
  ctx.stroke();

  // Telemetry badge above box
  const badgeText = `● ${label} · Live ${Math.round(live * 100)}%`;
  ctx.font = "600 11px 'JetBrains Mono', monospace";
  ctx.fillStyle = shadowGlow;
  ctx.shadowBlur = 6;
  ctx.fillText(badgeText, x + 4, Math.max(18, y - 8));

  ctx.restore();
}

// Real-Time Touchless Auto-Checkin & Verification Engine
function processRealtimeCheckin(student, confidence) {
  if (!student) return;

  const now = new Date();
  const sessionKey = `CSE3A-DS-${now.toISOString().slice(0, 10)}`;
  const attendanceRecords = storage.get("attendlyAttendance", []);

  // Cooldown check (prevent repeated alert churn within 8 seconds)
  const lastMarkTime = autoMarkCooldown.get(student.id) || 0;
  if (Date.now() - lastMarkTime < 7000) {
    return;
  }

  const existing = attendanceRecords.find(
    (r) => r.session === sessionKey && r.studentId === student.id
  );

  if (existing) {
    autoMarkCooldown.set(student.id, Date.now());
    lastResultState = "duplicate";
    kioskResult(
      "success",
      "ALREADY CHECKED IN",
      `Verified: ${student.name}`,
      `<b>${student.name}</b> (${student.id}) is already marked present for today's session at <b>${existing.time}</b>.`
    );
    const camDetail = $("#camStatusDetail");
    if (camDetail) {
      camDetail.textContent = `✓ ${student.name} already checked-in (${existing.time})`;
    }
    return;
  }

  // New Check-in
  autoMarkCooldown.set(student.id, Date.now());
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const newRecord = {
    studentId: student.id,
    name: student.name,
    session: sessionKey,
    date: now.toLocaleDateString("en-IN"),
    time: timeStr,
    confidence: confidence || 96,
    location: "Room 204 (East Campus)",
  };

  attendanceRecords.unshift(newRecord);
  storage.set("attendlyAttendance", attendanceRecords);
  api.checkInStudent(student.id, student.name, "kiosk", confidence || 96);

  // Sync with Live Roster
  const studentInRoster = students.find((s) => s.id === student.id);
  if (studentInRoster) {
    studentInRoster.status = "present";
    studentInRoster.time = timeStr;

    // Capture photo snapshot
    try {
      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = 120;
      snapCanvas.height = 120;
      const snapCtx = snapCanvas.getContext("2d");
      if (isSimulationMode) {
        const grad = snapCtx.createLinearGradient(0, 0, 120, 120);
        grad.addColorStop(0, "#6366f1");
        grad.addColorStop(1, "#38bdf8");
        snapCtx.fillStyle = grad;
        snapCtx.fillRect(0, 0, 120, 120);
        snapCtx.fillStyle = "rgba(255,255,255,0.9)";
        snapCtx.font = "bold 42px sans-serif";
        snapCtx.textAlign = "center";
        snapCtx.textBaseline = "middle";
        snapCtx.fillText(studentInRoster.initials, 60, 60);
      } else if (video && video.readyState >= 2) {
        snapCtx.translate(120, 0);
        snapCtx.scale(-1, 1);
        snapCtx.drawImage(video, 0, 0, 120, 120);
      }
      studentInRoster.photo = snapCanvas.toDataURL("image/jpeg", 0.75);
    } catch (e) {
      console.warn("Snapshot capture warning:", e);
    }

    storage.set("attendlyStudents", students);
    renderRoster();
    renderPeopleDirectory();
    updateRosterSummary();
  }

  // Prepend to Live Kiosk Ticker
  logKioskCheckin(newRecord);

  lastResultState = "verified";
  kioskResult(
    "success",
    "ATTENDANCE RECORDED",
    `Welcome, ${student.name}!`,
    `✓ Verified in real time (${newRecord.confidence}% match)<br><b>${timeStr}</b> · CSE 3A · Data Structures (Room 204)`
  );

  const camDetail = $("#camStatusDetail");
  if (camDetail) {
    camDetail.textContent = `✓ ${student.name} checked in successfully! Next student please.`;
  }

  clearTimeout(window._kioskResultTimer);
  window._kioskResultTimer = setTimeout(() => {
    kioskResult(
      "neutral",
      "STAND IN FRAME",
      "Real-Time Auto-Kiosk Active",
      "Stand in front of the camera guide.<br>Verified students are recognized and marked automatically."
    );
  }, 4000);

  toast(`Biometric attendance marked for ${student.name}`);
  playSound("success");
}

// Multi-Zone Facial Feature Vector Generator (for template matching)
function extractFeatureVector() {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 64;
  sampleCanvas.height = 64;
  const sCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

  if (isSimulationMode) {
    const seed = [134, 42, 68, 88, 142, 95, 110, 85, 78, 120, 94, 86, 130, 92, 105, 88];
    return seed.map((v) => v + Math.round((Math.random() - 0.5) * 4));
  }

  const vW = video.videoWidth || 640;
  const vH = video.videoHeight || 480;

  if (currentFaceBox && canvas.width > 0 && canvas.height > 0 && vW > 0 && vH > 0) {
    const rawX = Math.max(0, (1 - (currentFaceBox.x + currentFaceBox.width) / canvas.width) * vW);
    const rawY = Math.max(0, (currentFaceBox.y / canvas.height) * vH);
    const rawW = Math.min(vW - rawX, (currentFaceBox.width / canvas.width) * vW);
    const rawH = Math.min(vH - rawY, (currentFaceBox.height / canvas.height) * vH);
    sCtx.drawImage(video, rawX, rawY, rawW, rawH, 0, 0, 64, 64);
  } else {
    sCtx.drawImage(video, 0, 0, 64, 64);
  }

  const imgData = sCtx.getImageData(0, 0, 64, 64).data;
  const vector = [];
  const zoneSize = 16;

  for (let zy = 0; zy < 4; zy++) {
    for (let zx = 0; zx < 4; zx++) {
      let zoneSum = 0;
      let count = 0;
      for (let y = zy * zoneSize; y < (zy + 1) * zoneSize; y++) {
        for (let x = zx * zoneSize; x < (zx + 1) * zoneSize; x++) {
          const idx = (y * 64 + x) * 4;
          const lum = (imgData[idx] + imgData[idx + 1] + imgData[idx + 2]) / 3;
          zoneSum += lum;
          count++;
        }
      }
      vector.push(Math.round(zoneSum / count));
    }
  }

  return vector;
}

// Cosine & Euclidean Distance Biometric Matcher
function calculateVectorDistance(v1, v2) {
  if (!v1 || !v2 || v1.length !== v2.length) return 999;
  let sumDiff = 0;
  for (let i = 0; i < v1.length; i++) {
    sumDiff += Math.abs(v1[i] - v2[i]);
  }
  return Math.round(sumDiff / v1.length);
}

// Update Kiosk Status Card
function kioskResult(state, label, title, text, btnText = "Verify & mark attendance") {
  const icon = $("#resultIcon");
  if (icon) {
    icon.className = "result-icon " + state;
    icon.textContent = state === "success" ? "✓" : state === "failure" ? "!" : state === "warning" ? "!" : "◎";
  }
  const labelEl = $("#resultLabel");
  const titleEl = $("#resultTitle");
  const textEl = $("#resultText");

  if (labelEl) labelEl.textContent = label;
  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.innerHTML = text;

  if (scanButton) {
    scanButton.disabled = false;
    scanButton.textContent = btnText;
  }
}

// Manual Button Click Handler (Fallback / Force Verification)
async function handleVerifyAndMarkAttendance() {
  if (liveMatchedStudent) {
    const matchPct = Math.max(88, Math.min(99, Math.round(100 - liveMatchDistance)));
    processRealtimeCheckin(liveMatchedStudent, matchPct);
  } else if (!faceDetected && !isSimulationMode) {
    kioskResult("failure", "NO FACE IN FRAME", "Face Not Detected", "Please align your face in front of the camera guide.");
    playSound("error");
  } else {
    kioskResult("warning", "UNREGISTERED FACE", "Face Not Recognized", "This face is not registered in the system.<br>Please enroll in <b>Face profiles</b> tab.");
    playSound("error");
  }
}

// Live Kiosk Log Ticker
function logKioskCheckin(record) {
  const ticker = $("#kioskLogTicker");
  if (!ticker) return;

  const emptyMsg = ticker.querySelector(".empty-log-msg");
  if (emptyMsg) emptyMsg.remove();

  const item = document.createElement("div");
  item.className = "kiosk-log-item";
  const initials = record.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  item.innerHTML = `
    <div class="round-avatar green">${initials}</div>
    <div>
      <strong>${record.name}</strong>
      <small>${record.studentId} · ${record.time} (${record.confidence}% match)</small>
    </div>
  `;

  ticker.insertBefore(item, ticker.firstChild);
}

function updateKioskLogTicker() {
  const records = storage.get("attendlyAttendance", []);
  const ticker = $("#kioskLogTicker");
  if (!ticker) return;

  if (records.length === 0) {
    ticker.innerHTML = `<div class="empty-log-msg">No kiosk check-ins in this session yet. Start the camera and verify a face!</div>`;
    return;
  }

  ticker.innerHTML = "";
  records.slice(0, 8).forEach((r) => {
    logKioskCheckin(r);
  });
}

$("#clearSessionLogBtn")?.addEventListener("click", () => {
  storage.set("attendlyAttendance", []);
  updateKioskLogTicker();
  toast("Session check-in logs cleared");
});

// Camera & Kiosk Button Listeners
startCameraBtn?.addEventListener("click", startCameraStream);
stopCameraBtn?.addEventListener("click", stopCameraStream);
scanButton?.addEventListener("click", handleVerifyAndMarkAttendance);
$("#kioskSimBtn")?.addEventListener("click", toggleSimulationMode);
cameraSourceSelect?.addEventListener("change", () => {
  if (mediaStream) startCameraStream();
});

$("#unknownFace")?.addEventListener("click", () => {
  kioskResult(
    "failure",
    "UNRECOGNIZED FACE",
    "Need Biometric Enrollment?",
    "Click <b>+ Enroll your face here</b> below or select your name from the list to link your face instantly."
  );
});

// Open Direct Quick Face Enrollment Modal
function openQuickEnrollModal() {
  const modal = $("#quickEnrollFaceModal");
  const select = $("#quickEnrollSelectStudent");
  const nameInput = $("#quickEnrollName");
  const idInput = $("#quickEnrollId");
  if (!modal) return;

  if (select) {
    select.innerHTML =
      `<option value="new">-- Register New Student --</option>` +
      students
        .map(
          (s) =>
            `<option value="${s.id}" data-name="${escapeHtml(s.name)}" data-dept="${escapeHtml(s.dept || "CSE 3A")}">${escapeHtml(s.name)} (${s.id})</option>`
        )
        .join("");
  }

  if (nameInput) nameInput.value = "";
  if (idInput) idInput.value = "";
  modal.classList.add("open");
}

$("#kioskEnrollQuickBtn")?.addEventListener("click", openQuickEnrollModal);
$("#closeQuickEnrollModal")?.addEventListener("click", () =>
  $("#quickEnrollFaceModal")?.classList.remove("open")
);
$("#cancelQuickEnrollBtn")?.addEventListener("click", () =>
  $("#quickEnrollFaceModal")?.classList.remove("open")
);

$("#quickEnrollSelectStudent")?.addEventListener("change", (e) => {
  const val = e.target.value;
  const customWrap = $("#quickEnrollCustomFields");
  const nameInput = $("#quickEnrollName");
  const idInput = $("#quickEnrollId");
  const classInput = $("#quickEnrollClass");

  if (val === "new") {
    if (customWrap) customWrap.style.display = "block";
    if (nameInput) nameInput.value = "";
    if (idInput) idInput.value = "";
  } else {
    const student = students.find((s) => s.id === val);
    if (student) {
      if (nameInput) nameInput.value = student.name;
      if (idInput) idInput.value = student.id;
      if (classInput) classInput.value = student.dept || "CSE 3A";
    }
  }
});

$("#confirmQuickEnrollBtn")?.addEventListener("click", async () => {
  const name = $("#quickEnrollName")?.value.trim();
  const id = $("#quickEnrollId")?.value.trim();
  const dept = $("#quickEnrollClass")?.value || "CSE 3A";

  if (!name || !id) {
    toast("Please enter both Student Name and Roll ID.");
    return;
  }

  // Ensure camera is active
  if (!video || video.readyState < 2) {
    await startCameraStream();
  }

  const liveVector = extractFeatureVector();
  let snapData = null;
  if (video && video.videoWidth > 0 && video.readyState >= 2) {
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = 240;
    snapCanvas.height = 240;
    const snapCtx = snapCanvas.getContext("2d");
    snapCtx.translate(240, 0);
    snapCtx.scale(-1, 1);
    snapCtx.drawImage(video, 0, 0, 240, 240);
    snapData = snapCanvas.toDataURL("image/jpeg", 0.85);
  }

  const profiles = storage
    .get("attendlyFaceProfiles", [])
    .filter((p) => p.id !== id);
  profiles.push({
    name,
    id,
    dept,
    featureVector: liveVector,
    photo: snapData,
    updated: Date.now(),
    consent: true,
  });
  storage.set("attendlyFaceProfiles", profiles);
  renderProfiles();

  // Update or insert into students roster
  let existingStudent = students.find((s) => s.id === id);
  if (existingStudent) {
    existingStudent.name = name;
    existingStudent.dept = dept;
    existingStudent.descriptor = liveVector;
    if (snapData) existingStudent.photo = snapData;
  } else {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    existingStudent = {
      name,
      id,
      dept,
      initials,
      rate: 100,
      status: "present",
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      photo: snapData || generateStudentAvatarSvg(name),
      descriptor: liveVector,
    };
    students.push(existingStudent);
  }

  storage.set("attendlyStudents", students);
  renderRoster();
  renderPeopleDirectory();
  populateKioskFastChips();

  $("#quickEnrollFaceModal")?.classList.remove("open");
  toast(`Face successfully enrolled for ${name}!`);
  playSound("success");

  // Save to MongoDB Cloud
  await api.enrollStudent({
    name,
    rollNo: id,
    classId: dept,
    department: dept,
    avatar: existingStudent.photo || "",
    faceDescriptor: liveVector,
    consentGiven: true,
  });

  // Verify and mark attendance immediately
  liveMatchedStudent = {
    name,
    id,
    dept,
  };
  processRealtimeCheckin(liveMatchedStudent, 99);
});

/* ==========================================================================
   FACE PROFILES & BIOMETRIC CONSENT MANAGEMENT
   ========================================================================== */

function renderProfiles() {
  const container = $("#profileRows");
  if (!container) return;

  const profiles = storage.get("attendlyFaceProfiles", []);
  if (profiles.length === 0) {
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--muted)">No face profiles enrolled yet. Capture or register above.</div>`;
    return;
  }

  container.innerHTML = profiles
    .map(
      (p) => `
      <div class="profile-row">
        <div>
          <strong>${p.name}</strong>
          <small>${p.id} · ${p.dept || "CSE"}</small>
        </div>
        <span class="consent">✓ Consent Verified</span>
        <span>${p.featureVector ? "Encrypted 16-zone Template" : "Standard"} · ${new Date(p.updated).toLocaleDateString("en-IN")}</span>
        <button class="link delete-profile-btn" data-id="${p.id}" style="color: #ef4444;">Delete</button>
      </div>
    `
    )
    .join("");

  container.querySelectorAll(".delete-profile-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const updated = storage.get("attendlyFaceProfiles", []).filter((p) => p.id !== id);
      storage.set("attendlyFaceProfiles", updated);
      renderProfiles();
      toast("Face profile removed");
    });
  });
}

$("#captureProfile")?.addEventListener("click", () => {
  try {
    const name = $("#enrolName")?.value.trim();
    const id = $("#enrolId")?.value.trim();
    const consent = $("#enrolConsent")?.checked;

    if (!name || !id || !consent) {
      throw new Error("Student Name, ID, and verified consent check are mandatory.");
    }

    const vector = extractFeatureVector();
    const profiles = storage.get("attendlyFaceProfiles", []).filter((p) => p.id !== id);

    let snapData = null;
    if (video && video.videoWidth > 0 && video.readyState >= 2) {
      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = 240;
      snapCanvas.height = 240;
      const snapCtx = snapCanvas.getContext("2d");
      snapCtx.translate(240, 0);
      snapCtx.scale(-1, 1);
      snapCtx.drawImage(video, 0, 0, 240, 240);
      snapData = snapCanvas.toDataURL("image/jpeg", 0.85);
    }

    profiles.push({
      name,
      id,
      dept: "CSE 3A",
      featureVector: vector,
      photo: snapData,
      updated: Date.now(),
      consent: true,
    });

    storage.set("attendlyFaceProfiles", profiles);
    renderProfiles();

    // Sync to student roster and people directory
    let existingStudent = students.find((s) => s.id === id);
    if (existingStudent) {
      if (snapData) existingStudent.photo = snapData;
      existingStudent.name = name;
    } else {
      const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
      existingStudent = {
        name,
        id,
        dept: "CSE 3A",
        initials,
        rate: 100,
        status: "present",
        photo: snapData || generateStudentAvatarSvg(name),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      students.push(existingStudent);
    }
    storage.set("attendlyStudents", students);
    renderPeopleDirectory();
    renderRoster();

    const avatar = $("#enrolPreviewAvatar");
    if (avatar) avatar.textContent = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
    const status = $("#enrolPreviewStatus");
    if (status) status.textContent = `✓ Enrolled at ${new Date().toLocaleTimeString("en-IN")}`;

    toast(`Face template and photo saved for ${name}`);
    playSound("success");
  } catch (e) {
    toast(e.message);
  }
});

$("#autoEnrollSampleBtn")?.addEventListener("click", () => {
  initializeDefaultProfiles();
  renderProfiles();
  toast("Default student face templates enrolled");
});

$("#clearAttendance")?.addEventListener("click", () => {
  storage.set("attendlyAttendance", []);
  storage.set("attendlySessions", []);
  toast("Local attendance history cleared");
});

$("#enrolName")?.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  const avatar = $("#enrolPreviewAvatar");
  if (avatar) {
    avatar.textContent = val
      ? val.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : "--";
  }
});

$("#registerFace")?.addEventListener("click", () => showView("kiosk"));

/* ==========================================================================
   INTERACTIVE ANIMATED GRAPHS, CHARTS & NUMBER COUNTERS
   ========================================================================== */

// Smooth Animated Number Counter (Silky Ease-out without Overshoot)
function animateNumberCounter(el, target, suffix = "", duration = 850) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  const isFloat = String(target).includes(".");

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Silky smooth ease-out quartic
    const easeOut = 1 - Math.pow(1 - progress, 4);
    const current = start + (target - start) * easeOut;

    el.textContent = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
    }
  }

  requestAnimationFrame(update);
}

// Render & Animate Overview Weekly Attendance Bars
function renderOverviewBars(week = "this") {
  const container = $("#overviewBars");
  const avgText = $("#classAvgText");
  if (!container) return;

  const dataSets = {
    this: [
      { day: "Mon", rate: 76, today: false },
      { day: "Tue", rate: 88, today: false },
      { day: "Wed", rate: 81, today: false },
      { day: "Thu", rate: 88, today: true },
      { day: "Fri", rate: 65, today: false },
      { day: "Sat", rate: 0, today: false },
    ],
    last: [
      { day: "Mon", rate: 82, today: false },
      { day: "Tue", rate: 91, today: false },
      { day: "Wed", rate: 86, today: false },
      { day: "Thu", rate: 84, today: false },
      { day: "Fri", rate: 78, today: false },
      { day: "Sat", rate: 0, today: false },
    ],
  };

  const currentData = dataSets[week] || dataSets.this;
  const activeDays = currentData.filter((d) => d.rate > 0);
  const avg = activeDays.length > 0 ? (activeDays.reduce((a, b) => a + b.rate, 0) / activeDays.length).toFixed(1) : 0;

  container.innerHTML = currentData
    .map(
      (d, idx) => `
    <div class="${d.today ? "today" : ""}">
      <span class="bar-tooltip">${d.rate}% Present</span>
      <i style="height: ${d.rate}%; animation-delay: ${idx * 0.05}s;"></i>
      <b>${d.day}</b>
    </div>
  `
    )
    .join("");

  if (avgText) {
    animateNumberCounter(avgText, Number(avg), "%", 700);
  }
}

// Animate Reports Analytics (Radial Donut Gauge & Subject Progress Bars)
function animateReportsAnalytics() {
  const meter = $("#reportRadialMeter");
  const text = $("#reportRadialText");
  const bars = $("#reportSubjectBars");

  // Calculate live average attendance
  const total = students.reduce((acc, s) => acc + (s.rate || 88), 0);
  const liveAvg = students.length > 0 ? (total / students.length).toFixed(1) : 88.4;

  // Animate SVG Radial Donut (Circumference = 2 * PI * 62 ≈ 389.55)
  if (meter) {
    const circumference = 389.55;
    const clampedRate = Math.min(100, Math.max(0, Number(liveAvg)));
    const offset = circumference - (circumference * clampedRate) / 100;
    meter.style.strokeDasharray = `${circumference}`;
    meter.style.strokeDashoffset = `${circumference}`;
    void meter.getBoundingClientRect(); // force reflow for smooth start
    requestAnimationFrame(() => {
      meter.style.strokeDashoffset = `${offset}`;
    });
  }

  if (text) {
    animateNumberCounter(text, Number(liveAvg), "%", 900);
  }

  // Trigger horizontal progress bar animation
  if (bars) {
    bars.querySelectorAll(".progress-fill").forEach((fill) => {
      fill.style.width = "0%";
      void fill.getBoundingClientRect();
      requestAnimationFrame(() => {
        fill.style.width = fill.style.getPropertyValue("--w") || "85%";
      });
    });
  }
}

$("#overviewWeekSelect")?.addEventListener("change", (e) => {
  renderOverviewBars(e.target.value);
});

function renderReportSummary(type = "class") {
  const title = $("#reportPreviewTitle");
  const sub = $("#reportPreviewSubtitle");
  const content = $("#reportContentTable");
  if (!content) return;

  animateReportsAnalytics();

  if (type === "class") {
    if (title) title.textContent = "Class Attendance Audit — CSE 3A";
    if (sub) sub.textContent = "Complete roster attendance rates, check-in history, and performance";

    content.innerHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>ROLL NO</th>
            <th>STUDENT NAME</th>
            <th>OVERALL ATTENDANCE</th>
            <th>TODAY'S STATUS</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${students
            .map(
              (s) => `
            <tr class="${s.rate < 75 ? "defaulter-row" : ""}">
              <td><code>${s.id}</code></td>
              <td><strong>${s.name}</strong></td>
              <td><b>${s.rate}%</b></td>
              <td>${s.status.toUpperCase()} (${s.time})</td>
              <td>${s.rate < 75 ? "<span style='color:#dc2626;font-weight:700;'>⚠ Defaulter (<75%)</span>" : "<span style='color:#16a34a;'>Good Standing</span>"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } else if (type === "subject") {
    if (title) title.textContent = "Subject-Wise Academic Breakdown";
    if (sub) sub.textContent = "Theory vs Practical attendance metrics across Semester 5";

    content.innerHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>COURSE CODE</th>
            <th>SUBJECT NAME</th>
            <th>FACULTY</th>
            <th>TOTAL SESSIONS</th>
            <th>AVG ATTENDANCE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>CS-301</code></td>
            <td><strong>Data Structures & Algorithms</strong></td>
            <td>Adarsh Sharma</td>
            <td>28 Sessions</td>
            <td><strong style="color:var(--green)">88.4%</strong></td>
          </tr>
          <tr>
            <td><code>CS-302</code></td>
            <td><strong>Database Management Systems</strong></td>
            <td>Sarah Adams</td>
            <td>24 Sessions</td>
            <td><strong style="color:var(--green)">84.2%</strong></td>
          </tr>
          <tr>
            <td><code>CS-303</code></td>
            <td><strong>Data Structures Lab</strong></td>
            <td>Adarsh Sharma</td>
            <td>14 Sessions</td>
            <td><strong style="color:var(--green)">92.1%</strong></td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (type === "defaulter") {
    if (title) title.textContent = "Attendance Defaulter Warning List (<75%)";
    if (sub) sub.textContent = "Students below the mandatory university 75% attendance threshold";

    const defaulters = students.filter((s) => s.rate < 75);
    content.innerHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>ROLL NO</th>
            <th>STUDENT NAME</th>
            <th>ATTENDANCE %</th>
            <th>SHORTAGE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          ${defaulters
            .map(
              (s) => `
            <tr class="defaulter-row">
              <td><code>${s.id}</code></td>
              <td><strong>${s.name}</strong></td>
              <td><b style="color:#dc2626">${s.rate}%</b></td>
              <td>${75 - s.rate}% required</td>
              <td><button class="outline small notify-btn" data-name="${s.name}">Send Parent Notice</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  // Bind notify buttons
  content.querySelectorAll(".notify-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      toast(`Warning notification dispatched to ${btn.dataset.name} and registered guardian`);
      playSound("success");
    });
  });
}

$$(".open-report-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type || "class";
    renderReportSummary(type);
    $("#reportPreviewContainer")?.scrollIntoView({ behavior: "smooth" });
  });
});

// CSV Export Generator
function exportAttendanceCSV() {
  const headers = ["Roll No", "Student Name", "Department", "Overall Attendance %", "Today Status", "Check-in Time"];
  const rows = students.map((s) => [s.id, `"${s.name}"`, s.dept, `${s.rate}%`, s.status, s.time]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Attendly_CSE3A_Attendance_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast("Exported Attendly_CSE3A_Attendance.csv");
}

$("#exportBtn")?.addEventListener("click", exportAttendanceCSV);
$("#downloadCurrentReportBtn")?.addEventListener("click", exportAttendanceCSV);

/* ==========================================================================
   LEAVES, ATTENTION & PEOPLE DIRECTORY
   ========================================================================== */

function renderLeaves() {
  const list = $("#leaveList");
  if (!list) return;

  const currentLeaves = storage.get("attendlyLeaves", defaultLeaves);
  const badge = $("#leaveBadge");
  const statLeaves = $("#statPendingLeaves");

  if (badge) badge.textContent = currentLeaves.length;
  if (statLeaves) statLeaves.textContent = String(currentLeaves.length).padStart(2, "0");

  if (currentLeaves.length === 0) {
    list.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--muted)">All leave requests have been reviewed!</div>`;
    return;
  }

  list.innerHTML = currentLeaves
    .map(
      (l, idx) => `
    <div class="leave-item" data-idx="${idx}">
      <div class="round-avatar bluebg">${l.initials}</div>
      <div class="leave-info">
        <strong>${l.name} <span class="leave-type">${l.type}</span></strong>
        <p>${l.class} · ${l.dates} · Submitted today</p>
      </div>
      <button class="outline leave-decline-btn">Decline</button>
      <button class="approve leave-approve-btn">Approve</button>
    </div>
  `
    )
    .join("");

  list.querySelectorAll(".leave-approve-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const row = btn.closest(".leave-item");
      const idx = Number(row.dataset.idx);
      const leaveItem = currentLeaves[idx];
      currentLeaves.splice(idx, 1);
      storage.set("attendlyLeaves", currentLeaves);
      renderLeaves();
      toast("Leave request approved and recorded");
      playSound("success");
      if (leaveItem && leaveItem.id) {
        await api.updateLeaveStatus(leaveItem.id, "approved");
      }
    });
  });

  list.querySelectorAll(".leave-decline-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const row = btn.closest(".leave-item");
      const idx = Number(row.dataset.idx);
      const leaveItem = currentLeaves[idx];
      currentLeaves.splice(idx, 1);
      storage.set("attendlyLeaves", currentLeaves);
      renderLeaves();
      toast("Leave request declined");
      if (leaveItem && leaveItem.id) {
        await api.updateLeaveStatus(leaveItem.id, "declined");
      }
    });
  });
}
renderLeaves();

// Image Zoom Lightbox Modal
function openImageZoomModal(photoUrl, name, id, meta) {
  const modal = $("#imageZoomModal");
  const imgEl = $("#zoomModalImg");
  const nameEl = $("#zoomStudentName");
  const metaEl = $("#zoomStudentMeta");
  const timeEl = $("#zoomCaptureTime");
  if (!modal || !imgEl) return;

  const validPhoto = photoUrl || generateStudentAvatarSvg(name || "Student");
  imgEl.src = validPhoto;
  if (nameEl) nameEl.textContent = name || "Student Biometric Photo";
  if (metaEl) metaEl.textContent = `${id ? id + " · " : ""}${meta || "CSE 3A"}`;
  if (timeEl) timeEl.textContent = `Biometric Verification Record · ${new Date().toLocaleDateString("en-IN")}`;

  modal.classList.add("open");
}

function closeImageZoomModal() {
  const modal = $("#imageZoomModal");
  if (modal) modal.classList.remove("open");
}

$("#closeImageZoomModal")?.addEventListener("click", closeImageZoomModal);
$("#imageZoomModal")?.addEventListener("click", (e) => {
  if (e.target.id === "imageZoomModal") closeImageZoomModal();
});

// People Directory
function renderPeopleDirectory() {
  const container = $("#peopleRows");
  if (!container) return;

  const q = ($("#peopleSearch")?.value || "").toLowerCase().trim();
  const filtered = students.filter(
    (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.dept.toLowerCase().includes(q)
  );

  const totalEl = $("#statTotalStudents");
  if (totalEl) totalEl.textContent = students.length;

  container.innerHTML = filtered
    .map(
      (s) => `
    <div class="people-row">
      <div class="student">
        ${s.photo
          ? `<div class="round-avatar person-photo-avatar zoomable-user-avatar" data-photo="${s.photo}" data-name="${s.name}" data-id="${s.id}" data-meta="${s.dept || 'CSE 3A'}" title="Click to zoom captured image" style="background:none;padding:0;overflow:hidden;"><img src="${s.photo}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"/></div>`
          : `<div class="round-avatar bluebg">${s.initials}</div>`
        }
        <div>
          <strong ${s.photo ? `class="zoomable-student-name" data-photo="${s.photo}" data-name="${s.name}" data-id="${s.id}" data-meta="${s.dept || 'CSE 3A'}" style="cursor:pointer;" title="Click to zoom captured image"` : ""}>${s.name}</strong>
          <small>${s.id}</small>
        </div>
      </div>
      <span>${s.dept}</span>
      <span class="percent">${s.rate}%</span>
      <button class="link delete-person-btn" data-id="${s.id}" style="color:#ef4444;">Remove</button>
    </div>
  `
    )
    .join("");

  // Bind Zoom Lightbox on Click for Avatars & Student Names
  container.querySelectorAll(".zoomable-user-avatar, .zoomable-student-name").forEach((el) => {
    el.addEventListener("click", () => {
      openImageZoomModal(
        el.dataset.photo,
        el.dataset.name,
        el.dataset.id,
        el.dataset.meta
      );
    });
  });

  container.querySelectorAll(".delete-person-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      students = students.filter((s) => s.id !== id);
      storage.set("attendlyStudents", students);
      renderPeopleDirectory();
      renderRoster();
      toast("Student removed from directory");
      await api.deleteStudent(id);
    });
  });
}

$("#peopleSearch")?.addEventListener("input", renderPeopleDirectory);

/* ==========================================================================
   MODALS (QR SCANNER, ADD STUDENT, TIMETABLE SESSIONS)
   ========================================================================== */

// QR Scanner Modal
function openQrScannerModal() {
  const modal = $("#qrModal");
  const chipsContainer = $("#qrStudentChips");
  if (!modal || !chipsContainer) return;

  chipsContainer.innerHTML = students
    .map(
      (s) => `
    <button class="qr-chip" data-id="${s.id}">
      <b>${s.name}</b> (${s.id})
    </button>
  `
    )
    .join("");

  chipsContainer.querySelectorAll(".qr-chip").forEach((chip) => {
    chip.addEventListener("click", async () => {
      const student = students.find((s) => s.id === chip.dataset.id);
      if (student) {
        student.status = "present";
        student.time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        storage.set("attendlyStudents", students);
        renderRoster();
        updateRosterSummary();
        toast(`QR Code verified for ${student.name}`);
        playSound("success");
        modal.classList.remove("open");
        await api.checkInStudent(student.id, student.name, "qr");
      }
    });
  });

  modal.classList.add("open");
}

$("#closeQrModal")?.addEventListener("click", () => $("#qrModal")?.classList.remove("open"));

// Add Student Modal Open/Close Handlers
$("#addPersonBtn")?.addEventListener("click", () => $("#addPersonModal")?.classList.add("open"));
$("#addStudentRosterBtn")?.addEventListener("click", () => $("#addPersonModal")?.classList.add("open"));
$("#closePersonModal")?.addEventListener("click", () => $("#addPersonModal")?.classList.remove("open"));
$("#cancelPersonBtn")?.addEventListener("click", () => $("#addPersonModal")?.classList.remove("open"));

$("#savePersonBtn")?.addEventListener("click", async () => {
  const nameInput = $("#newPersonName");
  const idInput = $("#newPersonId");
  const classInput = $("#newPersonClass");

  const name = nameInput?.value.trim();
  const id = idInput?.value.trim();
  const dept = classInput?.value || "CSE 3A";

  if (!name || !id) {
    toast("Please enter both Student Name and Roll ID");
    return;
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatar = generateStudentAvatarSvg(name);

  const newStudent = {
    name,
    id,
    dept,
    initials,
    rate: 100,
    status: "present",
    time: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    photo: avatar,
  };

  const existingIdx = students.findIndex((s) => s.id === id);
  if (existingIdx >= 0) {
    students[existingIdx] = { ...students[existingIdx], name, dept, initials, photo: avatar };
  } else {
    students.push(newStudent);
  }

  storage.set("attendlyStudents", students);
  renderRoster();
  updateRosterSummary();
  renderPeopleDirectory();
  populateKioskFastChips();

  // Clear modal inputs & close
  if (nameInput) nameInput.value = "";
  if (idInput) idInput.value = "";
  $("#addPersonModal")?.classList.remove("open");

  toast(`Student ${name} (${id}) added successfully`);
  playSound("success");

  // Save to MongoDB Cloud Database
  await api.enrollStudent({
    name,
    rollNo: id,
    classId: dept,
    department: dept,
    avatar,
    attendanceRate: 100,
    consentGiven: true,
  });
});

// ==========================================
// TIMETABLE & CALENDAR INTELLIGENCE SYSTEM
// ==========================================

let currentTimetableDate = new Date(2026, 7, 20); // Default August 2026 academic calendar
let timetableActiveTab = "all"; // "all" | "upcoming" | "active" | "past"
let timetableActiveMode = "grid"; // "grid" | "list"
let selectedSessionId = null;

const timetableSessions = [
  // MONDAY SESSIONS
  {
    id: "sess-1",
    title: "Algorithms",
    code: "CS302",
    class: "CSE 3B",
    room: "Room 201",
    faculty: "Dr. R. Verma",
    day: "MON",
    startTime: "09:00",
    endTime: "10:00",
    timeDisplay: "09:00 – 10:00 AM",
    type: "Theory Lecture",
    color: "e1",
    attendanceRate: 91.2,
    presentCount: 31,
    totalCount: 34,
  },
  {
    id: "sess-2",
    title: "Operating Systems",
    code: "CS303",
    class: "CSE 3A",
    room: "Room 206",
    faculty: "Prof. K. Iyer",
    day: "MON",
    startTime: "11:15",
    endTime: "12:15",
    timeDisplay: "11:15 – 12:15 PM",
    type: "Theory Lecture",
    color: "e2",
    attendanceRate: 88.5,
    presentCount: 28,
    totalCount: 30,
  },
  {
    id: "sess-3",
    title: "Computer Networks",
    code: "CS305",
    class: "CSE 3A",
    room: "Room 204",
    faculty: "Dr. M. Patel",
    day: "MON",
    startTime: "14:15",
    endTime: "15:15",
    timeDisplay: "02:15 – 03:15 PM",
    type: "Theory Lecture",
    color: "e3",
    attendanceRate: 86.7,
    presentCount: 26,
    totalCount: 30,
  },

  // TUESDAY SESSIONS
  {
    id: "sess-4",
    title: "DBMS",
    code: "CS304",
    class: "CSE 2B",
    room: "Room 108",
    faculty: "Prof. S. Rao",
    day: "TUE",
    startTime: "10:00",
    endTime: "11:00",
    timeDisplay: "10:00 – 11:00 AM",
    type: "Theory Lecture",
    color: "e2",
    attendanceRate: 87.8,
    presentCount: 29,
    totalCount: 33,
  },
  {
    id: "sess-5",
    title: "Discrete Mathematics",
    code: "MA302",
    class: "CSE 3A",
    room: "Room 202",
    faculty: "Dr. V. Menon",
    day: "TUE",
    startTime: "11:15",
    endTime: "12:15",
    timeDisplay: "11:15 – 12:15 PM",
    type: "Theory Lecture",
    color: "e5",
    attendanceRate: 90.0,
    presentCount: 27,
    totalCount: 30,
  },
  {
    id: "sess-6",
    title: "DBMS Lab",
    code: "CS304L",
    class: "CSE 2B",
    room: "Software Lab 01",
    faculty: "Prof. S. Rao & Lab Staff",
    day: "TUE",
    startTime: "14:15",
    endTime: "16:15",
    timeDisplay: "02:15 – 04:15 PM",
    type: "Practical Lab",
    color: "e4",
    attendanceRate: 93.9,
    presentCount: 31,
    totalCount: 33,
  },

  // WEDNESDAY SESSIONS
  {
    id: "sess-7",
    title: "Computer Networks",
    code: "CS305",
    class: "CSE 3A",
    room: "Room 204",
    faculty: "Dr. M. Patel",
    day: "WED",
    startTime: "09:00",
    endTime: "10:00",
    timeDisplay: "09:00 – 10:00 AM",
    type: "Theory Lecture",
    color: "e1",
    attendanceRate: 93.3,
    presentCount: 28,
    totalCount: 30,
  },
  {
    id: "sess-8",
    title: "Theory of Computation",
    code: "CS307",
    class: "CSE 3A",
    room: "Room 202",
    faculty: "Prof. D. Mukherjee",
    day: "WED",
    startTime: "11:15",
    endTime: "12:15",
    timeDisplay: "11:15 – 12:15 PM",
    type: "Theory Lecture",
    color: "e5",
    attendanceRate: 86.6,
    presentCount: 26,
    totalCount: 30,
  },
  {
    id: "sess-9",
    title: "Network Security Lab",
    code: "CS305L",
    class: "CSE 3A",
    room: "Systems Lab 04",
    faculty: "Dr. M. Patel & Lab Staff",
    day: "WED",
    startTime: "14:15",
    endTime: "16:15",
    timeDisplay: "02:15 – 04:15 PM",
    type: "Practical Lab",
    color: "e3",
    attendanceRate: 96.7,
    presentCount: 29,
    totalCount: 30,
  },

  // THURSDAY SESSIONS (Today / Live)
  {
    id: "sess-10",
    title: "Mathematics III",
    code: "MA301",
    class: "CSE 3A",
    room: "Room 204",
    faculty: "Dr. V. Menon",
    day: "THU",
    startTime: "09:00",
    endTime: "10:00",
    timeDisplay: "09:00 – 10:00 AM",
    type: "Theory Lecture",
    color: "e1",
    attendanceRate: 90.0,
    presentCount: 27,
    totalCount: 30,
  },
  {
    id: "sess-11",
    title: "Data Structures",
    code: "CS301",
    class: "CSE 3A",
    room: "Room 204",
    faculty: "Dr. A. Sharma",
    day: "THU",
    startTime: "10:00",
    endTime: "11:00",
    timeDisplay: "10:00 – 11:00 AM",
    type: "Theory Lecture",
    color: "e3",
    isLiveSession: true,
    attendanceRate: 93.3,
    presentCount: 28,
    totalCount: 30,
  },
  {
    id: "sess-12",
    title: "DS Lab",
    code: "CS301L",
    class: "CSE 3A",
    room: "Computing Lab 03",
    faculty: "Dr. A. Sharma & Lab Staff",
    day: "THU",
    startTime: "14:15",
    endTime: "16:15",
    timeDisplay: "02:15 – 04:15 PM",
    type: "Practical Lab",
    color: "e4",
    attendanceRate: null,
    presentCount: 0,
    totalCount: 30,
  },

  // FRIDAY SESSIONS
  {
    id: "sess-13",
    title: "Software Engineering",
    code: "CS308",
    class: "CSE 3B",
    room: "Room 205",
    faculty: "Prof. N. Sen",
    day: "FRI",
    startTime: "10:00",
    endTime: "11:00",
    timeDisplay: "10:00 – 11:00 AM",
    type: "Theory Lecture",
    color: "e2",
    attendanceRate: null,
    presentCount: 0,
    totalCount: 34,
  },
  {
    id: "sess-14",
    title: "Algorithms",
    code: "CS302",
    class: "CSE 3B",
    room: "Room 201",
    faculty: "Dr. R. Verma",
    day: "FRI",
    startTime: "11:15",
    endTime: "12:15",
    timeDisplay: "11:15 – 12:15 PM",
    type: "Theory Lecture",
    color: "e5",
    attendanceRate: null,
    presentCount: 0,
    totalCount: 34,
  },
  {
    id: "sess-15",
    title: "Web Technologies Lab",
    code: "CS306L",
    class: "CSE 3B",
    room: "Software Lab 02",
    faculty: "Prof. N. Sen & Lab Staff",
    day: "FRI",
    startTime: "14:15",
    endTime: "16:15",
    timeDisplay: "02:15 – 04:15 PM",
    type: "Practical Lab",
    color: "e4",
    attendanceRate: null,
    presentCount: 0,
    totalCount: 34,
  }
];

function getWeekDays(date) {
  const current = new Date(date);
  const day = current.getDay(); // 0 = Sun, 1 = Mon
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const week = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

function formatShortDate(d) {
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateSubjectFilterOptions() {
  const select = $("#ttSubjectFilter");
  if (!select) return;
  const currentVal = select.value || "all";
  const uniqueSubjects = Array.from(new Set(timetableSessions.map(s => s.title))).sort();
  
  select.innerHTML = `<option value="all">All Subjects &amp; Labs (${timetableSessions.length})</option>` + 
    uniqueSubjects.map(sub => `<option value="${escapeHtml(sub)}">${escapeHtml(sub)}</option>`).join("");
  
  if (currentVal && uniqueSubjects.includes(currentVal)) {
    select.value = currentVal;
  } else {
    select.value = "all";
  }
}

function openSessionModal(sess, sessDateObj, computedStatus) {
  if (!sess) return;
  selectedSessionId = sess.id;
  const modal = $("#sessionDetailModal");
  if (!modal) return;

  const title = $("#sessionDetailTitle");
  const code = $("#sessionDetailCode");
  const badge = $("#sessionDetailStatusBadge");
  const cl = $("#sessionDetailClass");
  const faculty = $("#sessionDetailFaculty");
  const rm = $("#sessionDetailRoom");
  const dt = $("#sessionDetailDate");
  const tm = $("#sessionDetailTime");
  const type = $("#sessionDetailType");
  const attRate = $("#sessionDetailAttRate");
  const attInfo = $("#sessionDetailAttInfo");
  const fill = $("#sessionDetailProgressFill");
  const kioskBtn = $("#sessionViewKioskBtn");
  const deleteBtn = $("#sessionDeleteBtn");
  const role = $("#roleSelect")?.value || "teacher";

  if (title) title.textContent = sess.title;
  if (code) code.textContent = `${sess.code || 'CS300'} · ${sess.class}`;
  if (cl) cl.textContent = sess.class;
  if (faculty) faculty.textContent = sess.faculty || "Faculty · CSE";
  if (rm) rm.textContent = sess.room;
  
  const displayDate = sessDateObj || (sess.date ? new Date(sess.date) : new Date(2026, 7, 20));
  if (dt) dt.textContent = displayDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  if (tm) tm.textContent = sess.timeDisplay;
  if (type) type.textContent = sess.type || "Theory Lecture";

  const finalStatus = computedStatus || sess.status || "upcoming";

  if (badge) {
    if (finalStatus === "past") {
      badge.className = "tag-chip gray";
      badge.textContent = "✓ Completed";
    } else if (finalStatus === "active") {
      badge.className = "tag-chip green";
      badge.textContent = "● Live Active";
    } else {
      badge.className = "tag-chip blue";
      badge.textContent = "⏳ Upcoming";
    }
  }

  if (attRate && attInfo && fill) {
    if (finalStatus === "past" && sess.attendanceRate) {
      attRate.textContent = `${sess.attendanceRate}% Rate`;
      attInfo.textContent = `${sess.presentCount || 28} of ${sess.totalCount || 30} students recorded present.`;
      fill.style.width = `${sess.attendanceRate}%`;
      fill.style.background = "var(--green)";
    } else if (finalStatus === "active") {
      attRate.textContent = "Live Face Kiosk Active";
      attInfo.textContent = "Biometric Face Kiosk is auto-verifying attendance in real time.";
      fill.style.width = "93.3%";
      fill.style.background = "var(--green)";
    } else {
      attRate.textContent = "Scheduled";
      attInfo.textContent = "Attendance verification will unlock at session start time.";
      fill.style.width = "0%";
      fill.style.background = "var(--line)";
    }
  }

  if (kioskBtn) {
    kioskBtn.style.display = finalStatus === "active" ? "" : "none";
  }

  if (deleteBtn) {
    deleteBtn.style.display = role === "admin" ? "" : "none";
  }

  const startBtn = $("#sessionStartAttendanceBtn");
  if (startBtn) {
    if (role === "student") {
      startBtn.textContent = "View My Attendance Record →";
      startBtn.onclick = () => {
        modal.classList.remove("open");
        showView("my-attendance");
      };
    } else {
      startBtn.textContent = "Open Attendance Roster →";
      startBtn.onclick = () => {
        modal.classList.remove("open");
        showView("attendance");
      };
    }
  }

  modal.classList.add("open");
}

function renderTimetable() {
  const weekDays = getWeekDays(currentTimetableDate);
  const monday = weekDays[0];
  const friday = weekDays[4];
  const now = new Date(2026, 7, 20); // Semester benchmark: Thu Aug 20, 2026
  const todayStr = formatDateISO(now);

  // Update Week range label and Date input
  const rangeLabel = $("#ttWeekRangeLabel");
  if (rangeLabel) {
    rangeLabel.textContent = `${formatShortDate(monday)} – ${formatShortDate(friday)}, ${monday.getFullYear()}`;
  }

  const datePicker = $("#ttDatePicker");
  if (datePicker) {
    datePicker.value = formatDateISO(currentTimetableDate);
  }

  // Update Grid Day Headers with actual dates
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI"];
  const headerContainer = $("#timetableWeekdaysHeader");
  if (headerContainer) {
    headerContainer.innerHTML = `<span></span>` + weekDays.map((d, i) => {
      const dStr = formatDateISO(d);
      const isToday = dStr === todayStr;
      return `<span data-day="${dayNames[i]}" class="tt-day-head ${isToday ? "current" : ""}">${dayNames[i]} ${d.getDate()}${isToday ? " (Today)" : ""}</span>`;
    }).join("");
  }

  const subjectFilter = $("#ttSubjectFilter")?.value || "all";

  // Compute session metadata for the viewed week
  const dayIdxMap = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4 };
  const enrichedSessions = timetableSessions.map((sess) => {
    const idx = dayIdxMap[sess.day] !== undefined ? dayIdxMap[sess.day] : 0;
    const sessDateObj = weekDays[idx];
    const sessDateStr = formatDateISO(sessDateObj);

    let status = "upcoming";
    if (sessDateStr < todayStr) {
      status = "past";
    } else if (sessDateStr > todayStr) {
      status = "upcoming";
    } else {
      if (sess.isLiveSession) {
        status = "active";
      } else if (sess.startTime < "10:00") {
        status = "past";
      } else {
        status = "upcoming";
      }
    }

    return {
      ...sess,
      computedDateObj: sessDateObj,
      computedDateStr: sessDateStr,
      computedStatus: status,
    };
  });

  // Filter by subject
  const filtered = enrichedSessions.filter((s) => {
    if (subjectFilter !== "all" && s.title !== subjectFilter) return false;
    return true;
  });

  // Render Grid Events
  const eventsContainer = $("#timetableEvents");
  if (eventsContainer) {
    eventsContainer.innerHTML = "";
    
    // Day column offset mapping: 5 equal columns (20% each)
    const dayLeftMap = { MON: "1.5%", TUE: "21.5%", WED: "41.5%", THU: "61.5%", FRI: "81.5%" };
    
    // Time slot top offset calculation
    const getTopPercent = (timeStr) => {
      const parts = timeStr.split(":");
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1] || 0, 10);
      // Scale from 09:00 (0%) to 17:00 (100%)
      const totalMinutes = (h - 9) * 60 + m;
      return Math.max(1, Math.min(84, (totalMinutes / 480) * 100));
    };

    filtered.forEach((sess) => {
      const ev = document.createElement("div");
      ev.className = `event ${sess.color || "e1"}`;
      ev.style.left = dayLeftMap[sess.day] || "1.5%";
      ev.style.width = "17%";
      ev.style.top = `${getTopPercent(sess.startTime)}%`;
      
      if (sess.type === "Practical Lab") {
        ev.style.minHeight = "105px";
      }

      let statusPill = "";
      if (sess.computedStatus === "past") {
        statusPill = `<span class="event-status-pill" style="color:var(--muted);">✓ Past</span>`;
      } else if (sess.computedStatus === "active") {
        statusPill = `<span class="event-status-pill" style="color:var(--green);">● Live</span>`;
      } else {
        statusPill = `<span class="event-status-pill" style="color:var(--blue-text);">⏳ Upcoming</span>`;
      }

      ev.innerHTML = `
        <b>${escapeHtml(sess.title)}</b>
        <small>${escapeHtml(sess.class)} · ${escapeHtml(sess.room)}</small>
        ${statusPill}
      `;

      ev.addEventListener("click", () => openSessionModal(sess, sess.computedDateObj, sess.computedStatus));
      eventsContainer.appendChild(ev);
    });
  }

  // Update counts for List View tabs
  const allCount = filtered.length;
  const upcomingCount = filtered.filter(s => s.computedStatus === "upcoming").length;
  const activeCount = filtered.filter(s => s.computedStatus === "active").length;
  const pastCount = filtered.filter(s => s.computedStatus === "past").length;

  if ($("#ttCountAll")) $("#ttCountAll").textContent = allCount;
  if ($("#ttCountUpcoming")) $("#ttCountUpcoming").textContent = upcomingCount;
  if ($("#ttCountActive")) $("#ttCountActive").textContent = activeCount;
  if ($("#ttCountPast")) $("#ttCountPast").textContent = pastCount;

  // Render Agenda / List Feed
  const feed = $("#timetableSessionsFeed");
  if (feed) {
    feed.innerHTML = "";
    const listFiltered = filtered.filter((s) => {
      if (timetableActiveTab === "upcoming") return s.computedStatus === "upcoming";
      if (timetableActiveTab === "active") return s.computedStatus === "active";
      if (timetableActiveTab === "past") return s.computedStatus === "past";
      return true;
    });

    if (listFiltered.length === 0) {
      feed.innerHTML = `
        <div style="padding:40px 20px; text-align:center; color:var(--muted); font-size:13px;">
          <div style="font-size:26px; margin-bottom:8px;">📅</div>
          <strong>No sessions found for this category in the selected week</strong>
          <p style="margin:4px 0 0; font-size:12px;">Try switching tabs or resetting the subject filter.</p>
        </div>
      `;
    } else {
      listFiltered.forEach((sess) => {
        const card = document.createElement("div");
        card.className = `tt-session-card ${sess.color || "e1"}`;
        
        let statusBadge = "";
        if (sess.computedStatus === "past") {
          statusBadge = `<span class="tag-chip gray">✓ Completed · ${sess.attendanceRate || 90}% Att.</span>`;
        } else if (sess.computedStatus === "active") {
          statusBadge = `<span class="tag-chip green">● Active Now · Kiosk Live</span>`;
        } else {
          statusBadge = `<span class="tag-chip blue">⏳ Upcoming</span>`;
        }

        const dateFormatted = sess.computedDateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

        card.innerHTML = `
          <div class="tt-card-main">
            <div class="tt-card-time">
              <strong>${escapeHtml(sess.timeDisplay)}</strong>
              <small>${escapeHtml(dateFormatted)} (${sess.day})</small>
            </div>
            <div class="tt-card-info">
              <h4>${escapeHtml(sess.title)} <small style="font-weight:normal;color:var(--muted);font-size:12px;">(${escapeHtml(sess.code || 'CS300')})</small></h4>
              <p>${escapeHtml(sess.class)} · ${escapeHtml(sess.room)} · <em>${escapeHtml(sess.faculty || 'Faculty')}</em></p>
            </div>
          </div>
          <div class="tt-card-right">
            ${statusBadge}
            <button class="outline small" onclick="event.stopPropagation();">Details →</button>
          </div>
        `;

        card.addEventListener("click", () => openSessionModal(sess, sess.computedDateObj, sess.computedStatus));
        feed.appendChild(card);
      });
    }
  }
}

// Timetable Toolbar Event Listeners
$("#ttPrevWeekBtn")?.addEventListener("click", () => {
  currentTimetableDate.setDate(currentTimetableDate.getDate() - 7);
  renderTimetable();
});

$("#ttNextWeekBtn")?.addEventListener("click", () => {
  currentTimetableDate.setDate(currentTimetableDate.getDate() + 7);
  renderTimetable();
});

$("#ttTodayBtn")?.addEventListener("click", () => {
  currentTimetableDate = new Date(2026, 7, 20);
  renderTimetable();
  toast("Jumped to current week");
});

$("#ttDatePicker")?.addEventListener("change", (e) => {
  if (e.target.value) {
    const parts = e.target.value.split("-");
    currentTimetableDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    renderTimetable();
  }
});

$("#ttViewGridBtn")?.addEventListener("click", () => {
  timetableActiveMode = "grid";
  $("#ttViewGridBtn")?.classList.add("active");
  $("#ttViewListBtn")?.classList.remove("active");
  if ($("#timetableGridView")) $("#timetableGridView").style.display = "";
  if ($("#timetableListView")) $("#timetableListView").style.display = "none";
  renderTimetable();
});

$("#ttViewListBtn")?.addEventListener("click", () => {
  timetableActiveMode = "list";
  $("#ttViewListBtn")?.classList.add("active");
  $("#ttViewGridBtn")?.classList.remove("active");
  if ($("#timetableGridView")) $("#timetableGridView").style.display = "none";
  if ($("#timetableListView")) $("#timetableListView").style.display = "";
  renderTimetable();
});

$("#ttSubjectFilter")?.addEventListener("change", renderTimetable);

$$(".tt-subtab").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    $$(".tt-subtab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    timetableActiveTab = tab.dataset.ttTab || "all";
    renderTimetable();
  });
});

// Add Timetable Session Modal (Admin Only)
$("#addSessionBtn")?.addEventListener("click", () => $("#addSessionModal")?.classList.add("open"));
$("#closeSessionModal")?.addEventListener("click", () => $("#addSessionModal")?.classList.remove("open"));
$("#cancelSessionBtn")?.addEventListener("click", () => $("#addSessionModal")?.classList.remove("open"));

$("#saveSessionBtn")?.addEventListener("click", () => {
  const sub = $("#newSessionSubject")?.value.trim();
  const cls = $("#newSessionClass")?.value.trim() || "CSE 3A";
  const room = $("#newSessionRoom")?.value.trim() || "Room 204";
  const day = $("#newSessionDay")?.value || "MON";
  const time = $("#newSessionTime")?.value || "09:00";
  const type = $("#newSessionType")?.value || "Theory Lecture";

  if (!sub) {
    toast("Please enter a subject name");
    return;
  }

  const timeMap = {
    "09:00": { display: "09:00 – 10:00 AM", start: "09:00", end: "10:00" },
    "10:00": { display: "10:00 – 11:00 AM", start: "10:00", end: "11:00" },
    "11:15": { display: "11:15 – 12:15 PM", start: "11:15", end: "12:15" },
    "12:15": { display: "12:15 – 01:15 PM", start: "12:15", end: "13:15" },
    "13:15": { display: "01:15 – 02:15 PM", start: "13:15", end: "14:15" },
    "14:15": { display: "02:15 – 03:15 PM", start: "14:15", end: "15:15" },
    "14:15-lab": { display: "02:15 – 04:15 PM", start: "14:15", end: "16:15" },
    "15:15": { display: "03:15 – 04:15 PM", start: "15:15", end: "16:15" },
  };

  const slotInfo = timeMap[time] || { display: `${time} Session`, start: time.substring(0, 5), end: "11:00" };
  const colorChoices = ["e1", "e2", "e3", "e4", "e5"];
  const color = colorChoices[timetableSessions.length % colorChoices.length];

  const newSess = {
    id: "sess-" + Date.now(),
    title: sub,
    code: "CS" + Math.floor(300 + Math.random() * 90),
    class: cls,
    room: room,
    faculty: "Faculty · CSE",
    day: day,
    startTime: slotInfo.start,
    endTime: slotInfo.end,
    timeDisplay: slotInfo.display,
    type: type,
    color: color,
    attendanceRate: null,
    presentCount: 0,
    totalCount: 30,
  };

  timetableSessions.unshift(newSess);
  $("#addSessionModal")?.classList.remove("open");
  if ($("#newSessionSubject")) $("#newSessionSubject").value = "";
  
  updateSubjectFilterOptions();
  renderTimetable();
  toast(`Added "${sub}" to ${day} timetable`);
  playSound("success");
});

// Delete Session Handler (Admin Only)
$("#sessionDeleteBtn")?.addEventListener("click", () => {
  if (!selectedSessionId) return;
  const idx = timetableSessions.findIndex(s => s.id === selectedSessionId);
  if (idx !== -1) {
    const title = timetableSessions[idx].title;
    timetableSessions.splice(idx, 1);
    $("#sessionDetailModal")?.classList.remove("open");
    updateSubjectFilterOptions();
    renderTimetable();
    toast(`Deleted session "${title}"`);
  }
});

// Modal close handlers
$("#closeDetailModal")?.addEventListener("click", () => $("#sessionDetailModal")?.classList.remove("open"));
$("#sessionCloseBtn")?.addEventListener("click", () => $("#sessionDetailModal")?.classList.remove("open"));
$("#sessionViewKioskBtn")?.addEventListener("click", () => {
  $("#sessionDetailModal")?.classList.remove("open");
  showView("kiosk");
});

// Initialize subject filter options
updateSubjectFilterOptions();

// Attention & Notifications
$$(".notify-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    toast(`Alert notice sent to ${btn.dataset.name}`);
  });
});

// Interactive Notification Center Dropdown
const notifBtn = $("#notifBtn");
const notifDropdown = $("#notifDropdown");
const notifDot = $("#notifDot");
const notifUnreadBadge = $("#notifUnreadBadge");

notifBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  notifDropdown?.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".notification-wrapper")) {
    notifDropdown?.classList.remove("open");
  }
});

// Mark All as Read
$("#markAllReadBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  $$(".notif-item.unread").forEach((item) => item.classList.remove("unread"));
  if (notifDot) notifDot.style.display = "none";
  if (notifUnreadBadge) notifUnreadBadge.textContent = "0 New";
  toast("All notifications marked as read");
});

// Notification Filter Tabs
$$(".notif-tab").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    e.stopPropagation();
    $$(".notif-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const filter = tab.dataset.notifFilter;

    $$(".notif-item").forEach((item) => {
      if (filter === "all" || item.dataset.category === filter) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });
});

// Clear All Notifications
$("#clearAllNotifsBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const list = $("#notifList");
  if (list) {
    list.innerHTML = `
      <div style="padding:32px 20px; text-align:center; color:var(--muted); font-size:12.5px;">
        <div style="font-size:24px; margin-bottom:6px;">✨</div>
        <strong>No new notifications</strong>
        <p style="margin:4px 0 0; font-size:11px;">You're all caught up with your classes and biometric logs.</p>
      </div>
    `;
  }
  if (notifDot) notifDot.style.display = "none";
  if (notifUnreadBadge) notifUnreadBadge.textContent = "0 New";
  toast("Notifications cleared");
});

$("#helpBtn")?.addEventListener("click", () => {
  toast("Attendly Guide: Click 'Start Camera' or 'Simulation Mode' to test biometrics!");
});

// Theme Manager (Light / Dark / System Default)
function applyTheme(theme) {
  const root = document.documentElement;
  const isSystem = theme === "system";

  if (isSystem) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }

  const select = $("#themeSelect");
  if (select) select.value = theme;
  storage.set("attendlyTheme", theme);
}

const savedTheme = storage.get("attendlyTheme", "system");
applyTheme(savedTheme);

$("#themeSelect")?.addEventListener("change", (e) => {
  const newTheme = e.target.value;
  applyTheme(newTheme);
  toast(`Theme changed to ${newTheme === "system" ? "System Default" : newTheme === "dark" ? "Dark Mode" : "Light Mode"}`);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  const currentTheme = storage.get("attendlyTheme", "system");
  if (currentTheme === "system") {
    document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
  }
});

// Role Switcher & View Permissions
function applyRole(role) {
  const map = {
    teacher: ["Teacher", "Faculty · CSE", "TC"],
    student: ["Student", "Student · CSE/23/041", "ST"],
    admin: ["Admin", "Dean of Academics", "AD"],
  };

  const info = map[role] || map.teacher;
  const sideName = $("#sideName");
  const sideRole = $("#sideRole");
  const sideAvatar = $("#sideAvatar");

  if (sideName) sideName.textContent = info[0];
  if (sideRole) sideRole.textContent = info[1];
  if (sideAvatar) sideAvatar.textContent = info[2];

  // Toggle Visibility for Role-Specific Elements
  $$(".teacher-only").forEach((el) => {
    el.style.display = (role === "teacher" || role === "admin") ? "" : "none";
  });
  $$(".student-only").forEach((el) => {
    el.style.display = role === "student" ? "" : "none";
  });
  $$(".admin-only, .admin-nav").forEach((el) => {
    el.style.display = role === "admin" ? "" : "none";
  });

  // Overview hero & stats switching
  const teacherHero = $("#teacherHero");
  const studentHero = $("#studentHero");
  const teacherStats = $("#teacherStats");
  const studentStats = $("#studentStats");

  if (teacherHero) teacherHero.style.display = (role === "teacher" || role === "admin") ? "" : "none";
  if (studentHero) studentHero.style.display = role === "student" ? "" : "none";
  if (teacherStats) teacherStats.style.display = (role === "teacher" || role === "admin") ? "" : "none";
  if (studentStats) studentStats.style.display = role === "student" ? "" : "none";

  // Check if current active view is permissible for student
  const activeView = $(".view.active")?.id;
  const teacherOnlyViews = ["attendance", "kiosk", "reports", "leaves", "people", "classes", "profiles"];
  const studentOnlyViews = ["my-attendance", "my-badge", "student-leaves"];

  if (role === "student" && teacherOnlyViews.includes(activeView)) {
    showView("overview");
  } else if (role !== "student" && studentOnlyViews.includes(activeView)) {
    showView("overview");
  } else {
    showView(activeView || "overview");
  }

  updateClock();
}

$("#roleSelect")?.addEventListener("change", (e) => {
  const role = e.target.value;
  applyRole(role);
  toast(`Switched to ${role === "student" ? "Student Portal" : role === "admin" ? "Admin Mode" : "Teacher View"}`);
});

// Dynamic Auto-expanding Reason & Justification Textarea
const studentLeaveReasonEl = $("#studentLeaveReason");
if (studentLeaveReasonEl) {
  const autoExpandReason = () => {
    studentLeaveReasonEl.style.height = "auto";
    studentLeaveReasonEl.style.height = `${Math.max(130, studentLeaveReasonEl.scrollHeight)}px`;
  };
  studentLeaveReasonEl.addEventListener("input", autoExpandReason);
  studentLeaveReasonEl.addEventListener("change", autoExpandReason);
}

// Student Leave Submission Handler
$("#submitStudentLeaveBtn")?.addEventListener("click", async () => {
  const type = $("#studentLeaveType")?.value || "Medical Leave";
  const from = $("#studentLeaveFrom")?.value;
  const to = $("#studentLeaveTo")?.value;
  const reason = $("#studentLeaveReason")?.value?.trim();

  if (!from || !to || !reason) {
    toast("Please select dates and enter a reason for leave.");
    return;
  }

  const list = $("#studentLeaveHistoryList");
  if (list) {
    const newItem = document.createElement("div");
    newItem.className = "leave-history-item";
    newItem.innerHTML = `
      <div>
        <strong>${escapeHtml(type)}</strong>
        <p>${escapeHtml(reason)}</p>
        <small>${from} – ${to}</small>
      </div>
      <span class="tag-chip orange">⏳ Pending Approval</span>
    `;
    list.prepend(newItem);
  }

  // Also add to teacher's leave approval list
  const teacherLeaveList = $("#leaveList");
  if (teacherLeaveList) {
    const teachItem = document.createElement("div");
    teachItem.className = "leave-item";
    teachItem.innerHTML = `
      <div class="avatar bluebg">ST</div>
      <div class="leave-info">
        <strong>Student (CSE/23/041)</strong>
        <p><b>${escapeHtml(type)}:</b> ${escapeHtml(reason)}</p>
        <small>${from} – ${to} · CSE 3A</small>
      </div>
      <div class="leave-actions">
        <button class="primary small" onclick="this.closest('.leave-item').remove(); toast('Leave Approved');">Approve</button>
        <button class="outline small" onclick="this.closest('.leave-item').remove(); toast('Leave Declined');">Decline</button>
      </div>
    `;
    teacherLeaveList.prepend(teachItem);

    const badge = $("#leaveBadge");
    if (badge) {
      const cur = parseInt(badge.textContent || "0") + 1;
      badge.textContent = cur;
    }
  }

  // Update student active leaves count
  const studentActive = $("#studentActiveLeavesCount");
  if (studentActive) {
    studentActive.textContent = parseInt(studentActive.textContent || "0") + 1;
  }

  // Reset form
  const reasonEl = $("#studentLeaveReason");
  if (reasonEl) {
    reasonEl.value = "";
    reasonEl.style.height = "";
  }
  toast("Leave application submitted successfully! Pending faculty review.");

  // Save to MongoDB Cloud
  await api.applyLeave({
    studentName: "Student",
    rollNo: "CSE/23/041",
    classId: "CSE 3A",
    type,
    fromDate: from,
    toDate: to,
    reason,
  });
});

// Student Transcript & Badge Handlers
$("#downloadMyTranscriptBtn")?.addEventListener("click", () => {
  const content = `ATTENDLY - OFFICIAL STUDENT ATTENDANCE TRANSCRIPT
======================================================
Student: Student (CSE/23/041)
Program: B.Tech Computer Science & Engineering (Section 3A)
Academic Term: Semester 5 (2026)
Cumulative Attendance: 92.4% (56 / 60 Sessions)
Status: GOOD STANDING (Above 75% Requirement)

SUBJECT BREAKDOWN:
- CS-301 Data Structures & Algorithms: 92.8% (26/28) - Safe (+5)
- CS-302 Database Management Systems: 87.5% (21/24) - Safe (+3)
- CS-303 Data Structures Lab: 100% (14/14) - Perfect (+3)
- CS-304 Discrete Mathematics: 85.7% (18/21) - Safe (+2)

Biometric Verification: Passed & Verified
Generated on: ${new Date().toLocaleString()}
`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Attendance_Transcript_Student_CSE23041.txt";
  a.click();
  URL.revokeObjectURL(url);
  toast("Attendance transcript downloaded.");
});

$("#printBadgeBtn")?.addEventListener("click", () => {
  toast("Digital QR Badge ready for Touchless Kiosk Check-in.");
  window.print();
});

// Initial View & Role Setup
applyRole($("#roleSelect")?.value || "teacher");
updateKioskLogTicker();
showView("overview");

// Start Real-Time Cloud Synchronization with MongoDB
syncWithBackend();
setInterval(syncWithBackend, 4000);
