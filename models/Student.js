const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
    rollNumber: { type: String, unique: true, required: true }, // Unique student ID
    name: { type: String, required: true },  
    registeredCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }] // Track enrolled courses
});

module.exports = mongoose.model("Student", StudentSchema);
