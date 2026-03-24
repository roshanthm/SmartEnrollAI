import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const db = new Database("academia.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    major TEXT DEFAULT 'Undeclared',
    credits_completed INTEGER DEFAULT 0,
    gpa REAL DEFAULT 4.0
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    credits INTEGER NOT NULL,
    instructor TEXT NOT NULL,
    max_seats INTEGER NOT NULL,
    enrolled_count INTEGER DEFAULT 0,
    description TEXT,
    faculty TEXT
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'enrolled', -- 'enrolled' or 'waitlisted'
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(student_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prerequisites (
    course_id INTEGER NOT NULL,
    prerequisite_id INTEGER NOT NULL,
    PRIMARY KEY (course_id, prerequisite_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES courses(id) ON DELETE CASCADE
  );
`);

// Seed Sample Data
const seedData = () => {
  const courseCount = db.prepare("SELECT COUNT(*) as count FROM courses").get() as { count: number };
  if (courseCount.count === 0) {
    console.log("Seeding sample data...");
    
    // Insert Courses
    const insertCourse = db.prepare(`
      INSERT INTO courses (name, code, credits, instructor, max_seats, description, faculty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertCourse.run("Introduction to Computer Science", "CS101", 4, "Dr. Smith", 120, "Fundamental concepts of programming.", "Computer Science");
    insertCourse.run("Data Structures & Algorithms", "CS202", 4, "Dr. Johnson", 80, "Advanced study of data structures.", "Computer Science");
    insertCourse.run("Linear Algebra", "MATH301", 3, "Dr. Lee", 60, "Vector spaces and matrices.", "Mathematics");
    insertCourse.run("General Physics I", "PHYS101", 4, "Dr. Brown", 100, "Mechanics and heat.", "Physics");
    insertCourse.run("Principles of Management", "BUS101", 3, "Dr. Garcia", 150, "Management theory and practice.", "Business");
    insertCourse.run("Database Systems", "CS303", 4, "Dr. Martinez", 2, "Design and implementation of databases.", "Computer Science");
    insertCourse.run("Artificial Intelligence", "CS404", 4, "Dr. Wilson", 40, "Introduction to machine learning and AI.", "Computer Science");
    insertCourse.run("Organic Chemistry", "CHEM201", 4, "Dr. Adams", 50, "Study of carbon-based compounds.", "Science");
    insertCourse.run("Modern Art History", "ART105", 3, "Dr. Clark", 30, "Survey of art from the 19th century to today.", "Arts");
    insertCourse.run("Microeconomics", "ECON101", 3, "Dr. Taylor", 120, "Study of individual economic units.", "Business");

    // Prerequisites: CS202 requires CS101
    const cs101 = db.prepare("SELECT id FROM courses WHERE code = 'CS101'").get() as { id: number };
    const cs202 = db.prepare("SELECT id FROM courses WHERE code = 'CS202'").get() as { id: number };
    db.prepare("INSERT INTO prerequisites (course_id, prerequisite_id) VALUES (?, ?)").run(cs202.id, cs101.id);

    // Insert Students
    const insertStudent = db.prepare("INSERT INTO students (uid, name, email, major) VALUES (?, ?, ?, ?)");
    insertStudent.run("demo-student-1", "Alice Johnson", "alice@example.com", "Computer Science");
    insertStudent.run("demo-student-2", "Bob Smith", "bob@example.com", "Mathematics");
    
    console.log("Sample data seeded.");
  }
};
seedData();

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Course Management
app.get("/api/courses", (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, 
             (SELECT GROUP_CONCAT(p.code) 
              FROM prerequisites pr 
              JOIN courses p ON pr.prerequisite_id = p.id 
              WHERE pr.course_id = c.id) as prerequisites,
             (SELECT GROUP_CONCAT(p.id) 
              FROM prerequisites pr 
              JOIN courses p ON pr.prerequisite_id = p.id 
              WHERE pr.course_id = c.id) as prerequisiteIds,
             (SELECT COUNT(*) 
              FROM registrations r 
              WHERE r.course_id = c.id AND r.status = 'waitlisted') as waitlist_count
      FROM courses c
    `).all();
    
    // Convert prerequisites string to array
    const formattedCourses = courses.map((c: any) => ({
      ...c,
      prerequisites: c.prerequisites ? c.prerequisites.split(",") : [],
      prerequisiteIds: c.prerequisiteIds ? c.prerequisiteIds.split(",").map((id: string) => id.toString()) : []
    }));
    
    res.json(formattedCourses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

app.post("/api/courses", (req, res) => {
  const { name, code, credits, instructor, max_seats, description, faculty, prerequisiteIds } = req.body;
  try {
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO courses (name, code, credits, instructor, max_seats, description, faculty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, code, credits, instructor, max_seats, description, faculty);
      
      const courseId = result.lastInsertRowid;

      if (prerequisiteIds && Array.isArray(prerequisiteIds)) {
        const insertPrereq = db.prepare("INSERT INTO prerequisites (course_id, prerequisite_id) VALUES (?, ?)");
        for (const prereqId of prerequisiteIds) {
          insertPrereq.run(courseId, prereqId);
        }
      }
      return courseId;
    });

    const id = transaction();
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to add course. Code might be duplicate." });
  }
});

app.put("/api/courses/:id", (req, res) => {
  const { id } = req.params;
  const { name, code, credits, instructor, max_seats, description, faculty, prerequisiteIds } = req.body;
  try {
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE courses 
        SET name = ?, code = ?, credits = ?, instructor = ?, max_seats = ?, description = ?, faculty = ?
        WHERE id = ?
      `).run(name, code, credits, instructor, max_seats, description, faculty, id);

      // Update prerequisites
      db.prepare("DELETE FROM prerequisites WHERE course_id = ?").run(id);
      if (prerequisiteIds && Array.isArray(prerequisiteIds)) {
        const insertPrereq = db.prepare("INSERT INTO prerequisites (course_id, prerequisite_id) VALUES (?, ?)");
        for (const prereqId of prerequisiteIds) {
          insertPrereq.run(id, prereqId);
        }
      }
    });
    
    transaction();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update course." });
  }
});

app.delete("/api/courses/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM courses WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete course." });
  }
});

// 2. Student & Registration
app.get("/api/students/:uid", (req, res) => {
  const { uid } = req.params;
  try {
    const student = db.prepare("SELECT * FROM students WHERE uid = ?").get(uid) as any;
    if (!student) return res.status(404).json({ error: "Student not found" });
    
    const enrolledCourses = db.prepare(`
      SELECT c.id, r.status
      FROM registrations r 
      JOIN courses c ON r.course_id = c.id 
      WHERE r.student_id = ?
    `).all(student.id) as any[];
    
    res.json({ 
      ...student, 
      enrolledCourses: enrolledCourses.filter(c => c.status === 'enrolled').map(c => c.id.toString()),
      waitlistedCourses: enrolledCourses.filter(c => c.status === 'waitlisted').map(c => c.id.toString())
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

app.post("/api/students", (req, res) => {
  const { uid, name, email, major } = req.body;
  try {
    db.prepare("INSERT INTO students (uid, name, email, major) VALUES (?, ?, ?, ?)").run(uid, name, email, major);
    const student = db.prepare("SELECT * FROM students WHERE uid = ?").get(uid) as any;
    res.json({ ...student, enrolledCourses: [] });
  } catch (err) {
    // If already exists, return the student with their courses
    const student = db.prepare("SELECT * FROM students WHERE uid = ?").get(uid) as any;
    if (student) {
      const enrolledCourses = db.prepare(`
        SELECT c.id, r.status
        FROM registrations r 
        JOIN courses c ON r.course_id = c.id 
        WHERE r.student_id = ?
      `).all(student.id) as any[];
      res.json({ 
        ...student, 
        enrolledCourses: enrolledCourses.filter(c => c.status === 'enrolled').map(c => c.id.toString()),
        waitlistedCourses: enrolledCourses.filter(c => c.status === 'waitlisted').map(c => c.id.toString())
      });
    } else {
      res.status(500).json({ error: "Failed to create or retrieve student" });
    }
  }
});

app.post("/api/register", (req, res) => {
  const { uid, courseCode } = req.body;
  console.log(`📝 Registration attempt: Student UID: ${uid}, Course Code: ${courseCode}`);
  
  try {
    const student = db.prepare("SELECT id FROM students WHERE uid = ?").get(uid) as { id: number };
    const course = db.prepare("SELECT * FROM courses WHERE code = ?").get(courseCode) as any;
    
    if (!student) {
      console.warn(`❌ Registration failed: Student not found for UID: ${uid}`);
      return res.status(404).json({ error: "Student not found in database" });
    }
    if (!course) {
      console.warn(`❌ Registration failed: Course not found for Code: ${courseCode}`);
      return res.status(404).json({ error: "Course not found in database" });
    }

    // 1. Check duplicate registration
    const existing = db.prepare("SELECT id FROM registrations WHERE student_id = ? AND course_id = ?").get(student.id, course.id);
    if (existing) return res.status(400).json({ error: "Already registered for this course" });

    // 2. Check seat limit & determine status
    let status = 'enrolled';
    if (course.enrolled_count >= course.max_seats) {
      status = 'waitlisted';
    }

    // 3. Check credit limit (max 24) - only for enrolled
    if (status === 'enrolled') {
      const currentCredits = db.prepare(`
        SELECT SUM(c.credits) as total 
        FROM registrations r 
        JOIN courses c ON r.course_id = c.id 
        WHERE r.student_id = ? AND r.status = 'enrolled'
      `).get(student.id) as { total: number };
      
      if ((currentCredits.total || 0) + course.credits > 24) {
        return res.status(400).json({ error: "Credit limit (24) exceeded" });
      }
    }

    // 4. Check prerequisites
    const missingPrereqs = db.prepare(`
      SELECT p.code 
      FROM prerequisites pr 
      JOIN courses p ON pr.prerequisite_id = p.id 
      WHERE pr.course_id = ? 
      AND p.code NOT IN (
        SELECT c.code 
        FROM registrations r 
        JOIN courses c ON r.course_id = c.id 
        WHERE r.student_id = ? AND r.status = 'enrolled'
      )
    `).all(course.id, student.id) as { code: string }[];

    if (missingPrereqs.length > 0) {
      return res.status(400).json({ 
        error: `Missing prerequisites: ${missingPrereqs.map(p => p.code).join(", ")}` 
      });
    }

    // All checks passed, register
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO registrations (student_id, course_id, status) VALUES (?, ?, ?)").run(student.id, course.id, status);
      if (status === 'enrolled') {
        db.prepare("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?").run(course.id);
      }
    });
    transaction();

    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.delete("/api/register", (req, res) => {
  const { uid, courseCode } = req.body;
  try {
    const student = db.prepare("SELECT id FROM students WHERE uid = ?").get(uid) as { id: number };
    const course = db.prepare("SELECT id FROM courses WHERE code = ?").get(courseCode) as { id: number };
    
    if (!student || !course) return res.status(404).json({ error: "Student or Course not found" });

    const transaction = db.transaction(() => {
      const reg = db.prepare("SELECT status FROM registrations WHERE student_id = ? AND course_id = ?").get(student.id, course.id) as { status: string };
      if (!reg) return;

      const result = db.prepare("DELETE FROM registrations WHERE student_id = ? AND course_id = ?").run(student.id, course.id);
      
      if (result.changes > 0 && reg.status === 'enrolled') {
        // Check waitlist
        const nextInLine = db.prepare(`
          SELECT r.id, r.student_id, s.name 
          FROM registrations r 
          JOIN students s ON r.student_id = s.id
          WHERE r.course_id = ? AND r.status = 'waitlisted' 
          ORDER BY r.registration_date ASC 
          LIMIT 1
        `).get(course.id) as { id: number, student_id: number, name: string };

        if (nextInLine) {
          db.prepare("UPDATE registrations SET status = 'enrolled' WHERE id = ?").run(nextInLine.id);
          db.prepare("INSERT INTO notifications (student_id, message) VALUES (?, ?)").run(
            nextInLine.student_id, 
            `You have been enrolled in ${courseCode} from the waitlist!`
          );
        } else {
          db.prepare("UPDATE courses SET enrolled_count = MAX(0, enrolled_count - 1) WHERE id = ?").run(course.id);
        }
      }
    });
    transaction();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to drop course" });
  }
});

// 3. Notifications
app.get("/api/notifications/:uid", (req, res) => {
  const { uid } = req.params;
  try {
    const student = db.prepare("SELECT id FROM students WHERE uid = ?").get(uid) as { id: number };
    if (!student) return res.status(404).json({ error: "Student not found" });

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE student_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(student.id);
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Vite middleware for development
async function startServer() {
  console.log("Starting server in mode:", process.env.NODE_ENV || "development");
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware initialized.");
  } else {
    console.log("Serving production build from dist/");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is live!`);
    console.log(`📡 Internal: http://0.0.0.0:${PORT}`);
    console.log(`🌐 Local:    http://localhost:${PORT}`);
  });
}

startServer();
