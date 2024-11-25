document.getElementById('registerButton').addEventListener('click', async (event) => {
    event.preventDefault(); // หยุดการส่งฟอร์มโดยตรง
    console.log("Register button clicked!"); // Debugging

    const username = document.getElementById('username').value;
    const password = document.querySelector('input[name="password"]').value;
    const errorDisplay = document.getElementById('errorDisplay');

    if (!username) {
        errorDisplay.textContent = "กรุณากรอกชื่อผู้ใช้งาน";
        return;
    }

    try {
        const response = await fetch('/regisDB', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        console.log("Response status:", response.status); // Debugging

        if (response.status === 400) {
            const result = await response.json();
            console.log("Error response:", result); // Debugging
            errorDisplay.textContent = result.error;
        } else if (response.status === 200) {
            window.location.href = '/login.html';
        } else {
            errorDisplay.textContent = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
        }
    } catch (error) {
        console.error("Error during registration:", error);
        errorDisplay.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์";
    }
});

