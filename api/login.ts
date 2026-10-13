export async function loginUser(username: string, password: string) {
  try {
    const response = await fetch("http://192.168.1.106:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: " + error.message,
    };
  }
}
