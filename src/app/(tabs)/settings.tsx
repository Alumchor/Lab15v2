import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [fullname, setFullname] = useState("");
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(
    "https://via.placeholder.com/150",
  );

  useEffect(() => {
    let userId = 1;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const savedUserId = localStorage.getItem("current_user_id");
      if (savedUserId) {
        userId = parseInt(savedUserId, 10);
      }
    }
    setCurrentUserId(userId);
    fetchUserData(userId);
  }, []);

  const fetchUserData = async (userId: number) => {
    try {
      const response = await fetch(
        `http://192.168.1.106:3000/api/users/${userId}`,
      );
      const currentUser = await response.json();
      if (currentUser && !currentUser.error) {
        setFullname(currentUser.fullname || "");
        setStudentId(currentUser.student_id || "");
        setMajor(currentUser.major || "");
        setUsername(currentUser.username || "");
        setPassword(currentUser.password || "");
        if (currentUser.profile_image) {
          setProfileImage(currentUser.profile_image);
        }
      }
    } catch (error) {
      console.log("Error fetching user:", error);
    }
  };

  // ฟังก์ชันเลือกรูปภาพสำหรับเว็บ (HTML File Input)
  const handlePickImage = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent: any) => {
            setProfileImage(uploadEvent.target.result); // แปลงเป็น Base64 แสดงผลทันที
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // ส่งคำขออัปเดตข้อมูลโดยระบุ user_id เฉพาะตัว
      const response = await fetch(
        `http://192.168.1.106:3000/api/users/${currentUserId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullname,
            student_id: studentId,
            major,
            new_username: username,
            password,
            profile_image: profileImage,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert("บันทึกการแก้ไขข้อมูลและรูปโปรไฟล์สำเร็จ!");
        }
      } else {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert("เกิดข้อผิดพลาด: " + result.message);
        }
      }
    } catch (error: any) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: " + error.message);
      }
    }
  };

  const handleLogout = () => {
    const confirmLogout =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")
        : true;
    if (confirmLogout) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        localStorage.removeItem("current_user_id");
        localStorage.removeItem("current_username");
      }
      router.replace("/");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>ตั้งค่าข้อมูลส่วนตัว</Text>
        <Text style={styles.subtitle}>
          จัดการและแก้ไขข้อมูลโปรไฟล์ของคุณ (เฉพาะบัญชีนี้)
        </Text>

        <View style={styles.profileCard}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={handlePickImage}
          >
            <Ionicons name="camera-outline" size={18} color="#40739e" />
            <Text style={styles.changeImageText}>เปลี่ยนรูปโปรไฟล์</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>ชื่อ - นามสกุล</Text>
          <TextInput
            style={styles.input}
            value={fullname}
            onChangeText={setFullname}
          />

          <Text style={styles.label}>รหัสนักศึกษา</Text>
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            keyboardType="numeric"
          />

          <Text style={styles.label}>สาขาวิชา</Text>
          <TextInput
            style={styles.input}
            value={major}
            onChangeText={setMajor}
          />

          <Text style={styles.label}>ชื่อผู้ใช้ (Username)</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>รหัสผ่าน (Password)</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
          >
            <Text style={styles.saveButtonText}>บันทึกการเปลี่ยนแปลง</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f6fa",
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  contentWrapper: { width: "100%", maxWidth: 800 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#718093", marginBottom: 20 },
  profileCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#dcdde1",
    marginBottom: 12,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f1f2f6",
    borderRadius: 20,
  },
  changeImageText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#40739e",
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f5f6fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcdde1",
    fontSize: 14,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#40739e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  logoutButton: {
    backgroundColor: "#d63031",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  logoutButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
