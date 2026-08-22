require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");

// Environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/attendly";

let mongoose;
let isMongoConnected = false;
let Student, Attendance, Leave, ClassGroup;

// In-Memory Fallback Cache if MongoDB is offline / provisioning
const inMemoryDB = {
  students: [
    { name: "Aarav Sharma", rollNo: "CSE/23/001", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 94 },
    { name: "Ananya Iyer", rollNo: "CSE/23/002", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 88 },
    { name: "Devansh Patel", rollNo: "CSE/23/003", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 72 },
    { name: "Ishita Rao", rollNo: "CSE/23/004", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 96 },
    { name: "Kabir Mehta", rollNo: "CSE/23/005", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 85 },
    { name: "Meera Nair", rollNo: "CSE/23/006", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 91 },
    { name: "Rohan Verma", rollNo: "CSE/23/007", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 64 },
    { name: "Siddharth Sen", rollNo: "CSE/23/045", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 89 },
    { name: "Student", rollNo: "CSE/23/041", classId: "CSE 3A", department: "CSE", avatar: "", consentGiven: true, attendanceRate: 92.4 }
  ],
  attendance: [],
  leaves: [
    { studentName: "Siddharth Sen", rollNo: "CSE/23/045", classId: "CSE 3A", type: "Medical Leave", fromDate: "2026-08-21", toDate: "2026-08-22", reason: "Viral fever and doctor rest advice", status: "pending", createdAt: new Date() },
    { studentName: "Rohan Verma", rollNo: "CSE/23/007", classId: "CSE 3A", type: "Sports & Athletics", fromDate: "2026-08-24", toDate: "2026-08-25", reason: "Inter-College Basketball Championship", status: "pending", createdAt: new Date() }
  ]
};

// Try initializing Mongoose
try {
  mongoose = require("mongoose");

  // Schema Definitions
  const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNo: { type: String, required: true, unique: true },
    classId: { type: String, default: "CSE 3A" },
    department: { type: String, default: "CSE" },
    avatar: { type: String, default: "" },
    faceDescriptor: { type: [Number], default: [] },
    consentGiven: { type: Boolean, default: true },
    attendanceRate: { type: Number, default: 85 },
    createdAt: { type: Date, default: Date.now }
  });

  const attendanceSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    classId: { type: String, default: "CSE 3A" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ["present", "late", "absent"], default: "present" },
    method: { type: String, enum: ["kiosk", "qr", "manual"], default: "kiosk" },
    confidence: { type: Number, default: 0.95 },
    createdAt: { type: Date, default: Date.now }
  });

  const leaveSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    classId: { type: String, default: "CSE 3A" },
    type: { type: String, required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
  });

  Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
  Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
  Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema);

  // Connect to MongoDB
  mongoose
    .connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 })
    .then(async () => {
      isMongoConnected = true;
      console.log(" MongoDB Connected successfully to Attendly Database!");
      // Pre-seed initial students if empty
      const count = await Student.countDocuments();
      if (count === 0) {
        console.log(" Seeding initial student directory into MongoDB...");
        await Student.insertMany(inMemoryDB.students);
        await Leave.insertMany(inMemoryDB.leaves);
        console.log(" Seed complete: 9 students & 2 initial leaves added.");
      }
    })
    .catch((err) => {
      isMongoConnected = false;
      console.warn(" MongoDB connection warning:", err.message);
      console.log(" Running in In-Memory Local Mode. Connect MongoDB / Railway MONGO_URL anytime.");
    });
} catch (e) {
  console.warn(" Mongoose not found or failed to load. Using In-Memory Server Mode.");
}

// MIME Types for Static Files
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

// Helper: Parse JSON Body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 20 * 1024 * 1024) { // 20MB max
        req.destroy();
        reject(new Error("Request payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
  });
}

// Helper: Send JSON Response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

// Request Handler Function (Compatible with standalone Node.js and Vercel Serverless)
async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS pre-flight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  // =========================================================================
  // API ROUTING
  // =========================================================================

  // 1. Health & Server Status
  if (pathname === "/api/health" && method === "GET") {
    return sendJson(res, 200, {
      status: "online",
      database: isMongoConnected ? "MongoDB Atlas / Railway" : "In-Memory Fallback",
      version: "2.0.0",
      timestamp: new Date().toISOString()
    });
  }

  // 2. Students API
  if (pathname === "/api/students" && method === "GET") {
    try {
      if (isMongoConnected && Student) {
        const students = await Student.find().sort({ rollNo: 1 });
        return sendJson(res, 200, students);
      }
      return sendJson(res, 200, inMemoryDB.students);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (pathname === "/api/students/enroll" && method === "POST") {
    try {
      const body = await parseBody(req);
      const { name, rollNo, classId, avatar, faceDescriptor, consentGiven } = body;
      if (!name || !rollNo) {
        return sendJson(res, 400, { error: "Name and Roll Number are required" });
      }

      if (isMongoConnected && Student) {
        const student = await Student.findOneAndUpdate(
          { rollNo },
          {
            name,
            rollNo,
            classId: classId || "CSE 3A",
            department: classId || "CSE",
            avatar: avatar || "",
            faceDescriptor: faceDescriptor || [],
            consentGiven: consentGiven !== false,
            attendanceRate: 100,
          },
          { upsert: true, new: true }
        );
        return sendJson(res, 200, { success: true, student });
      }

      // In-Memory Update
      const idx = inMemoryDB.students.findIndex((s) => s.rollNo === rollNo);
      const newStudent = { name, rollNo, classId: classId || "CSE 3A", department: classId || "CSE", avatar: avatar || "", faceDescriptor: faceDescriptor || [], consentGiven: consentGiven !== false, attendanceRate: 100 };
      if (idx >= 0) inMemoryDB.students[idx] = newStudent;
      else inMemoryDB.students.push(newStudent);

      return sendJson(res, 200, { success: true, student: newStudent });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (pathname.startsWith("/api/students/") && method === "DELETE") {
    try {
      const rollNo = decodeURIComponent(pathname.replace("/api/students/", ""));
      if (isMongoConnected && Student) {
        await Student.findOneAndDelete({ rollNo });
        return sendJson(res, 200, { success: true, message: "Student removed" });
      }
      inMemoryDB.students = inMemoryDB.students.filter((s) => s.rollNo !== rollNo);
      return sendJson(res, 200, { success: true, message: "Student removed" });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 3. Biometric Check-In (Face Kiosk / QR Verification)
  if (pathname === "/api/attendance/checkin" && method === "POST") {
    try {
      const body = await parseBody(req);
      const { rollNo, studentName, method: checkMethod, confidence } = body;
      if (!rollNo) return sendJson(res, 400, { error: "rollNo is required for check-in" });

      const today = new Date().toISOString().split("T")[0];
      const time = new Date().toLocaleTimeString("en-IN", { hour12: false });

      if (isMongoConnected && Attendance) {
        // Prevent duplicate check-in for the same session date
        const existing = await Attendance.findOne({ rollNo, date: today });
        if (existing) {
          return sendJson(res, 200, { success: true, alreadyCheckedIn: true, record: existing });
        }

        const log = await Attendance.create({
          studentName: studentName || rollNo,
          rollNo,
          classId: "CSE 3A",
          date: today,
          time,
          status: "present",
          method: checkMethod || "kiosk",
          confidence: confidence || 0.96
        });
        return sendJson(res, 200, { success: true, record: log });
      }

      // In-Memory
      const existing = inMemoryDB.attendance.find((a) => a.rollNo === rollNo && a.date === today);
      if (existing) {
        return sendJson(res, 200, { success: true, alreadyCheckedIn: true, record: existing });
      }

      const log = {
        _id: "att_" + Date.now(),
        studentName: studentName || rollNo,
        rollNo,
        classId: "CSE 3A",
        date: today,
        time,
        status: "present",
        method: checkMethod || "kiosk",
        confidence: confidence || 0.96
      };
      inMemoryDB.attendance.push(log);
      return sendJson(res, 200, { success: true, record: log });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 4. Get Today's Roster Logs
  if (pathname === "/api/attendance/today" && method === "GET") {
    try {
      const today = parsedUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];
      if (isMongoConnected && Attendance) {
        const logs = await Attendance.find({ date: today });
        return sendJson(res, 200, logs);
      }
      const logs = inMemoryDB.attendance.filter((a) => a.date === today);
      return sendJson(res, 200, logs);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 5. Batch Save Roster Attendance (Teacher Manual Actions)
  if (pathname === "/api/attendance/batch" && method === "POST") {
    try {
      const body = await parseBody(req);
      const { records, date } = body;
      const today = date || new Date().toISOString().split("T")[0];

      if (!Array.isArray(records)) {
        return sendJson(res, 400, { error: "records must be an array" });
      }

      if (isMongoConnected && Attendance) {
        for (const item of records) {
          await Attendance.findOneAndUpdate(
            { rollNo: item.rollNo, date: today },
            { studentName: item.name, rollNo: item.rollNo, classId: item.classId || "CSE 3A", date: today, time: item.time || new Date().toLocaleTimeString("en-IN", { hour12: false }), status: item.status || "present", method: "manual" },
            { upsert: true, new: true }
          );
        }
        return sendJson(res, 200, { success: true, count: records.length });
      }

      // In-Memory
      records.forEach((item) => {
        const idx = inMemoryDB.attendance.findIndex((a) => a.rollNo === item.rollNo && a.date === today);
        const entry = { _id: "att_" + Date.now() + Math.random(), studentName: item.name, rollNo: item.rollNo, classId: "CSE 3A", date: today, time: item.time || "10:00:00", status: item.status || "present", method: "manual" };
        if (idx >= 0) inMemoryDB.attendance[idx] = entry;
        else inMemoryDB.attendance.push(entry);
      });
      return sendJson(res, 200, { success: true, count: records.length });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 6. Leaves API
  if (pathname === "/api/leaves" && method === "GET") {
    try {
      if (isMongoConnected && Leave) {
        const leaves = await Leave.find({ status: "pending" }).sort({ createdAt: -1 });
        return sendJson(res, 200, leaves);
      }
      const pendingInMemory = (inMemoryDB.leaves || []).filter((l) => l.status === "pending" || !l.status);
      return sendJson(res, 200, pendingInMemory);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (pathname === "/api/leaves/apply" && method === "POST") {
    try {
      const body = await parseBody(req);
      const { studentName, rollNo, type, fromDate, toDate, reason } = body;
      if (!studentName || !reason) {
        return sendJson(res, 400, { error: "Missing required leave parameters" });
      }

      if (isMongoConnected && Leave) {
        const leave = await Leave.create({ studentName, rollNo: rollNo || "CSE/23/041", classId: "CSE 3A", type: type || "Medical Leave", fromDate, toDate, reason, status: "pending" });
        return sendJson(res, 200, { success: true, leave });
      }

      const leave = { _id: "l_" + Date.now(), studentName, rollNo: rollNo || "CSE/23/041", classId: "CSE 3A", type: type || "Medical Leave", fromDate, toDate, reason, status: "pending", createdAt: new Date() };
      inMemoryDB.leaves.unshift(leave);
      return sendJson(res, 200, { success: true, leave });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (pathname.startsWith("/api/leaves/") && pathname.endsWith("/status") && method === "PATCH") {
    try {
      const parts = pathname.split("/");
      const id = parts[3];
      const body = await parseBody(req);
      const { status } = body;

      if (isMongoConnected && Leave) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });
          return sendJson(res, 200, { success: true, leave });
        }
      }

      const idx = (inMemoryDB.leaves || []).findIndex((l) => l._id === id || l.rollNo === id || l.studentName === id);
      if (idx >= 0) inMemoryDB.leaves[idx].status = status;
      return sendJson(res, 200, { success: true, status });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  const cleanPath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const filePath = path.join(__dirname, cleanPath);

  // Security check
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback for SPA routing
      fs.readFile(path.join(__dirname, "index.html"), (spaErr, spaData) => {
        if (spaErr) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          return res.end("Not Found");
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(spaData);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "text/plain",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400"
    });
    res.end(data);
  });
}

// HTTP Server Instance
const server = http.createServer(handleRequest);

// Export for Vercel Serverless Functions
module.exports = handleRequest;

// Start standalone HTTP Server if not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  function startListening(port) {
    server.listen(port, "0.0.0.0", () => {
      console.log(`\n======================================================`);
      console.log(` Attendly Full-Fledged Backend & Kiosk Server Running!`);
      console.log(` Local URL:    http://127.0.0.1:${port}`);
      console.log(` Environment:  ${process.env.NODE_ENV || "development"}`);
      console.log(` MongoDB URI:  ${MONGO_URI.replace(/:[^@]+@/, ":****@")}`);
      console.log(` Ready for Cloud Deployment!`);
      console.log(`======================================================\n`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(` Port ${port} is busy, switching to port ${port + 1}...`);
        startListening(port + 1);
      } else {
        console.error(" Server error:", err);
      }
    });
  }

  startListening(Number(PORT));
}
