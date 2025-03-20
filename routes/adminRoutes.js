const express = require("express");
const Student = require("../models/Student");
const Course = require("../models/Course");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 📌 Admin: Get all students
 */
router.get("/students", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const students = await Student.find().select("name rollNumber email registeredCourses");
        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: "Error fetching students", error });
    }
});

/**
 * 📌 Admin: Get all courses
 */
router.get("/courses", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const courses = await Course.find().select("title code instructor department level availableSeats prerequisites schedule");
        res.json({ courses });
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error });
    }
});

/**
 * 📌 Admin: Get students registered for a specific course
 */
router.get("/course/:courseId/students", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const courseId = req.params.courseId;
        const students = await Student.find({ registeredCourses: courseId }).select("name rollNumber email");

        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: "Error fetching students for course", error });
    }
});

/**
 * 📌 Admin: Get courses with available seats
 */
router.get("/courses/available", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const courses = await Course.find({ availableSeats: { $gt: 0 } }).select("title code instructor availableSeats");
        res.json({ courses });
    } catch (error) {
        res.status(500).json({ message: "Error fetching available courses", error });
    }
});

/**
 * 📌 Admin: Get students who have not completed prerequisites
 */
router.get("/students/missing-prerequisites", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const students = await Student.find().populate("registeredCourses");
        let studentsWithMissingPrerequisites = [];

        students.forEach(student => {
            student.registeredCourses.forEach(course => {
                course.prerequisites.forEach(prereq => {
                    if (!student.registeredCourses.some(c => c._id.equals(prereq))) {
                        studentsWithMissingPrerequisites.push({
                            studentName: student.name,
                            rollNumber: student.rollNumber,
                            missingCourse: prereq
                        });
                    }
                });
            });
        });

        res.json({ students: studentsWithMissingPrerequisites });
    } catch (error) {
        res.status(500).json({ message: "Error fetching students with missing prerequisites", error });
    }
});

module.exports = router;
