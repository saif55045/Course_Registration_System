# Course Registration System

A comprehensive web-based course registration system built with Node.js, Express, MongoDB, and vanilla JavaScript that allows students to register for courses and administrators to manage course offerings.

## Features

### Student Features
- Login using roll number
- View and register for available courses
- Drop registered courses 
- View weekly schedule of registered courses
- Real-time seat availability tracking
- Filter courses by department, level, and time slots
- Prerequisites validation before course registration
- Time conflict detection during registration

### Admin Features
- Secure login with username/password
- Dashboard with key metrics
- Comprehensive course management:
  - Add new courses
  - Edit existing courses
  - Delete courses
- View student enrollment reports:
  - Students by course
  - Available courses
  - Missing prerequisites
  - All students list
  - Complete course catalog
- Override registration restrictions
- Manage prerequisites and seat availability

## Technical Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- BCrypt for password hashing
- CORS enabled
- Environment variables with dotenv

### Frontend
- Vanilla JavaScript
- HTML5
- CSS3 with responsive design
- JWT token-based authentication

## Project Structure

```
assignment2-copy/
├── config/
│   └── db.js              # Database configuration
├── middleware/
│   └── authMiddleware.js  # Authentication middleware
├── models/
│   ├── Course.js         # Course schema
│   ├── Student.js        # Student schema
│   └── User.js           # User schema
├── public/
│   ├── css/             # Stylesheets
│   ├── html/            # HTML pages
│   └── js/              # Frontend JavaScript
├── routes/
│   ├── adminRoutes.js    # Admin endpoints
│   ├── authRoutes.js     # Authentication endpoints
│   ├── courseRoutes.js   # Course management endpoints
│   ├── registrationRoutes.js # Registration endpoints
│   └── scheduleRoutes.js # Schedule endpoints
├── .env                  # Environment variables
├── init.js              # Database initialization
├── package.json         # Project dependencies
└── server.js            # Express server setup
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with:
```
MONGO_URI=mongodb://127.0.0.1:27017/university
PORT=5000
SECRET_KEY=your-secret-key
```

3. Initialize database:
```bash
node init.js
```

4. Start server:
```bash
node server.js
```

## API Endpoints

### Authentication
- POST `/api/auth/student-login` - Student login
- POST `/api/auth/admin-login` - Admin login

### Courses
- GET `/api/courses/all` - Get all courses
- GET `/api/courses/search` - Search courses with filters
- POST `/api/courses/add` - Add new course (admin)
- PUT `/api/courses/update/:id` - Update course (admin)
- DELETE `/api/courses/delete/:id` - Delete course (admin)

### Registration
- POST `/api/registration/enroll/:courseId` - Student course enrollment
- POST `/api/registration/drop/:courseId` - Drop course
- GET `/api/registration/students/courses` - Get student's registered courses
- GET `/api/registration/courses` - Get available courses

### Schedule
- GET `/api/schedule/student` - Get student's weekly schedule

### Admin
- GET `/api/admin/students` - Get all students
- GET `/api/admin/courses` - Get all courses
- GET `/api/admin/course/:courseId/students` - Get students in a course
- GET `/api/admin/courses/available` - Get courses with available seats
- GET `/api/admin/students/missing-prerequisites` - Get students missing prerequisites

## Security Features

- JWT-based authentication
- Password hashing with BCrypt
- Role-based access control
- Input validation
- Error handling
- Secure routes with middleware

## Contributors

- Saif Ullah
- Course: Web Engineering
- Semester: 6th
- Program: BSSE

## License

This project is part of academic coursework and is not licensed for commercial use.
