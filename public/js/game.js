let score = 0; // คะแนนสะสมปัจจุบันในเกม
let lastSentScore = 0; // คะแนนล่าสุดที่ถูกส่งไปยังเซิร์ฟเวอร์
let username = getCookie('username'); // ชื่อผู้เล่นจากคุกกี้
let updateTimeout; // ตัวจับเวลาเพื่ออัปเดตคะแนน

window.onload = () => {
    loadScore(); // โหลดคะแนนล่าสุดเมื่อหน้าเกมเริ่ม
    loadLeaderboard(); // โหลดข้อมูล Leaderboard
    setInterval(loadLeaderboard, 10000); // โหลด Leaderboard ใหม่ทุก 10 วินาที
};

// ฟังก์ชันดึงคะแนนล่าสุดจากเซิร์ฟเวอร์
async function loadScore() {
    if (!username) {
        alert('Please log in to play!');
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`/getScore?username=${username}`);
        const data = await response.json();

        score = data.currentScore || 0; // ตั้งค่าคะแนนจากเซิร์ฟเวอร์
        lastSentScore = score; // อัปเดตคะแนนล่าสุดในเกม
        document.getElementById('score').textContent = score;
    } catch (error) {
        console.error('Error loading score:', error.message);
    }
}


// ฟังก์ชันเพิ่มคะแนนเมื่อผู้เล่นกด
function popWolf() {
    score++; // เพิ่มคะแนนในตัวแปร
    document.getElementById('score').textContent = score; // อัปเดตใน HTML
    playSound(); // เล่นเสียง
    scheduleScoreUpdate(); // ตั้งเวลาสำหรับอัปเดตคะแนน
}

// ตั้งเวลารอ 2 วินาทีก่อนอัปเดตคะแนน
function scheduleScoreUpdate() {
    if (updateTimeout) clearTimeout(updateTimeout); // ล้างตัวจับเวลาที่ค้างอยู่
    updateTimeout = setTimeout(updateScore, 2000); // ตั้งเวลารอ 2 วินาที
}

// อัปเดตคะแนนสะสมไปยังเซิร์ฟเวอร์
async function updateScore() {
    if (!username) {
        alert('Please log in to save your score!');
        return;
    }

    if (score > lastSentScore) { // ส่งเฉพาะคะแนนที่มากกว่าคะแนนล่าสุดที่บันทึก
        try {
            const response = await fetch('/updateScore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, score }) // ส่งคะแนนสะสมทั้งหมด
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('Error updating score:', data.error);
            } else {
                console.log('Score updated successfully:', data.newScore);
                lastSentScore = score; // อัปเดตคะแนนล่าสุดที่บันทึกในเซิร์ฟเวอร์
            }
        } catch (error) {
            console.error('Network error:', error.message);
        }
    }
}

// เล่นเสียงหมาป่า
function playSound() {
    const audio = new Audio('sounds/wolf.mp3');
    audio.play();
}

// ดึงคุกกี้
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
