// DOM elements
const studentTab = document.getElementById('student-tab');
const adminTab = document.getElementById('admin-tab');
const loginForm = document.getElementById('login-form');
const identifierLabel = document.getElementById('identifier-label');
const identifierInput = document.getElementById('identifier');
const passwordGroup = document.getElementById('password-group');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// Current active tab
let activeTab = 'student';

// Tab click event handlers
studentTab.addEventListener('click', () => {
    setActiveTab('student');
});

adminTab.addEventListener('click', () => {
    setActiveTab('admin');
});

// Set active tab function
function setActiveTab(tab) {
    activeTab = tab;
    
    // Update tab styles
    if (tab === 'student') {
        studentTab.classList.add('active');
        adminTab.classList.remove('active');
        identifierLabel.textContent = 'Roll Number';
        passwordGroup.style.display = 'none';
    } else {
        adminTab.classList.add('active');
        studentTab.classList.remove('active');
        identifierLabel.textContent = 'Username';
        passwordGroup.style.display = 'block';
    }
    
    // Clear form and messages
    loginForm.reset();
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Form submission handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    try {
        // Prepare request data
        const identifier = identifierInput.value.trim();
        let requestData = { identifier };
        let endpoint = '/student-login';
        
        if (activeTab === 'admin') {
            const password = passwordInput.value;
            requestData = { identifier, password };
            endpoint = '/admin-login';
        }
        
        // Send login request
        const response = await fetch(`http://localhost:5000/api/auth${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Handle successful login
        successMessage.textContent = data.message;
        successMessage.style.display = 'block';
        
        // Store the token
        localStorage.setItem('authToken', data.token);
        
        // Redirect based on role (you can customize this)
        setTimeout(() => {
            if (activeTab === 'student') {
                window.location.href = '/public/html/course.html';
            } else {
                window.location.href = '/public/html/adminDashboard.html';
            }
        }, 1000);
        
    } catch (error) {
        // Handle errors
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});

// Initialize the form
setActiveTab('student');