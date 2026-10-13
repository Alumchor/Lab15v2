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

export default function NotesScreen() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [noteContent, setNoteContent] = useState<string>("");
  const [notesData, setNotesData] = useState<any[]>([]);

  // ดึง user_id ของผู้ใช้ที่ล็อกอินอยู่จริงจาก localStorage (เฉพาะบนเว็บ)
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
      const resSched = await fetch(
        `http://192.168.1.106:3000/api/schedules/${userId}`,
      );
      const schedData = await resSched.json();
      if (Array.isArray(schedData)) {
        const uniqueSubjects = Array.from(
          new Set(schedData.map((s) => s.subject_name)),
        ).map((name) => {
          return schedData.find((s) => s.subject_name === name);
        });
        setSubjects(uniqueSubjects);

        if (uniqueSubjects.length > 0 && !selectedSubject) {
          setSelectedSubject(uniqueSubjects[0].subject_name);
        }
      }

      const resNotes = await fetch(
        `http://192.168.1.106:3000/api/notes/${userId}`,
      );
      const notesResult = await resNotes.json();
      if (Array.isArray(notesResult)) {
        setNotesData(notesResult);
        const currentNote = notesResult.find(
          (n) =>
            n.subject_name ===
            (selectedSubject ||
              (schedData[0] ? schedData[0].subject_name : "")),
        );
        if (currentNote) {
          setNoteContent(currentNote.content || "");
        }
      }
    } catch (error) {
      console.log("Error fetching notes:", error);
    }
  };

  const handleSelectSubject = (subjectName: string) => {
    setSelectedSubject(subjectName);
    const foundNote = notesData.find((n) => n.subject_name === subjectName);
    setNoteContent(foundNote ? foundNote.content : "");
  };

  const handleSaveNote = async () => {
    if (!selectedSubject) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert("กรุณาเลือกรายวิชาก่อนบันทึก");
      }
      return;
    }

    try {
      const response = await fetch("http://192.168.1.106:3000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId, // ใช้รหัสของ User ปัจจุบัน
          subject_name: selectedSubject,
          content: noteContent,
        }),
      });

      const result = await response.json();
      if (result.success) {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert("บันทึกโน้ตสำเร็จ!");
        }
        fetchData(currentUserId);
      } else {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(result.message);
        }
      }
    } catch (error) {
      console.log("Error saving note:", error);
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>บันทึกโน้ตย่อประจำวิชา</Text>
        <Text style={styles.subtitle}>
          เลือกรายวิชาเพื่อจดบันทึกเนื้อหาสำคัญ (อิงจากตารางเรียนของคุณเฉพาะ
          User นี้)
        </Text>

        <Text style={styles.label}>เลือกรายวิชา:</Text>
        {subjects.length === 0 ? (
          <Text style={styles.noSubjectText}>
            ยังไม่มีรายวิชาในตารางเรียน กรุณาเพิ่มวิชาที่หน้า "ตารางเรียน" ก่อน
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
          >
            {subjects.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.chip,
                  selectedSubject === item.subject_name && styles.activeChip,
                ]}
                onPress={() => handleSelectSubject(item.subject_name)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedSubject === item.subject_name &&
                      styles.activeChipText,
                  ]}
                >
                  {item.subject_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {subjects.length > 0 && (
          <View style={styles.noteCard}>
            <Text style={styles.label}>
              เนื้อหาโน้ต / สรุปบทเรียน ({selectedSubject}):
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="พิมพ์เนื้อหาโน้ตที่นี่..."
              multiline={true}
              numberOfLines={10}
              value={noteContent}
              onChangeText={setNoteContent}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveNote}
            >
              <Text style={styles.saveButtonText}>💾 บันทึกโน้ต</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f6fa",
    padding: 20,
    alignItems: "center",
  },
  contentWrapper: { width: "100%", maxWidth: 1000 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#718093", marginBottom: 15 },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 8,
    marginTop: 5,
  },
  noSubjectText: {
    fontSize: 14,
    color: "#718093",
    marginTop: 5,
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 15,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#dcdde1",
    height: 38,
    justifyContent: "center",
  },
  activeChip: { backgroundColor: "#0984e3", borderColor: "#0984e3" },
  chipText: { fontSize: 13, color: "#636e72", fontWeight: "600" },
  activeChipText: { color: "#fff" },
  noteCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginTop: 5,
  },
  textArea: {
    backgroundColor: "#f5f6fa",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcdde1",
    fontSize: 14,
    minHeight: 220,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#27ae60",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
