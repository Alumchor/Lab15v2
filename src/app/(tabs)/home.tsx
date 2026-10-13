import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  const [user, setUser] = useState({
    fullname: "กำลังโหลด...",
    student_id: "",
    major: "",
    profile_image: "https://via.placeholder.com/150",
  });

  useEffect(() => {
    let userId = 1;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const savedUserId = localStorage.getItem("current_user_id");
      if (savedUserId) {
        userId = parseInt(savedUserId, 10);
      }
    }
    fetchUserData(userId);
  }, []);

  const fetchUserData = async (userId: number) => {
    try {
      // เรียกข้อมูลผู้ใช้ตาม ID ที่กำลังล็อกอินอยู่จริง
      const response = await fetch(
        `http://192.168.1.106:3000/api/users/${userId}`,
      );
      const currentUser = await response.json();

      if (currentUser && !currentUser.error) {
        setUser({
          fullname: currentUser.fullname || "ณัฐพงษ์ แซ่เฮง",
          student_id: currentUser.student_id || "123123",
          major: currentUser.major || "วิทยาการคอม",
          profile_image:
            currentUser.profile_image || "https://via.placeholder.com/150",
        });
        return;
      }
    } catch (error) {
      console.log("Error fetching user:", error);
    }

    // ค่าสำรองกรณีดึงข้อมูลไม่สำเร็จ
    setUser({
      fullname: "ณัฐพงษ์ แซ่เฮง",
      student_id: "123123",
      major: "วิทยาการคอม",
      profile_image: "https://via.placeholder.com/150",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Image
          source={{ uri: user.profile_image }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.nameText}>{user.fullname}</Text>
          <Text style={styles.subText}>รหัสนักศึกษา: {user.student_id}</Text>
          <Text style={styles.subText}>สาขา: {user.major}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>เมนูด่วน</Text>
      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuBox}
          onPress={() => router.push("/(tabs)/schedule")}
        >
          <Ionicons name="calendar-outline" size={32} color="#40739e" />
          <Text style={styles.menuText}>จัดการตารางเรียน</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBox}
          onPress={() => router.push("/(tabs)/attendance")}
        >
          <Ionicons name="checkbox-outline" size={32} color="#40739e" />
          <Text style={styles.menuText}>บันทึกการเข้าเรียน</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBox}
          onPress={() => router.push("/(tabs)/notes")}
        >
          <Ionicons name="book-outline" size={32} color="#40739e" />
          <Text style={styles.menuText}>บันทึกโน้ตย่อ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBox}
          onPress={() => router.push("/(tabs)/settings")}
        >
          <Ionicons name="settings-outline" size={32} color="#40739e" />
          <Text style={styles.menuText}>ตั้งค่าส่วนตัว</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    padding: 20,
    paddingTop: 60,
  },
  headerCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#dcdde1",
    marginRight: 15,
  },
  userInfo: { flex: 1 },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 4,
  },
  subText: { fontSize: 14, color: "#718093", marginBottom: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 15,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuBox: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  menuText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#2f3640",
    textAlign: "center",
  },
});
