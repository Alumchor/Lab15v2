import { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const DAYS = [
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
  "วันอาทิตย์",
];

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];

const CELL_WIDTH = 95;

export default function ScheduleScreen() {
  const [subjectName, setSubjectName] = useState("");
  const [room, setRoom] = useState("");
  const [selectedDay, setSelectedDay] = useState("วันจันทร์");
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("10:30");
  const [schedules, setSchedules] = useState<any[]>([]);

  // ดึง user_id ของผู้ใช้ที่ล็อกอินอยู่จริงจาก localStorage (เฉพาะบนเว็บ)
  const [currentUserId, setCurrentUserId] = useState<number>(1);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const savedUserId = localStorage.getItem("current_user_id");
      if (savedUserId) {
        const id = parseInt(savedUserId, 10);
        setCurrentUserId(id);
        fetchSchedules(id);
        return;
      }
    }
    fetchSchedules(1);
  }, []);

  const fetchSchedules = async (userId: number) => {
    try {
      const response = await fetch(
        `http://192.168.1.106:3000/api/schedules/${userId}`,
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setSchedules(data);
      }
    } catch (error) {
      console.log("Error fetching schedules:", error);
    }
  };

  const handleAddSchedule = async () => {
    if (!subjectName || !room) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert("กรุณากรอกชื่อรายวิชาและห้องเรียน");
      }
      return;
    }

    try {
      const response = await fetch("http://192.168.1.106:3000/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId, // ใช้รหัสของ User ปัจจุบัน
          subject_name: subjectName,
          room: room,
          day_of_week: selectedDay,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const result = await response.json();
      if (result.success) {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert("เพิ่มตารางเรียนสำเร็จ!");
        }
        setSubjectName("");
        setRoom("");
        fetchSchedules(currentUserId);
      } else {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(result.message);
        }
      }
    } catch (error: any) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      }
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    const confirmDelete =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.confirm("คุณต้องการลบรายวิชานี้ใช่หรือไม่?")
        : true;
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://192.168.1.106:3000/api/schedules/${id}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.success) {
        fetchSchedules(currentUserId);
      }
    } catch (error) {
      console.log("Error deleting schedule:", error);
    }
  };

  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const getCellContent = (
    day: string,
    slotStart: string,
    slotEnd: string,
  ): { type: string; schedule?: any; spanCount?: number } => {
    const sStart = timeToMin(slotStart);
    const sEnd = timeToMin(slotEnd);

    const schedule = schedules.find((item) => {
      if (item.day_of_week !== day) return false;
      const itemStart = timeToMin(item.start_time);
      const itemEnd = timeToMin(item.end_time);
      return sStart >= itemStart && sStart < itemEnd;
    });

    if (!schedule) return { type: "empty" };

    const isFirstSlot = schedule.start_time === slotStart;

    if (!isFirstSlot) {
      const itemStart = timeToMin(schedule.start_time);
      const itemEnd = timeToMin(schedule.end_time);
      if (sStart >= itemStart && sStart < itemEnd) {
        return { type: "covered" };
      }
      return { type: "empty" };
    }

    const itemStart = timeToMin(schedule.start_time);
    const itemEnd = timeToMin(schedule.end_time);
    const durationMinutes = itemEnd - itemStart;
    const spanCount = durationMinutes / 30;

    return {
      type: "start",
      schedule,
      spanCount,
    };
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>จัดการตารางเรียน</Text>
      <Text style={styles.subtitle}>
        ระบบตารางเรียน Matrix View จัดเรียงช่องเวลาอย่างแม่นยำ (เฉพาะคุณ)
      </Text>

      {/* ฟอร์มเพิ่มรายวิชา */}
      <View style={styles.formCard}>
        <Text style={styles.formHeader}>➕ เพิ่มรายวิชาลงตารางเรียน</Text>

        <Text style={styles.label}>ชื่อรายวิชา:</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น Mobile App Dev"
          value={subjectName}
          onChangeText={setSubjectName}
        />

        <Text style={styles.label}>ห้องเรียน:</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น Lab 3 หรือ Online"
          value={room}
          onChangeText={setRoom}
        />

        <Text style={styles.label}>เลือกวันเรียน:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipContainer}
        >
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.chip, selectedDay === day && styles.activeChip]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedDay === day && styles.activeChipText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.label}>เวลาเริ่มต้น:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.timeSelector}
            >
              {TIME_SLOTS.slice(0, -1).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.timeChip,
                    startTime === t && styles.activeTimeChip,
                  ]}
                  onPress={() => setStartTime(t)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      startTime === t && styles.activeTimeChipText,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.label}>เวลาสิ้นสุด:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.timeSelector}
            >
              {TIME_SLOTS.slice(1).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.timeChip,
                    endTime === t && styles.activeTimeChip,
                  ]}
                  onPress={() => setEndTime(t)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      endTime === t && styles.activeTimeChipText,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
          <Text style={styles.addButtonText}>บันทึกตารางเรียน</Text>
        </TouchableOpacity>
      </View>

      {/* ตาราง Matrix View ด้านล่าง */}
      <Text style={styles.sectionTitle}>📋 ตารางเรียนรวม (Matrix View)</Text>

      <ScrollView horizontal contentContainerStyle={styles.matrixContainer}>
        <View>
          {/* Header Row */}
          <View style={styles.matrixHeaderRow}>
            <View style={[styles.matrixCell, styles.dayHeaderCell]}>
              <Text style={styles.headerText}>วัน / เวลา</Text>
            </View>
            {TIME_SLOTS.slice(0, -1).map((t, index) => (
              <View
                key={index}
                style={[styles.matrixCell, styles.periodHeaderCell]}
              >
                <Text style={styles.headerText}>
                  {t}-{TIME_SLOTS[index + 1]}
                </Text>
              </View>
            ))}
          </View>

          {/* Body Rows */}
          {DAYS.map((day) => {
            const slots = TIME_SLOTS.slice(0, -1);
            const renderedCells = [];
            let i = 0;

            while (i < slots.length) {
              const slot = slots[i];
              const nextSlot = TIME_SLOTS[i + 1];
              const cell = getCellContent(day, slot, nextSlot);

              if (cell.type === "start") {
                const { schedule, spanCount } = cell;
                const count = spanCount || 1;
                const totalWidth = count * CELL_WIDTH;

                renderedCells.push(
                  <View
                    key={`${day}-${i}`}
                    style={[
                      styles.matrixCell,
                      styles.filledCellStart,
                      { width: totalWidth },
                    ]}
                  >
                    <Text style={styles.filledSubject} numberOfLines={1}>
                      {schedule.subject_name}
                    </Text>
                    <Text style={styles.filledRoom}>ห้อง: {schedule.room}</Text>
                    <Text style={styles.filledTime}>
                      {schedule.start_time}-{schedule.end_time}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Text style={styles.deleteText}>[x ลบ]</Text>
                    </TouchableOpacity>
                  </View>,
                );
                i += count;
              } else {
                renderedCells.push(
                  <View
                    key={`${day}-${i}`}
                    style={[styles.matrixCell, styles.emptyCell]}
                  />,
                );
                i += 1;
              }
            }

            return (
              <View key={day} style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.dayRowCell]}>
                  <Text style={styles.dayRowText}>{day}</Text>
                </View>
                {renderedCells}
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  formCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  formHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f5f6fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcdde1",
    fontSize: 14,
  },
  chipContainer: { flexDirection: "row", marginBottom: 5 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f1f2f6",
    borderRadius: 20,
    marginRight: 8,
  },
  activeChip: { backgroundColor: "#0984e3" },
  chipText: { fontSize: 13, color: "#636e72", fontWeight: "600" },
  activeChipText: { color: "#fff" },
  timeRow: { marginBottom: 5 },
  timeCol: { width: "100%" },
  timeSelector: { flexDirection: "row", paddingVertical: 5 },
  timeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f1f2f6",
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  activeTimeChip: { backgroundColor: "#0984e3", borderColor: "#0984e3" },
  timeChipText: { fontSize: 12, color: "#636e72", fontWeight: "600" },
  activeTimeChipText: { color: "#fff" },
  addButton: {
    backgroundColor: "#27ae60",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 15,
  },
  matrixContainer: { paddingBottom: 30 },
  matrixHeaderRow: { flexDirection: "row" },
  matrixRow: { flexDirection: "row" },
  matrixCell: {
    width: CELL_WIDTH,
    height: 80,
    borderWidth: 1,
    borderColor: "#dfe6e9",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    backgroundColor: "#fff",
  },
  dayHeaderCell: { backgroundColor: "#00cec9", width: 90 },
  periodHeaderCell: { backgroundColor: "#0984e3", width: CELL_WIDTH },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "center",
  },
  dayRowCell: { backgroundColor: "#00b894", width: 90 },
  dayRowText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  emptyCell: { backgroundColor: "#fff" },
  filledCellStart: {
    backgroundColor: "#e8f4f8",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#0984e3",
    borderWidth: 1.5,
    height: 80,
  },
  filledSubject: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0984e3",
    textAlign: "center",
  },
  filledRoom: { fontSize: 10, color: "#636e72", textAlign: "center" },
  filledTime: { fontSize: 10, color: "#2d3436", textAlign: "center" },
  deleteText: {
    fontSize: 10,
    color: "#d63031",
    fontWeight: "bold",
    marginTop: 2,
  },
});
