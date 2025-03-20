const express = require("express");
const dotenv = require("dotenv");
const path=require('path');
const connectDB = require("./config/db");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const scheduleRoutes=require("./routes/scheduleRoutes");
const adminRoutes=require('./routes/adminRoutes');
const cors=require('cors');
dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Import routes

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/schedule",scheduleRoutes);
app.use('/api/admin',adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
