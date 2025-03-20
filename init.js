const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User"); 
const Student = require("./models/Student");
const connectDB = require("./config/db");

connectDB();

async function initializeDatabase() {
    try {
        // 🧹 Clear existing data
        await User.deleteMany();
        await Student.deleteMany();

        // 🔐 Hash password for admin
        const hashedPassword = await bcrypt.hash("admin123", 10);

        // 👨‍💼 Create Admin
        const admin = new User({
            username: "admin",
            password: hashedPassword,
            role: "admin"
        });

        await admin.save();

        // 🎓 Create Students (Without Login Credentials)
        const students = [
            { rollNumber: "22F-1001", name: "John Doe" },
            { rollNumber: "22F-1002", name: "Jane Smith" },
            { rollNumber: "22F-1003", name: "Alice Johnson" }
        ];

        for (let student of students) {
            // 📌 Create User entry (for role-based access)
            const user = new User({
                rollNumber: student.rollNumber,
                role: "student"
            });

            await user.save();

            // 📌 Create Student entry (for academic records)
            const studentEntry = new Student({
                rollNumber: student.rollNumber,
                name: student.name,
                registeredCourses: []
            });

            await studentEntry.save();
        }

        console.log("✅ Database initialized successfully");
        mongoose.connection.close();
    } catch (err) {
        console.error("Error initializing database:", err);
        mongoose.connection.close();
    }
}

// 🚀 Run initialization
initializeDatabase();
