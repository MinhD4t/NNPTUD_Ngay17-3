const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');

let privateKey = "";
let publicKey = "";
try {
    privateKey = fs.readFileSync(path.join(__dirname, '..', 'private.pem'), 'utf8');
    publicKey = fs.readFileSync(path.join(__dirname, '..', 'public.pem'), 'utf8');
} catch (error) {
    console.warn("Lưu ý: Chưa tìm thấy file private.pem / public.pem. Vui lòng chạy lệnh: node generate_keys.js trước!");
}

let users = []; // giả lập database

// REGISTER
router.post("/register", async (req, res) => {

    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({
            message:"Missing email or password"
        });
    }

    const hash = await bcrypt.hash(password,10);

    const user = {
        id: users.length + 1,
        email: email,
        password: hash
    };

    users.push(user);

    res.json({
        message:"Register success",
        user: user.email
    });

});


// LOGIN
router.post("/login", async (req, res) => {

    const {email, password} = req.body;

    const user = users.find(u => u.email === email);

    if(!user){
        return res.status(401).json({
            message:"User not found"
        });
    }

    const match = await bcrypt.compare(password,user.password);

    if(!match){
        return res.status(401).json({
            message:"Wrong password"
        });
    }

    const token = jwt.sign(
        {id:user.id,email:user.email},
        privateKey,
        { algorithm: 'RS256', expiresIn: "1h" }
    );

    res.json({
        message:"Login success",
        token:token
    });

});

// GET /me
router.get("/me", async (req, res) => {
    // Lấy token từ header Authorization
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Chưa cung cấp token (Token missing)" });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        
        // Tìm user trong mảng giả lập
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }

        // Trả về thông tin user (không trả về password)
        res.json({
            message: "Thành công",
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
});

// POST /change-password
router.post("/change-password", async (req, res) => {
    // 1. Kiểm tra token (yêu cầu đăng nhập)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Chưa cung cấp token (Token missing)" });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        
        // Tìm user
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }

        // 2. Lấy dữ liệu từ request body
        const { oldpassword, newpassword } = req.body;

        if (!oldpassword || !newpassword) {
            return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ oldpassword và newpassword" });
        }

        // 3. Thực hiện validate newpassword (ví dụ: ít nhất 6 ký tự)
        if (newpassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        // 4. Kiểm tra oldpassword có khớp với mật khẩu hiện tại hay không
        const match = await bcrypt.compare(oldpassword, user.password);
        if (!match) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
        }

        // 5. Cập nhật mật khẩu mới
        const hashedNewPassword = await bcrypt.hash(newpassword, 10);
        user.password = hashedNewPassword; 
        
        // Cập nhật lại vào mảng users
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex] = user;

        res.json({ message: "Đổi mật khẩu thành công" });

    } catch (err) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
});

module.exports = router;