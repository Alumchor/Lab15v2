import { db } from "./db";

// ฟังก์ชันดึงตารางเรียนตาม user_id
export async function getSchedules(userId: number) {
  try {
    const [rows]: any = await (db as any).query(
      "SELECT * FROM schedules WHERE user_id = ?",
      [userId],
    );
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ฟังก์ชันเพิ่มตารางเรียนใหม่
export async function addSchedule(data: {
  user_id: number;
  subject_name: string;
  room: string;
  day_of_week: string;
  time_slot: string;
}) {
  const { user_id, subject_name, room, day_of_week, time_slot } = data;
  try {
    await (db as any).query(
      "INSERT INTO schedules (user_id, subject_name, room, day_of_week, time_slot) VALUES (?, ?, ?, ?, ?)",
      [user_id, subject_name, room, day_of_week, time_slot],
    );
    return { success: true, message: "เพิ่มตารางเรียนสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
