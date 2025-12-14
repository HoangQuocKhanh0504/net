// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const USERS_FILE = "users.json";

/* ================= UTIL ================= */
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, "[]");
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ================= API ================= */

// LOGIN
app.post("/api/check_user", (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (!user || user.seconds <= 0) {
        return res.json({ success: false, seconds: 0 });
    }

    user.status = "online";
    writeUsers(users);

    res.json({
        success: true,
        seconds: user.seconds
    });
});

// HEARTBEAT – chỉ giữ ONLINE
app.post("/api/heartbeat", (req, res) => {
    const { username } = req.body;
    if (!username) return res.json({ success: false });

    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.json({ success: false });

    if (user.seconds > 0) {
        user.status = "online";
        writeUsers(users);
    }

    res.json({ success: true });
});

// ⏱️ UPDATE TIME – CHỈ TRỪ KHI PYTHON GỌI
app.post("/api/update_time", (req, res) => {
    const { username } = req.body;
    if (!username) return res.json({ success: false });

    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.json({ success: false });

    if (user.seconds > 0) {
        user.seconds -= 5; // ⬅️ PYTHON GỌI 5 GIÂY 1 LẦN
        if (user.seconds < 0) user.seconds = 0;
    }

    if (user.seconds === 0) {
        user.status = "offline";
    }

    writeUsers(users);

    res.json({
        success: true,
        seconds: user.seconds
    });
});

// ADD USER
app.post("/api/add_user", (req, res) => {
    const { username, password, minutes } = req.body;
    if (!username || !password || !minutes) {
        return res.json({ success: false, msg: "Thiếu dữ liệu" });
    }

    const users = readUsers();
    if (users.find(u => u.username === username)) {
        return res.json({ success: false, msg: "User tồn tại" });
    }

    const seconds = parseInt(minutes) * 60;
    users.push({
        username,
        password,
        seconds,
        totalSeconds: seconds,
        status: "offline"
    });

    writeUsers(users);
    res.json({ success: true });
});

// ADD TIME
app.post("/api/add_time", (req, res) => {
    const { username, minutes } = req.body;
    if (!username || !minutes) {
        return res.json({ success: false, msg: "Thiếu dữ liệu" });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.json({ success: false, msg: "User không tồn tại" });
    }

    const addSec = parseInt(minutes) * 60;
    user.seconds += addSec;
    user.totalSeconds += addSec;

    writeUsers(users);
    res.json({ success: true });
});

// RESET PASSWORD
app.post("/api/reset_password", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, msg: "Thiếu dữ liệu" });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.json({ success: false, msg: "User không tồn tại" });
    }

    user.password = password;
    writeUsers(users);

    res.json({ success: true });
});

// DELETE USER
app.post("/api/delete_user", (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.json({ success: false, msg: "Thiếu dữ liệu" });
    }

    const users = readUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) {
        return res.json({ success: false, msg: "User không tồn tại" });
    }

    users.splice(idx, 1);
    writeUsers(users);

    res.json({ success: true });
});

// LIST USERS – WEB CHỈ ĐỌC
app.get("/api/list_users", (req, res) => {
    const users = readUsers();
    users.forEach(u => {
        if (u.seconds <= 0) u.status = "offline";
    });
    res.json(users);
});

/* ================= START ================= */
app.listen(PORT, () => {
    console.log(`🔥 Server running at http://localhost:${PORT}`);
});
