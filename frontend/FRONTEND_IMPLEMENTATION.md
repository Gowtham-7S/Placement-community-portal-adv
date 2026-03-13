# 🎨 Frontend Implementation Documentation

This document details the step-by-step implementation of the frontend architecture for the Placement Intelligence Portal.

## 1. Project Initialization

- **Framework**: React.js (v18+)
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios
- **Styling**: Plain CSS (Modular approach)

## 2. Core Architecture Implemented

### A. API Service Layer (`src/services/api.js`)
We implemented a centralized Axios instance to handle all HTTP requests.
- **Base URL**: Configured via environment variables (`REACT_APP_API_BASE_URL`).
- **Request Interceptor**: Automatically retrieves the JWT token from `localStorage` and attaches it to the `Authorization` header (`Bearer <token>`).
- **Response Interceptor**: Global error handling. Specifically watches for `401 Unauthorized` responses to automatically log the user out and redirect to the login page.

### B. Layout System (`src/components/layout/`)
We created a dashboard-style layout system that adapts to the user's role.

#### **Sidebar Component (`Sidebar.jsx`)**
- **Role-Based Rendering**: The sidebar accepts a `role` prop (`admin`, `student`, `junior`) and renders different navigation links accordingly.
  - **Admin**: Dashboard, Companies, Drives, Approvals, Analytics.
  - **Student**: Dashboard, Submit Experience, My Submissions, Drives.
  - **Junior**: Dashboard, Companies, Roadmap.
- **Active State**: Uses `NavLink` to automatically highlight the current active page.
- **Logout Functionality**: Integrated logout button that clears local storage and redirects to login.

#### **Styling (`Sidebar.css`)**
- Implemented a clean, professional sidebar design.
- Fixed position on the left side (`width: 260px`).
- Hover effects and active state styling for better UX.

## 3. Directory Structure

The frontend is organized as follows:

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx       # Role-based navigation
│   │   └── Sidebar.css       # Sidebar styles
│   └── guards/               # (Planned) Protected routes
├── services/
│   └── api.js                # Axios configuration
├── pages/                    # (Planned) View components
└── context/                  # (Planned) AuthContext
```

## 4. Next Steps

1.  **Auth Context**: Implement `AuthContext.js` to manage global user state and wrap the application.
2.  **Protected Routes**: Create a wrapper component to restrict access to routes based on the user role.
3.  **Page Implementation**:
    -   **Login Page**: Connect to `/api/auth/login`.
    -   **Dashboard**: Create role-specific dashboard widgets.
    -   **Experience Form**: Build the multi-step form for students.

## 5. Usage

To use the API service in any component:

```javascript
import api from '../services/api';

const fetchData = async () => {
  try {
    const response = await api.get('/some-endpoint');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};
```


Step 1: Frontend Structure & Dependencies Check
We need to ensure the frontend has the necessary libraries to handle routing and API requests.

Tools: react-router-dom (for navigation), axios (for API calls), and react-hook-form (optional, for clean form handling).
Goal: Verify package.json and install missing packages.
Step 2: Create the Auth Context (The "Brain")
We will build a global AuthProvider to manage the user's state across the application.

Logic: It will check for a stored JWT token on page load, decode it, and make the user object available to all pages.
Why: This prevents the user from being logged out when they refresh the page.
Step 3: Implement the "Smart" Registration Page
This is where your specific email criteria come into play.

Logic: When the user types their email:
If it contains .xx23 (or similar batch code) -> Auto-select/Assign Student role.
If it contains @placement -> Auto-select/Assign Admin role.
Otherwise -> Default to Junior.
Backend Note: We may need to slightly adjust the backend authController.js to allow the 'admin' role creation via the API if the email matches specific criteria (currently it only allows 'student' and 'junior').
Step 4: Implement Login with Role-Based Redirects
We will create the Login form that connects to your running backend.

Logic:
Send Email/Password to POST /api/auth/login.
Receive token and user object (which contains the role).
Routing Switch:
if (role === 'admin') → Redirect to /admin/dashboard
if (role === 'student') → Redirect to /student/dashboard
if (role === 'junior') → Redirect to /junior/dashboard
Step 5: Create Protected Route Guards
We need to ensure a Student cannot manually type /admin/dashboard to access it.

Logic: Create a <ProtectedRoute allowedRoles={['admin']} /> component that wraps the dashboard routes.
Ready to proceed? Since I cannot see the frontend files, please share the frontend file list or type "Start Step 1" if you want me to assume a standard React structure and provide the code for the Auth Context and Pages.

===============================
Step 1: Delete the Redundant Folder
Delete the entire src/pages folder. This removes the temporary files we created (Login.jsx, Register.jsx, and the dashboard placeholders).
Step 2: Update Imports in App.jsx
You need to point your router to the correct components. Open src/App.jsx and update the import statements at the top.

Dashboards: Change imports from ./pages/... to the specific location in components.
Example: import JuniorDashboard from './components/Junior/JuniorDashboard';
Auth Pages: Locate where your Login and Register components are inside src/components (likely src/components/Auth/ or just src/components/) and update the imports in App.jsx accordingly.
Step 3: Verify Internal Component Imports
Since the file depth has changed (e.g., moving from src/pages/ to src/components/Junior/), you must check the import paths inside your component files.

Context: Check if Login.jsx or JuniorDashboard.jsx imports AuthContext.
If it was: import ... from '../context/AuthContext';
It might need to be: import ... from '../../context/AuthContext'; (if nested deeper in folders like components/Junior).
Common UI: Your JuniorDashboard.jsx tries to import ../Common/Card and ../Common/Button. Ensure that the folder src/components/Common exists and contains those files.
Step 4: Check CSS Imports
JuniorDashboard.jsx imports ./Junior.css. Ensure this CSS file exists in the same folder (src/components/Junior/).
Step 5: Restart the Server
Stop the terminal (Ctrl+C).
Run npm start again.
If you see "Module not found" errors, it means one of the paths in Step 2 or Step 3 is slightly off. Adjust the ../ or ./ until it matches your folder structure.

3. Testing the Full Registration & Login Flow
Once the browser opens (or navigate to http://localhost:3000), follow this sequence to test the "Smart" Role Detection and Protected Routes.

Scenario A: Register as an Admin
Navigate: Go to the Register page (click "create a new account" or go to /register).
Input:
First Name: Admin
Last Name: Test
Email: admin@placement.com (Crucial: Must contain @placement)
Password: password123
Department: Admin
Batch: 2024
Observe: As you type the email, the "Detected Role" field should automatically switch to admin.
Submit: Click Register.
Result: You should be automatically redirected to the Admin Dashboard (/admin/dashboard).
If you try to change the URL to /student/dashboard manually, you should see "Unauthorized Access".
Scenario B: Register as a Student
Logout: (If you haven't implemented a logout button yet, clear your Local Storage: F12 -> Application -> Local Storage -> Right-click -> Clear, then refresh).
Navigate: Go to /register.
Input:
Email: student.xx23@college.edu (Crucial: Must contain .xx followed by digits)
Observe: The "Detected Role" field should switch to student.
Submit: Click Register.
Result: You should be redirected to the Student Dashboard (/student/dashboard).
Scenario C: Login Flow
Logout (Clear Local Storage).
Navigate: Go to /login.
Input: Enter the credentials of the Admin user you created in Scenario A.
Submit: Click Sign in.
Result: You should be redirected specifically to the Admin Dashboard.