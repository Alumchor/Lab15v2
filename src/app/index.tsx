import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginUser } from "../../api/login"; // ดึงฟังก์ชัน API ล็อกอินมาใช้

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      if (Platform.OS === "web") {
        window.alert("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      } else {
        Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      }
      return;
    }

    const result = await loginUser(username, password);

    if (result.success) {
      // บันทึกเฉพาะเมื่อรันบนเว็บ หรือเลือกวิธีเก็บข้อมูลที่รองรับมือถือ
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        result.user
      ) {
        localStorage.setItem("current_user_id", result.user.id.toString());
        localStorage.setItem("current_username", result.user.username);
      }

      if (Platform.OS === "web") {
        window.alert(result.message);
      } else {
        Alert.alert("สำเร็จ", result.message);
      }
      router.replace("/(tabs)/home");
    } else {
      if (Platform.OS === "web") {
        window.alert("เข้าสู่ระบบไม่สำเร็จ: " + result.message);
      } else {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", result.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ระบบบันทึกการเรียน</Text>
      <Text style={styles.subtitle}>กรุณาเข้าสู่ระบบเพื่อใช้งาน</Text>

      <TextInput
        style={styles.input}
        placeholder="ชื่อผู้ใช้ (Username)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน (Password)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.linkText}>ยังไม่มีบัญชีใช่ไหม? สมัครสมาชิก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2f3640",
    marginBottom: 5,
  },
  subtitle: { fontSize: 14, color: "#718093", marginBottom: 25 },
  input: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcdde1",
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#40739e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  linkText: { color: "#40739e", fontSize: 14, marginTop: 10 },
});
