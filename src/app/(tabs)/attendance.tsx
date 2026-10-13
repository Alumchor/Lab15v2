import { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CheckScreen() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(1);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const savedUserId = localStorage.getItem("current_user_id");
      if (savedUserId) {
        const id = parseInt(savedUserId, 10);
        setCurrentUserId(id);
        fetchData(id);
        return;
      }
    }
    fetchData(1);
  }, []);

  const fetchData = async (userId: number) => {
    try {
      // 1. ดึงรายวิชาจากตาราง schedules ของ User นี้มาแสดง
      const resSched = await fetch(
        `http://192.168.1.106:3000/api/schedules/${userId}`,
      );
      const schedData = await resSched.json();
      if (Array.isArray(schedData)) {
        // กรองชื่อวิชาไม่ให้ซ้ำกัน
        const uniqueSubjects = Array.from(
          new Set(schedData.map((s) => s.subject_name)),
        ).map((name) => {
          return schedData.find((s) => s.subject_name === name);
        });
        setSubjects(uniqueSubjects);
      }

      // 2. ดึงข้อมูลการเช็คชื่อของ User นี้จากตาราง attendance
      const resAtt = await fetch(
        `http://192.168.1.106:3000/api/attendance/${userId}`,
      );
      const attData = await resAtt.json();
      if (Array.isArray(attData)) {
        setAttendanceData(attData);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const handleUpdateAttendance = async (
    subject_name: string,
    type: string,
    action: "add" | "sub",
  ) => {
    try {
      const response = await fetch(
        "http://192.168.1.106:3000/api/attendance/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUserId,
            subject_name,
            type,
            action,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        fetchData(currentUserId); // โหลดข้อมูลใหม่เพื่ออัปเดตหน้าจอทันที
      }
    } catch (error) {
      console.log("Error updating attendance:", error);
    }
  };

  // คำนวณสรุปผลรวมทั้งหมด
  const totalPresent = attendanceData.reduce(
    (acc, curr) => acc + (curr.present_count || 0),
    0,
  );
  const totalLate = attendanceData.reduce(
    (acc, curr) => acc + (curr.late_count || 0),
    0,
  );
  const totalAbsent = attendanceData.reduce(
    (acc, curr) => acc + (curr.absent_count || 0),
    0,
  );
  const totalAll = totalPresent + totalLate + totalAbsent;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>บันทึกการเข้าเรียน</Text>
      <Text style={styles.subtitle}>
        อิงตามรายวิชาในตารางเรียนของคุณ (สถิติแยกตาม User ปัจจุบัน)
      </Text>

      {/* Dashboard สรุปผลรวม */}
      <View style={styles.cardRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#e67e22" }]}>
          <Text style={styles.summaryNumber}>{totalAll}</Text>
          <Text style={styles.summaryLabel}>ทั้งหมด</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#2ecc71" }]}>
          <Text style={styles.summaryNumber}>{totalPresent}</Text>
          <Text style={styles.summaryLabel}>มาเรียน</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#f1c40f" }]}>
          <Text style={styles.summaryNumber}>{totalLate}</Text>
          <Text style={styles.summaryLabel}>มาสาย</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#e74c3c" }]}>
          <Text style={styles.summaryNumber}>{totalAbsent}</Text>
          <Text style={styles.summaryLabel}>ขาดเรียน</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>📚 รายวิชาของคุณ</Text>

      {subjects.length === 0 ? (
        <Text style={styles.noSubjectText}>
          ยังไม่มีรายวิชาในตารางเรียน กรุณาเพิ่มวิชาที่หน้า "ตารางเรียน" ก่อน
        </Text>
      ) : (
        subjects.map((item, index) => {
          const att = attendanceData.find(
            (a) => a.subject_name === item.subject_name,
          ) || {
            present_count: 0,
            late_count: 0,
            absent_count: 0,
          };

          return (
            <View key={index} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{item.subject_name}</Text>
                <Text style={styles.subjectInfo}>
                  ห้อง: {item.room} | เวลา: {item.start_time}-{item.end_time}
                </Text>
              </View>

              {/* แสดงจำนวนครั้ง */}
              <View style={styles.statsRow}>
                <Text style={styles.statText}>
                  ✅ มา:{" "}
                  <Text style={styles.boldText}>{att.present_count}</Text>
                </Text>
                <Text style={styles.statText}>
                  ⚠️ สาย: <Text style={styles.boldText}>{att.late_count}</Text>
                </Text>
                <Text style={styles.statText}>
                  ❌ ขาด:{" "}
                  <Text style={styles.boldText}>{att.absent_count}</Text>
                </Text>
              </View>

              {/* ปุ่มกดเพิ่ม / ลบ */}
              <View style={styles.buttonGroup}>
                {/* ปุ่ม มาเรียน */}
                <View style={styles.btnWrapper}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#2ecc71" }]}
                    onPress={() =>
                      handleUpdateAttendance(
                        item.subject_name,
                        "present",
                        "add",
                      )
                    }
                  >
                    <Text style={styles.btnText}>+ มาเรียน</Text>
                  </TouchableOpacity>
                  {att.present_count > 0 && (
                    <TouchableOpacity
                      style={styles.subBtn}
                      onPress={() =>
                        handleUpdateAttendance(
                          item.subject_name,
                          "present",
                          "sub",
                        )
                      }
                    >
                      <Text style={styles.subBtnText}>ลบ</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ปุ่ม มาสาย */}
                <View style={styles.btnWrapper}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#f39c12" }]}
                    onPress={() =>
                      handleUpdateAttendance(item.subject_name, "late", "add")
                    }
                  >
                    <Text style={styles.btnText}>+ สาย</Text>
                  </TouchableOpacity>
                  {att.late_count > 0 && (
                    <TouchableOpacity
                      style={styles.subBtn}
                      onPress={() =>
                        handleUpdateAttendance(item.subject_name, "late", "sub")
                      }
                    >
                      <Text style={styles.subBtnText}>ลบ</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ปุ่ม ขาดเรียน */}
                <View style={styles.btnWrapper}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#e74c3c" }]}
                    onPress={() =>
                      handleUpdateAttendance(item.subject_name, "absent", "add")
                    }
                  >
                    <Text style={styles.btnText}>+ ขาด</Text>
                  </TouchableOpacity>
                  {att.absent_count > 0 && (
                    <TouchableOpacity
                      style={styles.subBtn}
                      onPress={() =>
                        handleUpdateAttendance(
                          item.subject_name,
                          "absent",
                          "sub",
                        )
                      }
                    >
                      <Text style={styles.subBtnText}>ลบ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f6fa",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#718093", marginBottom: 20 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryNumber: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  summaryLabel: { fontSize: 12, color: "#fff", marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 15,
  },
  noSubjectText: {
    fontSize: 14,
    color: "#718093",
    textAlign: "center",
    marginTop: 20,
  },
  subjectCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  subjectHeader: { marginBottom: 10 },
  subjectName: { fontSize: 16, fontWeight: "bold", color: "#2f3640" },
  subjectInfo: { fontSize: 12, color: "#718093", marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  statText: { fontSize: 13, color: "#2f3640" },
  boldText: { fontWeight: "bold", color: "#0984e3" },
  buttonGroup: { flexDirection: "row", justifyContent: "space-between" },
  btnWrapper: {
    flex: 1,
    marginHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  subBtn: {
    backgroundColor: "#dfe6e9",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 4,
    alignItems: "center",
  },
  subBtnText: { color: "#2d3436", fontSize: 11, fontWeight: "bold" },
});
