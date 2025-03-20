// Global variables
let authToken = localStorage.getItem('authToken');; // In a real app, get this from login
let allCourses = [];
let allStudents = [];
let courseNames = {}; // Map course IDs to names

// DOM Elements
const menuItems = document.querySelectorAll('.menu-item');
const reportSections = document.querySelectorAll('.report-section');
const toast = document.getElementById('toast');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Set up menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');

            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            reportSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Initialize data for dashboard
    fetchDashboardData();

    // Setup event listeners
    document.getElementById('fetch-course-students').addEventListener('click', fetchStudentsByCourse);

    document.getElementById('fetch-available-courses').addEventListener('click', fetchAvailableCourses);
    document.getElementById('fetch-missing-prerequisites').addEventListener('click', fetchMissingPrerequisites);
    document.getElementById('fetch-all-students').addEventListener('click', fetchAllStudents);
    document.getElementById('fetch-all-courses').addEventListener('click', fetchAllCourses);
    document.getElementById('courseManage').addEventListener('click',()=>{
        window.location.href='/public/html/course.html';
    });
    // Setup search functionality
    document.getElementById('student-search').addEventListener('input', filterStudents);
    document.getElementById('course-search').addEventListener('input', filterCourses);
    document.getElementById('department-filter').addEventListener('change', filterCourses);
});

// Show toast notification
function showToast(message, isError = false) {
    toast.textContent = message;
    if (isError) {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Toggle loader
function toggleLoader(sectionId, show) {
    const section = document.getElementById(sectionId);
    const loader = section.querySelector('.loader');
    const emptyState = section.querySelector('.empty-state');

    if (show) {
        loader.classList.add('active');
        if (emptyState) emptyState.style.display = 'none';
    } else {
        loader.classList.remove('active');
    }
}

// Fetch data for dashboard overview
async function fetchDashboardData() {
    try {
        await Promise.all([
            fetchAllStudents(true),
            fetchAllCourses(true),
            fetchAvailableCourses(true),
            fetchMissingPrerequisites(true)
        ]);

        // Update dashboard cards
        document.getElementById('total-students').textContent = allStudents.length;
        document.getElementById('total-courses').textContent = allCourses.length;

        const availableSeats = allCourses.reduce((total, course) => total + course.availableSeats, 0);
        document.getElementById('available-seats').textContent = availableSeats;

        // Populate course dropdown
        populateCourseDropdown();

        // Populate department dropdown
        populateDepartmentDropdown();

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast('Failed to load dashboard data. Please try again.', true);
    }
}

// Populate course dropdown
function populateCourseDropdown() {
    const courseSelect = document.getElementById('course-select');
    courseSelect.innerHTML = '<option value="">Select Course</option>';

    allCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course._id;
        option.textContent = `${course.code}: ${course.title}`;
        courseSelect.appendChild(option);

        // Also update courseNames map
        courseNames[course._id] = `${course.code}: ${course.title}`;
    });
}

// Populate department dropdown
function populateDepartmentDropdown() {
    const departmentFilter = document.getElementById('department-filter');
    departmentFilter.innerHTML = '<option value="">All Departments</option>';

    // Get unique departments
    const departments = [...new Set(allCourses.map(course => course.department))];

    departments.forEach(department => {
        const option = document.createElement('option');
        option.value = department;
        option.textContent = department;
        departmentFilter.appendChild(option);
    });
}

// Fetch all students
async function fetchAllStudents(isDashboard = false) {
    console.log(isDashboard);
    if (!isDashboard) toggleLoader('all-students', true);

    try {
        const response = await fetch('http://localhost:5000/api/admin/students', {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch students');

        const data = await response.json();
        allStudents = data.students;
        if (!isDashboard.isTrusted) {
            renderStudentsTable(allStudents);
            document.getElementById('all-students-empty').style.display = 'none';
        }

        return allStudents;
    } catch (error) {
        console.error('Error fetching students:', error);
        if (!isDashboard.isTrusted) {
            showToast('Failed to load students. Please try again.', true);
            document.getElementById('all-students-empty').style.display = 'block';
        }
    } finally {
        if (!isDashboard.isTrusted) toggleLoader('all-students', false);
    }
}

// Fetch all courses
async function fetchAllCourses(isDashboard = false) {
    if (!isDashboard.isTrusted) toggleLoader('all-courses', true);

    try {
        const response = await fetch('http://localhost:5000/api/admin/courses', {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch courses');

        const data = await response.json();
        allCourses = data.courses;

        if (!isDashboard.isTrusted) {
            renderCoursesTable(allCourses);
            document.getElementById('all-courses-empty').style.display = 'none';
        }

        return allCourses;
    } catch (error) {
        console.error('Error fetching courses:', error);
        if (!isDashboard.isTrusted) {
            showToast('Failed to load courses. Please try again.', true);
            document.getElementById('all-courses-empty').style.display = 'block';
        }
    } finally {
        if (!isDashboard.isTrusted) toggleLoader('all-courses', false);
    }
}

// Fetch students by course
async function fetchStudentsByCourse() {
    const courseId = document.getElementById('course-select').value;

    if (!courseId) {
        showToast('Please select a course first', true);
        return;
    }

    toggleLoader('course-students', true);

    try {
        const response = await fetch(`http://localhost:5000/api/admin/course/${courseId}/students`, {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch students for course');

        const data = await response.json();
        const students = data.students;

        renderCourseStudentsTable(students);
        document.getElementById('course-students-empty').style.display = students.length ? 'none' : 'block';

        if (students.length === 0) {
            document.getElementById('course-students-empty').innerHTML =
                '<i>📊</i><p>No students registered for this course</p>';
        }
    } catch (error) {
        console.error('Error fetching students for course:', error);
        showToast('Failed to load students for course. Please try again.', true);
        document.getElementById('course-students-empty').style.display = 'block';
    } finally {
        toggleLoader('course-students', false);
    }
}

// Fetch available courses
async function fetchAvailableCourses(isDashboard = false) {
    if (!isDashboard.isTrusted) toggleLoader('available-courses', true);

    try {
        const response = await fetch('http://localhost:5000/api/admin/courses/available', {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch available courses');

        const data = await response.json();
        const courses = data.courses;
        console.log(isDashboard);
        if (!isDashboard.isTrusted) {

            renderAvailableCoursesTable(courses);
            document.getElementById('available-courses-empty').style.display = courses.length ? 'none' : 'block';

            if (courses.length === 0) {
                document.getElementById('available-courses-empty').innerHTML =
                    '<i>📊</i><p>No courses with available seats</p>';
            }
        }

        return courses;
    } catch (error) {
        console.error('Error fetching available courses:', error);
        if (!isDashboard.isTrusted) {
            showToast('Failed to load available courses. Please try again.', true);
            document.getElementById('available-courses-empty').style.display = 'block';
        }
    } finally {
        if (!isDashboard.isTrusted) toggleLoader('available-courses', false);
    }
}

// Fetch students missing prerequisites
async function fetchMissingPrerequisites(isDashboard = false) {
    if (!isDashboard.isTrusted) toggleLoader('missing-prerequisites', true);

    try {
        const response = await fetch('http://localhost:5000/api/admin/students/missing-prerequisites', {
            headers: {
                'Authorization': `${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch students missing prerequisites');

        const data = await response.json();
        const students = data.students;

        if (isDashboard.isTrusted) {
            document.getElementById('missing-prerequisites-count').textContent = students.length;
        } else {
            renderMissingPrerequisitesTable(students);
            document.getElementById('missing-prerequisites-empty').style.display = students.length ? 'none' : 'block';

            if (students.length === 0) {
                document.getElementById('missing-prerequisites-empty').innerHTML =
                    '<i>📊</i><p>No students missing prerequisites</p>';
            }
        }

        return students;
    } catch (error) {
        console.error('Error fetching students missing prerequisites:', error);
        if (!isDashboard.isTrusted) {
            showToast('Failed to load students missing prerequisites. Please try again.', true);
            document.getElementById('missing-prerequisites-empty').style.display = 'block';
        }
    } finally {
        if (!isDashboard.isTrusted) toggleLoader('missing-prerequisites', false);
    }
}

// Render students table
function renderStudentsTable(students) {
    const tableBody = document.getElementById('all-students-table').querySelector('tbody');
    tableBody.innerHTML = '';

    students.forEach(student => {
        const tr = document.createElement('tr');

        const courses = student.registeredCourses.map(courseId => {
            return courseNames[courseId] || courseId;
        }).join(', ');

        tr.innerHTML = `
            <td>${student.rollNumber}</td>
            <td>${student.name}</td>
            <td>${courses}</td>
        `;

        tableBody.appendChild(tr);
    });
}

// Render courses table
function renderCoursesTable(courses) {
    const tableBody = document.getElementById('all-courses-table').querySelector('tbody');
    tableBody.innerHTML = '';

    courses.forEach(course => {
        const tr = document.createElement('tr');

        const schedule = course.schedule ?
            `${course.schedule.days.join(', ')} ${course.schedule.startTime} - ${course.schedule.endTime}` :
            'N/A';

        tr.innerHTML = `
            <td>${course.code}</td>
            <td>${course.title}</td>
            <td>${course.instructor}</td>
            <td>${course.department}</td>
            <td>${course.level}</td>
            <td>${course.availableSeats}</td>
            <td>${schedule}</td>
        `;

        tableBody.appendChild(tr);
    });
}

// Render course students table
function renderCourseStudentsTable(students) {
    const tableBody = document.getElementById('course-students-table').querySelector('tbody');
    tableBody.innerHTML = '';

    students.forEach(student => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${student.rollNumber}</td>
            <td>${student.name}</td>
            
        `;

        tableBody.appendChild(tr);
    });
}

// Render available courses table
function renderAvailableCoursesTable(courses) {
    console.log('render');
    const tableBody = document.getElementById('available-courses-table').querySelector('tbody');
    console.log(tableBody);
    tableBody.innerHTML = '';

    courses.forEach(course => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${course.code}</td>
            <td>${course.title}</td>
            <td>${course.instructor}</td>
            <td>${course.availableSeats}</td>
        `;

        tableBody.appendChild(tr);
    });
}

// Render missing prerequisites table
function renderMissingPrerequisitesTable(students) {
    const tableBody = document.getElementById('missing-prerequisites-table').querySelector('tbody');
    tableBody.innerHTML = '';

    students.forEach(student => {
        const tr = document.createElement('tr');

        const missingCourse = courseNames[student.missingCourse] || student.missingCourse;

        tr.innerHTML = `
            <td>${student.studentName}</td>
            <td>${student.rollNumber}</td>
            <td>${missingCourse}</td>
        `;

        tableBody.appendChild(tr);
    });
}

// Filter students based on search input
function filterStudents() {
    const searchTerm = document.getElementById('student-search').value.toLowerCase();

    if (!allStudents.length) return;

    const filteredStudents = allStudents.filter(student => {
        return student.name.toLowerCase().includes(searchTerm) ||
            student.rollNumber.toLowerCase().includes(searchTerm);
    });

    renderStudentsTable(filteredStudents);
}

// Filter courses based on search input and department
function filterCourses() {
    const searchTerm = document.getElementById('course-search').value.toLowerCase();
    const departmentFilter = document.getElementById('department-filter').value;

    if (!allCourses.length) return;

    const filteredCourses = allCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm) ||
            course.code.toLowerCase().includes(searchTerm);

        const matchesDepartment = !departmentFilter || course.department === departmentFilter;

        return matchesSearch && matchesDepartment;
    });

    renderCoursesTable(filteredCourses);
}

// Error handling function for API calls
async function handleApiResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'An error occurred');
    }
    return response.json();
}

// Example logout function
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    window.location.href = '/login.html';
}

// Mobile navigation toggle
function toggleMobileNav() {
    document.querySelector('.sidebar').classList.toggle('mobile-visible');
}