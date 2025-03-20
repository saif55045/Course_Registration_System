const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 📌 Student Login
router.post("/student-login", async (req, res) => {
    const { identifier } = req.body;
    let rollNumber=identifier;
    console.log(rollNumber);
    console.log(req.body);
    try {
        const student = await User.findOne({ rollNumber, role: "student" });
        if (!student) return res.status(400).json({ message: "Student not found!" });

        // Generate JWT token
        const token = jwt.sign({ id: student._id, role: student.role, rollNumber:student.rollNumber }, process.env.SECRET_KEY, { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 Admin Login
router.post("/admin-login", async (req, res) => {
    const { identifier, password } = req.body;
    let username=identifier;
    try {
        const admin = await User.findOne({ username, role: "admin" });
        if (!admin) return res.status(400).json({ message: "Admin not found!" });

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

        // Generate JWT token
        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.SECRET_KEY, { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
