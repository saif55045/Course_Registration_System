const express = require("express");
const Course = require("../models/Course");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Admin adds a new course
router.post("/add", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") 
        return res.status(403).json({ message: "Unauthorized!" });

    try {
        console.log("Received Data:", req.body);

        // Check if 'code' is missing or empty
        if (!req.body.code) {
            return res.status(400).json({ message: "Course code is required!" });
        }

        // Ensure correct structure for schedule
        const courseData = {
            code: req.body.code.trim(), // Ensure code is not null
            title: req.body.title,
            instructor: req.body.instructor,
            department: req.body.department,
            level: parseInt(req.body.level), // Convert to Number
            prerequisites:req.body.prerequisites,
            availableSeats: parseInt(req.body.availableSeats), // Convert to Number
            schedule: {
                days: Array.isArray(req.body.days) 
                    ? req.body.days 
                    : req.body.days.split(",").map(day => day.trim()), // Convert string to array
                startTime: req.body.startTime,
                endTime: req.body.endTime
            },
            timeOfDay: req.body.timeOfDay
        };

        // Check if the course already exists
        const existingCourse = await Course.findOne({ code: courseData.code });
        if (existingCourse) {
            return res.status(400).json({ message: "Course with this code already exists!" });
        }

        const course = new Course(courseData);
        await course.save();

        res.json({ message: "Course added successfully!", course });
    } catch (error) {
        console.error("Error saving course:", error);
        res.status(500).json({ message: "Error adding course", error });
    }
});



// 📌 Admin updates course details
router.put("/update/:id", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "Course updated successfully!", course });
    } catch (error) {
        res.status(500).json({ message: "Error updating course", error });
    }
});

// 📌 Admin deletes a course
router.delete("/delete/:id", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: "Course deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting course", error });
    }
});

// 📌 Students view available courses
router.get("/all", authMiddleware, async (req, res) => {
    console.log('courses list');
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error });
    }
});

// 📌 Students filter courses based on department, level, time, or days
router.get("/search", authMiddleware, async (req, res) => {
    try {
        const filters = {};
        if (req.query.department) filters.department = req.query.department;
        if (req.query.level) filters.level = req.query.level;
        // Handle time filtering (assuming it's a simple string)
        // console.log(req.query.time);
        // Filter by time of day (Morning, Afternoon, Evening)
        if (req.query.time) {
            filters.timeOfDay = req.query.time;
        }

        // Filter by days (schedule.days is an array, so we use $in)
        if (req.query.days) {
            const daysArray = req.query.days.split(","); // Supports multiple days (comma-separated)
            filters["schedule.days"] = { $in: daysArray };
        }

        const courses = await Course.find(filters);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: "Error filtering courses", error });
    }
});

module.exports = router;
