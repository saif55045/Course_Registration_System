const express = require("express");
const Student = require("../models/Student");
const Course = require("../models/Course");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Get Student Weekly Schedule
router.get("/student", authMiddleware, async (req, res) => {

    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Unauthorized! Only students can access this." });
        }

        const student = await Student.findOne({ rollNumber: req.user.rollNumber }).populate("registeredCourses");
        if (!student) {
            return res.status(404).json({ message: "Student not found!" });
        }

        const weeklySchedule = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: []
        };

        for (const course of student.registeredCourses) {
            const populatedCourse = await Course.findById(course._id);

            if (populatedCourse && populatedCourse.schedule) {
                populatedCourse.schedule.days.forEach(day => {
                    if (weeklySchedule[day]) {
                        weeklySchedule[day].push({
                            course: populatedCourse.title,
                            code: populatedCourse.code,
                            instructor: populatedCourse.instructor,
                            department: populatedCourse.department,  // ✅ New field
                            level: populatedCourse.level,          // ✅ New field
                            availableSeats: populatedCourse.availableSeats,
                            prerequisites: populatedCourse.prerequisites,
                            startTime: populatedCourse.schedule.startTime,
                            endTime: populatedCourse.schedule.endTime,
                            timeOfDay: populatedCourse.timeOfDay   // ✅ New field
                        });
                    }
                });
            }
        }

        res.status(200).json({
            student: {
                name: student.name,
                rollNumber: student.rollNumber
            },
            schedule: weeklySchedule
        });
    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});

module.exports = router;
