const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

function readUsers() {
    if(!fs.existsSync("users.json")) fs.writeFileSync("users.json","[]");
    return JSON.parse(fs.readFileSync("users.json"));
}

function writeUsers(users) {
    fs.writeFileSync("users.json", JSON.stringify(users,null,2));
}

// API: kiểm tra user login
app.post("/api/check_user", (req,res)=>{
    const { username, password } = req.body;
    let users = readUsers();
    const user = users.find(u=>u.username===username && u.password===password);
    if(user && user.seconds > 0){
        user.status = "online";
        writeUsers(users);
        res.json({ success:true, seconds: user.seconds });
    } else {
        res.json({ success:false, seconds:0 });
    }
});

// API: heartbeat để giữ trạng thái online
app.post("/api/heartbeat", (req,res)=>{
    const { username } = req.body;
    if(!username) return res.json({ success:false });
    let users = readUsers();
    const user = users.find(u=>u.username===username);
    if(user){
        user.status = "online";
        writeUsers(users);
        res.json({ success:true });
    } else res.json({ success:false });
});

// API: update thời gian mỗi giây
app.post("/api/update_time",(req,res)=>{
    const { username } = req.body;
    if(!username) return res.json({ success:false });
    let users = readUsers();
    const user = users.find(u=>u.username===username);
    if(!user || user.seconds<=0) return res.json({ success:false });
    user.seconds -= 1;
    if(user.seconds<0) user.seconds=0;
    if(user.seconds===0) user.status="offline";
    writeUsers(users);
    res.json({ success:true, seconds:user.seconds });
});

// API: tạo user
app.post("/api/add_user",(req,res)=>{
    const { username, password, minutes } = req.body;
    if(!username||!password||!minutes) return res.json({ success:false, msg:"Thiếu dữ liệu" });
    let users = readUsers();
    if(users.find(u=>u.username===username)) return res.json({ success:false, msg:"User tồn tại" });
    users.push({ username, password, seconds: parseInt(minutes)*60, status:"offline" });
    writeUsers(users);
    res.json({ success:true });
});

// API: nạp thêm thời gian
app.post("/api/add_time",(req,res)=>{
    const { username, minutes } = req.body;
    if(!username||!minutes) return res.json({ success:false, msg:"Thiếu dữ liệu" });
    let users = readUsers();
    const user = users.find(u=>u.username===username);
    if(!user) return res.json({ success:false, msg:"User không tồn tại" });
    user.seconds += parseInt(minutes)*60;
    writeUsers(users);
    res.json({ success:true });
});

// API: danh sách user
app.get("/api/list_users",(req,res)=>{
    const users = readUsers();
    res.json(users);
});

app.listen(3000,()=>console.log("Server running on port 3000"));
