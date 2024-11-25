// โหลด Leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch('/leaderboard'); // ดึงข้อมูลจาก API
        const leaderboard = await response.json();
        const leaderboardDiv = document.getElementById('leaderboard');

        leaderboardDiv.innerHTML = ''; // ล้าง HTML เดิม

        leaderboard.forEach((entry, index) => {
            leaderboardDiv.innerHTML += `
                <div class="leaderboard-row">
                    <p><strong>${index + 1}</strong>. ${entry.UserName} - <strong>${entry.Score} pts</strong></p>
                    <button onclick="interact(${entry.ScoreID}, 'Like')">Like 👍 (${entry.likes || 0})</button>
                    <button onclick="interact(${entry.ScoreID}, 'Love')">Love 💖 (${entry.loves || 0})</button>
                    <button onclick="viewAllComments(${entry.ScoreID})">View All Comments 💬 (${entry.comments || 0})</button>
                    <input type="text" id="comment-${entry.ScoreID}" placeholder="Write a comment...">
                    <button onclick="addComment(${entry.ScoreID})">Comment 💬</button>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error.message);
    }
}

// ส่ง Like หรือ Love
async function interact(scoreID, type) {
    try {
        const response = await fetch('/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scoreID, interactType: type })
        });

        if (response.ok) {
            // โหลด Leaderboard ใหม่เพื่ออัปเดตจำนวน Like/Love
            loadLeaderboard();
        } else {
            const errorData = await response.json();
            console.error('Error interacting:', errorData.error);
        }
    } catch (error) {
        console.error('Error interacting:', error.message);
    }
}

// ส่งคอมเมนต์
async function addComment(scoreID) {
    const commentText = document.getElementById(`comment-${scoreID}`).value;
    if (!commentText.trim()) {
        alert('Comment cannot be empty!');
        return;
    }

    try {
        const response = await fetch('/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scoreID, interactType: 'Comment', commentText })
        });
        if (response.ok) {
            alert('Comment added successfully!');
            loadLeaderboard(); // โหลด Leaderboard ใหม่
        }
    } catch (error) {
        console.error('Error adding comment:', error.message);
    }
}

// แสดงคอมเมนต์ทั้งหมด
async function viewAllComments(scoreID) {
    try {
        const response = await fetch(`/getComments?scoreID=${scoreID}`);
        const comments = await response.json();

        // สร้าง HTML สำหรับแสดงคอมเมนต์
        let commentsHTML = `<h3>Comments for ScoreID: ${scoreID}</h3>`;
        if (comments.length === 0) {
            commentsHTML += '<p>No comments yet.</p>';
        } else {
            commentsHTML += '<ul>';
            comments.forEach(comment => {
                commentsHTML += `
                    <li>
                        <strong>${comment.UserName}</strong>: ${comment.CommentText}
                        <br><small>${new Date(comment.InteractDate).toLocaleString()}</small>
                    </li>
                `;
            });
            commentsHTML += '</ul>';
        }

        // แสดงใน Modal หรือ Dialog
        showModal(commentsHTML);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
    }
}

// ฟังก์ชันแสดง Modal หรือ Dialog
function showModal(content) {
    const modal = document.createElement('div');
    modal.id = 'comments-modal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = '#fff';
    modal.style.padding = '20px';
    modal.style.border = '1px solid #ccc';
    modal.style.zIndex = '1000';
    modal.style.maxHeight = '80%';
    modal.style.overflowY = 'auto';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => document.body.removeChild(modal);

    modal.innerHTML = content;
    modal.appendChild(closeButton);

    document.body.appendChild(modal);
}
