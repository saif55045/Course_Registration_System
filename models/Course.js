const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    instructor: { type: String, required: true },
    department: { type: String, required: true }, // New field for department
    level: { type: Number, required: true }, // New field for course level (e.g., 100, 200, 300)
    availableSeats: { type: Number, required: true },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    schedule: {
        days: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] }],
        startTime: { type: String }, // Example: "10:00 AM"
        endTime: { type: String }    // Example: "11:30 AM"
    },
    timeOfDay: { 
        type: String, 
        enum: ["Morning", "Afternoon", "Evening"], 
        required: true 
    } // New field for filtering by time of day
});

module.exports = mongoose.model("Course", CourseSchema);
