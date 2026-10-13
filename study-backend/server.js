const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อฐานข้อมูล MySQL ใน XAMPP
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "study_db",
});

// ==================== ส่วนจัดการผู้ใช้ (User APIs) ====================

// API สมัครสมาชิก
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, student_id, fullname, major } = req.body;
    await db.query(
      "INSERT INTO users (username, password, student_id, fullname, major) VALUES (?, ?, ?, ?, ?)",
      [username, password, student_id, fullname, major],
    );
    res.json({ success: true, message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API ล็อกอิน
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password],
    );
    if (rows.length > 0) {
      res.json({ success: true, message: "เข้าสู่ระบบสำเร็จ", user: rows[0] });
    } else {
      res.json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API ดึงข้อมูลผู้ใช้ทั้งหมด
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API ดึงข้อมูลผู้ใช้เฉพาะรายบุคคลตาม ID (สำหรับหน้า Home และ Settings)
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({ error: "ไม่พบผู้ใช้งาน" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API อัปเดตข้อมูลผู้ใช้ตาม ID (รองรับการเปลี่ยนรูปโปรไฟล์ profile_image)
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullname,
      student_id,
      major,
      new_username,
      password,
      profile_image,
    } = req.body;

    // ดึง username เดิมมาเช็คหรือใช้ประกอบ (ถ้าจำเป็น) แต่เราอัปเดตด้วย ID ปลอดภัยที่สุด
    await db.query(
      "UPDATE users SET fullname = ?, student_id = ?, major = ?, username = ?, password = ?, profile_image = ? WHERE id = ?",
      [fullname, student_id, major, new_username, password, profile_image, id],
    );

    res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==================== ส่วนจัดการตารางเรียน (Schedule APIs) ====================

// ดึงตารางเรียนเฉพาะของ User นั้นๆ
app.get("/api/schedules/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const [rows] = await db.query("SELECT * FROM schedules WHERE user_id = ?", [
      user_id,
    ]);
    res.json(rows);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// เพิ่มรายวิชาพร้อมตรวจสอบเวลาชนกัน และซิงค์ข้อมูลลง attendance และ notes อัตโนมัติ
app.post("/api/schedules", async (req, res) => {
  try {
    const { user_id, subject_name, room, day_of_week, start_time, end_time } =
      req.body;

    // 1. ตรวจสอบเวลาชนกันในวันเดียวกัน
    const [existing] = await db.query(
      "SELECT * FROM schedules WHERE user_id = ? AND day_of_week = ?",
      [user_id, day_of_week],
    );

    const timeToMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const newStart = timeToMinutes(start_time);
    const newEnd = timeToMinutes(end_time);

    if (newStart >= newEnd) {
      return res.json({
        success: false,
        message: "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด",
      });
    }

    for (let item of existing) {
      const itemStart = timeToMinutes(item.start_time);
      const itemEnd = timeToMinutes(item.end_time);

      const isOverlap = newStart < itemEnd && newEnd > itemStart;
      if (isOverlap) {
        return res.json({
          success: false,
          message: `❌ เวลาชนกัน! ใน ${day_of_week} ช่วงเวลา ${item.start_time}-${item.end_time} มีวิชา "${item.subject_name}" ลงทะเบียนไว้แล้ว`,
        });
      }
    }

    // 2. บันทึกลงตาราง schedules
    await db.query(
      "INSERT INTO schedules (user_id, subject_name, room, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, subject_name, room, day_of_week, start_time, end_time],
    );

    // 3. ซิงค์สร้างแถวในตาราง attendance (ถ้ายังไม่มี)
    const [attCheck] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ? AND subject_name = ?",
      [user_id, subject_name],
    );
    if (attCheck.length === 0) {
      await db.query(
        "INSERT INTO attendance (user_id, subject_name, present_count, late_count, absent_count) VALUES (?, ?, 0, 0, 0)",
        [user_id, subject_name],
      );
    }

    // 4. ซิงค์สร้างแถวในตาราง notes (ถ้ายังไม่มี)
    const [noteCheck] = await db.query(
      "SELECT * FROM notes WHERE user_id = ? AND subject_name = ?",
      [user_id, subject_name],
    );
    if (noteCheck.length === 0) {
      await db.query(
        "INSERT INTO notes (user_id, subject_name, content) VALUES (?, ?, ?)",
        [user_id, subject_name, ""],
      );
    }

    res.json({ success: true, message: "เพิ่มตารางเรียนและซิงค์ข้อมูลสำเร็จ" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ลบรายวิชา (พร้อมลบข้อมูลที่เกี่ยวข้องใน attendance และ notes ออกทั้งหมด)
app.delete("/api/schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. ดึงข้อมูลวิชานี้ก่อนลบ เพื่อเอา user_id และ subject_name ไปลบตารางอื่นต่อ
    const [scheduleRows] = await db.query(
      "SELECT * FROM schedules WHERE id = ?",
      [id],
    );

    if (scheduleRows.length > 0) {
      const { user_id, subject_name } = scheduleRows[0];

      // 2. ลบออกจากตาราง schedules
      await db.query("DELETE FROM schedules WHERE id = ?", [id]);

      // 3. ลบข้อมูลการเช็คชื่อที่ตรงกับวิชานี้ของ user นี้
      await db.query(
        "DELETE FROM attendance WHERE user_id = ? AND subject_name = ?",
        [user_id, subject_name],
      );

      // 4. ลบโน้ตที่ตรงกับวิชานี้ของ user นี้
      await db.query(
        "DELETE FROM notes WHERE user_id = ? AND subject_name = ?",
        [user_id, subject_name],
      );
    }

    res.json({
      success: true,
      message: "ลบรายวิชาและข้อมูลที่เกี่ยวข้องสำเร็จ",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==================== ส่วนจัดการเช็คชื่อ (Attendance APIs) ====================

app.get("/api/attendance/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ?",
      [user_id],
    );
    res.json(rows);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post("/api/attendance/update", async (req, res) => {
  try {
    const { user_id, subject_name, type, action } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ? AND subject_name = ?",
      [user_id, subject_name],
    );

    const delta = action === "add" ? 1 : -1;

    if (rows.length === 0) {
      if (action === "sub")
        return res.json({ success: false, message: "ไม่มีข้อมูลให้ลด" });
      await db.query(
        "INSERT INTO attendance (user_id, subject_name, present_count, late_count, absent_count) VALUES (?, ?, ?, ?, ?)",
        [
          user_id,
          subject_name,
          type === "present" ? 1 : 0,
          type === "late" ? 1 : 0,
          type === "absent" ? 1 : 0,
        ],
      );
    } else {
      let col =
        type === "present"
          ? "present_count"
          : type === "late"
            ? "late_count"
            : "absent_count";
      let currentVal = rows[0][col];
      let newVal = Math.max(0, currentVal + delta);

      await db.query(
        `UPDATE attendance SET ${col} = ? WHERE user_id = ? AND subject_name = ?`,
        [newVal, user_id, subject_name],
      );
    }

    res.json({ success: true, message: "อัปเดตสำเร็จ" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==================== ส่วนจัดการโน้ต (Note APIs) ====================

app.get("/api/notes/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const [rows] = await db.query("SELECT * FROM notes WHERE user_id = ?", [
      user_id,
    ]);
    res.json(rows);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { user_id, subject_name, content } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM notes WHERE user_id = ? AND subject_name = ?",
      [user_id, subject_name],
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE notes SET content = ? WHERE user_id = ? AND subject_name = ?",
        [content, user_id, subject_name],
      );
    } else {
      await db.query(
        "INSERT INTO notes (user_id, subject_name, content) VALUES (?, ?, ?)",
        [user_id, subject_name, content],
      );
    }

    res.json({ success: true, message: "บันทึกโน้ตสำเร็จ" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================================================

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
