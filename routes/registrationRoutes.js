const express = require("express");
const Student = require("../models/Student");
const Course = require("../models/Course");
const authMiddleware = require("../middleware/authMiddleware");
const app=express();
const router = express.Router();

app.use(express.json());


// 📌 Prevent time conflicts before enrolling
const hasTimeConflict = (newCourse, registeredCourses) => {
    for (const course of registeredCourses) {
        for (const day of newCourse.schedule.days) {
            if (course.schedule.days.includes(day)) {
                const start1 = new Date(`1970/01/01 ${course.schedule.startTime}`);
                const end1 = new Date(`1970/01/01 ${course.schedule.endTime}`);
                const start2 = new Date(`1970/01/01 ${newCourse.schedule.startTime}`);
                const end2 = new Date(`1970/01/01 ${newCourse.schedule.endTime}`);

                if ((start2 >= start1 && start2 < end1) || (end2 > start1 && end2 <= end1)) {
                    return true; // Conflict detected
                }
            }
        }
    }
    return false;
};


// 📌 Student registers for a course
router.post("/enroll/:courseId", authMiddleware, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ message: "Unauthorized!" });
    try {
        const student = await Student.findOne({ rollNumber: req.user.rollNumber });

        const course = await Course.findById(req.params.courseId);

        if (!course) return res.status(404).json({ message: "Course not found" });
        
        // 📌 Check for time conflict
        if (hasTimeConflict(course, student.registeredCourses)) {
            console.log('time conflict')
            return res.status(400).json({ message: "Time conflict detected! Cannot enroll." });
        }

        // 📌 Check if student has completed prerequisites
        const completedCourses = (student.registeredCourses || []).map(id => id.toString());

        const missingPrereqs = course.prerequisites.filter(prereq => !completedCourses.includes(prereq));
    
        if (missingPrereqs.length > 0) {
            return res.status(400).json({ message: `Missing prerequisites: ${missingPrereqs.join(", ")}` });
        }

        // 📌 Check if course has available seats
        if (course.availableSeats <= 0) {
            return res.status(400).json({ message: "No seats available for this course" });
        }

        // 📌 Check if student is already enrolled
        if (student.registeredCourses.includes(course._id)) {
            return res.status(400).json({ message: "Already registered for this course" });
        }

        // 📌 Enroll student
        student.registeredCourses.push(course._id);
        await student.save();

        // 📌 Reduce available seats
        await Course.updateOne(
            { _id: course._id },
            { $inc: { availableSeats: -1 } } // Reduce seats by 1
        );

        res.json({ message: "Enrollment successful!", course });
    } catch (error) {
        console.error("Enrollment Error:", error);
        res.status(500).json({ message: "Error enrolling in course", error: error.message });
    }
});

// 📌 Student drops a course
router.post("/drop/:courseId", authMiddleware, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const student = await Student.findOne({ rollNumber: req.user.rollNumber });
        const course = await Course.findById(req.params.courseId);

        if (!course) return res.status(404).json({ message: "Course not found" });

        
        // 📌 Check if student is actually enrolled
        if (!student.registeredCourses.includes(course._id)) {
            return res.status(400).json({ message: "You are not registered for this course" });
        }

        // 📌 Drop the course
        student.registeredCourses = student.registeredCourses.filter(id => id.toString() !== course._id.toString());
        await student.save();

        // 📌 Increase available seats

        await Course.updateOne(
            { _id: course._id },
            { $inc: { availableSeats: +1 } } // Reduce seats by 1
        );

        res.json({ message: "Dropped the course successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Error dropping course", error });
    }
});

// 📌 Admin manually adds a student to a course (override)
router.post("/admin/enroll/:studentId/:courseId", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const student = await Student.findById(req.params.studentId);
        const course = await Course.findById(req.params.courseId);

        if (!course) return res.status(404).json({ message: "Course not found" });

        // 📌 Check for time conflict
        if (hasTimeConflict(course, student.registeredCourses)) {
            return res.status(400).json({ message: "Time conflict detected! Cannot enroll." });
        }
        // 📌 Add student to course (ignoring prerequisites)
        student.registeredCourses.push(course._id);
        await student.save();

        // 📌 Reduce available seats
        await Course.updateOne(
            { _id: course._id },
            { $inc: { availableSeats: -1 } } // Reduce seats by 1
        );

        res.json({ message: "Student enrolled successfully (Admin Override)" });
    } catch (error) {
        res.status(500).json({ message: "Error enrolling student", error });
    }
});

// 📌 Admin manually drops a student from a course
router.post("/admin/drop/:studentId/:courseId", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized!" });

    try {
        const student = await Student.findById(req.params.studentId);
        const course = await Course.findById(req.params.courseId);

        if (!student) return res.status(404).json({ message: "Student not found" });
        if (!course) return res.status(404).json({ message: "Course not found" });

        // 📌 Check if student is actually enrolled in the course
        if (!student.registeredCourses.includes(course._id)) {
            return res.status(400).json({ message: "Student is not registered for this course" });
        }

        // 📌 Remove the course from student's registeredCourses
        student.registeredCourses = student.registeredCourses.filter(id => id.toString() !== course._id.toString());
        await student.save();

        // 📌 Increase available seats for the course
        await Course.updateOne(
            { _id: course._id },
            { $inc: { availableSeats: 1 } } // Increase seats by 1
        );

        res.json({ message: "Student removed from course successfully (Admin Override)" });
    } catch (error) {
        res.status(500).json({ message: "Error removing student from course", error });
    }
});



// 📌 Check available seats before displaying courses
router.get("/courses", async (req, res) => {
    try {
        const courses = await Course.find().select("_id title availableSeats"); // Include _id

        res.json({ courses });
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error });
    }
});
//student routes
router.get('/students/profile',authMiddleware, async (req, res) => {
    try {
        console.log('/profile');
        console.log(req.body);
        let rollNumber=req.user.rollNumber;
        
        const student = await Student.findOne({rollNumber}).select("name rollNumber");
        
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json({ student });
    } catch (error) {
        res.status(500).json({ message: "Error fetching student profile", error });
        console.log('studnet data',error);
    }
});


router.get('/students/courses',authMiddleware, async (req, res) => {
    try {
        let rollNumber=req.user.rollNumber;
        const student = await Student.findOne({rollNumber}).populate("registeredCourses");
        if (!student) return res.status(404).json({ message: "Student not found" });

        res.json({ courses: student.registeredCourses });
    } catch (error) {
        res.status(500).json({ message: "Error fetching registered courses", error });
    }
});

router.get("/students", authMiddleware, async (req, res) => {
    try {
        const students = await Student.find();
        if (students.length === 0) {
            return res.status(404).json({ message: "No students found" });
        }
        res.status(200).json({ students });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//admin routes

router.get("/students/:studentId/courses", async (req, res) => {
    try {
        const { studentId } = req.params;

        // Find the student
        const student = await Student.findById(studentId).populate("registeredCourses");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Return the courses the student is enrolled in
        res.status(200).json({ courses: student.registeredCourses });
    } catch (error) {
        console.error("Error fetching student courses:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
