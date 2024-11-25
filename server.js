const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 5000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const cors = require('cors');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Serve login.html as the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Database Connection
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "lonewolfpop"
});

con.connect(err => {
    if (err) throw (err);
    else {
        console.log("MySQL connected");
    }
});

// Helper for executing queries
const queryDB = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, result) => { // เปลี่ยน db.query เป็น con.query
            if (err) reject(err);
            resolve(result);
        });
    });
};


// Register
app.post('/regisDB', async (req, res) => {
    const { username, password } = req.body;

    try {
        // ตรวจสอบ username ซ้ำ
        const checkQuery = `SELECT COUNT(*) AS count FROM Users WHERE UserName = ?`;
        const result = await queryDB(checkQuery, [username]);

        if (result[0].count > 0) {
            // ส่งข้อความแจ้งเตือนในรูปแบบ JSON และสถานะ 400
            return res.status(400).json({ error: 'UserName นี้ถูกใช้งานแล้ว!' });
        }

        // เพิ่มผู้ใช้ใหม่
        const insertQuery = `INSERT INTO Users (UserName, Password) VALUES (?, ?)`;
        await queryDB(insertQuery, [username, password]);

        res.status(200).send(); // ลงทะเบียนสำเร็จ
    } catch (error) {
        console.error('Error registering user:', error.message);
        res.status(500).json({ error: 'Failed to register user!' });
    }
});







app.get('/logout', (req, res) => {
    res.clearCookie('username');
    return res.redirect('login.html');
});

app.post('/checkLogin', async (req, res) => {
    let query = `SELECT username, password FROM users`;
    let queryResponse = await queryDB(query);

    let username = req.body.username;
    let password = req.body.password;

    let creds = Object.assign({}, queryResponse)

    let keys = Object.keys(creds);
    for (let user of keys) {
        if (creds[user].username == username && creds[user].password == password) {
            res.cookie('username', username);
            return res.redirect('game.html');
        }
    }

    return res.redirect('login.html?error=1');
});

// ดึงคะแนนสะสมของผู้ใช้
app.get('/getScore', async (req, res) => {
    const username = req.query.username;

    try {
        // ค้นหา UserID จาก username
        const userQuery = 'SELECT UserID FROM Users WHERE UserName = ?';
        const userResult = await queryDB(userQuery, [username]);

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found!' });
        }

        const userID = userResult[0].UserID;

        // ดึงคะแนนล่าสุดจากตาราง Scores
        const scoreQuery = `
            SELECT Score FROM Scores 
            WHERE UserID = ? 
            ORDER BY PlayDate DESC LIMIT 1
        `;
        const scoreResult = await queryDB(scoreQuery, [userID]);

        const currentScore = scoreResult[0]?.Score || 0; // หากไม่มีคะแนน ให้เริ่มที่ 0
        res.json({ currentScore });
    } catch (error) {
        console.error('Error fetching score:', error.message);
        res.status(500).json({ error: 'Error fetching score!' });
    }
});


app.post('/updateScore', async (req, res) => {
    const { username, score } = req.body; // รับ username และคะแนนสะสมทั้งหมดจาก Client
    const now = new Date();

    if (!username || typeof score !== 'number' || score <= 0) {
        return res.status(400).json({ error: 'Invalid input!' });
    }

    try {
        // ค้นหา UserID จาก username
        const userQuery = 'SELECT UserID FROM Users WHERE UserName = ?';
        const userResult = await queryDB(userQuery, [username]);

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found!' });
        }

        const userID = userResult[0].UserID;

        // ตรวจสอบว่ามีแถวใน Scores สำหรับ UserID นี้หรือไม่
        const checkScoreQuery = 'SELECT * FROM Scores WHERE UserID = ?';
        const scoreResult = await queryDB(checkScoreQuery, [userID]);

        if (scoreResult.length === 0) {
            // หากไม่มีแถวใน Scores ให้สร้างแถวใหม่
            const insertQuery = 'INSERT INTO Scores (UserID, Score, PlayDate) VALUES (?, ?, ?)';
            await queryDB(insertQuery, [userID, score, now]);
        } else {
            // อัปเดตคะแนนในแถวที่มีอยู่
            const updateQuery = 'UPDATE Scores SET Score = ?, PlayDate = ? WHERE UserID = ?';
            await queryDB(updateQuery, [score, now, userID]);
        }

        // ส่งข้อมูลกลับไปยัง Client
        res.json({ message: 'Score updated successfully!', newScore: score });
    } catch (error) {
        console.error('Error updating score:', error.message);
        res.status(500).json({ error: 'Internal server error!' });
    }
});

// Get Leaderboard
app.get('/leaderboard', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.UserName, 
                MAX(s.Score) AS Score,
                (SELECT COUNT(*) FROM Leaderboard_Interactions WHERE ScoreID = s.ScoreID AND InteractType = 'Like') AS likes,
                (SELECT COUNT(*) FROM Leaderboard_Interactions WHERE ScoreID = s.ScoreID AND InteractType = 'Love') AS loves,
                (SELECT COUNT(*) FROM Leaderboard_Interactions WHERE ScoreID = s.ScoreID AND InteractType = 'Comment') AS comments,
                (SELECT CommentText FROM Leaderboard_Interactions WHERE ScoreID = s.ScoreID AND InteractType = 'Comment' ORDER BY InteractDate DESC LIMIT 1) AS latestComment,
                s.ScoreID
            FROM Scores s
            JOIN Users u ON s.UserID = u.UserID
            GROUP BY s.UserID
            ORDER BY Score DESC
        `;
        const leaderboard = await queryDB(query);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error.message);
        res.status(500).json({ error: 'Error fetching leaderboard!' });
    }
});


// Interact with a score
app.post('/interact', async (req, res) => {
    const { scoreID, interactType, commentText } = req.body;
    const username = req.cookies.username; // รับ username จากคุกกี้
    const now = new Date();

    if (!scoreID || !interactType) {
        return res.status(400).json({ error: 'Invalid input!' });
    }

    try {
        // ค้นหา UserID จาก username
        const userQuery = 'SELECT UserID FROM Users WHERE UserName = ?';
        const userResult = await queryDB(userQuery, [username]);

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found!' });
        }

        const userID = userResult[0].UserID;

        // เพิ่ม Interaction ลงในตาราง Leaderboard_Interactions
        const insertQuery = `
            INSERT INTO Leaderboard_Interactions (ScoreID, InteractType, CommentText, UserID, InteractDate)
            VALUES (?, ?, ?, ?, ?)
        `;
        await queryDB(insertQuery, [scoreID, interactType, commentText || null, userID, now]);

        res.json({ message: `${interactType} added successfully!` });
    } catch (error) {
        console.error('Error adding interaction:', error.message);
        res.status(500).json({ error: 'Error adding interaction!' });
    }
});

app.get('/getComments', async (req, res) => {
    const { scoreID } = req.query;

    if (!scoreID) {
        return res.status(400).json({ error: 'ScoreID is required!' });
    }

    try {
        const query = `
            SELECT 
                u.UserName, 
                l.CommentText, 
                l.InteractDate 
            FROM Leaderboard_Interactions l
            JOIN Users u ON l.UserID = u.UserID
            WHERE l.ScoreID = ? AND l.InteractType = 'Comment'
            ORDER BY l.InteractDate DESC;
        `;
        const comments = await queryDB(query, [scoreID]);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ error: 'Error fetching comments!' });
    }
});


// Start Server
app.listen(port, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
