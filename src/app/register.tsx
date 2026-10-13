import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { registerUser } from "../../api/register";

export default function RegisterScreen() {
  const [studentId, setStudentId] = useState("");
  const [fullname, setFullname] = useState("");
  const [major, setMajor] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!studentId || !fullname || !major || !username || !password) {
      if (typeof window !== "undefined") {
        window.alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      } else {
        Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      }
      return;
    }

    const result = await registerUser({
      username,
      password,
      student_id: studentId,
      fullname,
      major,
    });

    if (result.success) {
      if (typeof window !== "undefined") {
        window.alert("สมัครสมาชิกเรียบร้อยแล้ว");
      }
      router.replace("/");
    } else {
      if (typeof window !== "undefined") {
        window.alert("ผิดพลาด: " + result.message);
      } else {
        Alert.alert("ผิดพลาด", result.message);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>สมัครสมาชิก</Text>
      <Text style={styles.subtitle}>ระบบบันทึกการเรียน</Text>

      <TextInput
        style={styles.input}
        placeholder="รหัสนักศึกษา (เช่น 67042380117)"
        value={studentId}
        onChangeText={setStudentId}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="ชื่อ - นามสกุล"
        value={fullname}
        onChangeText={setFullname}
      />
      <TextInput
        style={styles.input}
        placeholder="สาขาวิชา"
        value={major}
        onChangeText={setMajor}
      />
      <TextInput
        style={styles.input}
        placeholder="ชื่อผู้ใช้งาน (Username)"
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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>ยืนยันการสมัครสมาชิก</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/")}>
        <Text style={styles.linkText}>
          มีบัญชีอยู่แล้ว? กลับไปหน้าเข้าสู่ระบบ
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    backgroundColor: "#273c75",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  linkText: { color: "#40739e", fontSize: 14, marginTop: 10 },
});
