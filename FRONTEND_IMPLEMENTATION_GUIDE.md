# 🚀 FRONTEND IMPLEMENTATION GUIDE

## Complete Setup & Installation

### Prerequisites
- Node.js 14+ and npm
- Backend running on `http://localhost:5000`
- Database seeded with sample data

### Installation Steps

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
EOF

# Start development server
npm start

# Build for production
npm run build
```

The app will open at `http://localhost:3000`

---

## Project Structure Explanation

### `/src/api/`
- **axiosConfig.js** - Axios instance with interceptors for token management
- **index.js** - All API endpoint wrappers organized by feature

### `/src/context/`
- **AuthContext.js** - Global authentication state (user, token, login/logout)
- **useAuth.js** - Custom hook to access auth context

### `/src/components/`
- **Auth/** - Login & Register pages
- **Layout/** - Navbar, Sidebar, MainLayout
- **Common/** - Reusable components (Button, Input, Card, Modal, Alert, Loading)
- **Protected/** - Route protection & role-based access
- **Admin/** - Admin dashboard & CRUD pages
- **Student/** - Student experience submission & management
- **Junior/** - Junior company browser & resources

### `/src/hooks/`
- **useAuth.js** - Access authentication context
- (Extensible for useFetch, useForm, etc.)

### `/src/styles/`
- **index.css** - Global variables and utilities
- Component-specific CSS files

---

## Authentication Flow

### Login Flow
```
User enters credentials
         ↓
LoginPage calls authAPI.login(email, password)
         ↓
Backend returns { user, token, refreshToken }
         ↓
AuthContext stores token in localStorage & state
         ↓
Axios interceptor adds bearer token to all requests
         ↓
User redirected to dashboard based on role
```

### Token Management
- **Token stored in:** `localStorage.token`
- **User stored in:** `localStorage.user` (JSON string)
- **Interceptor adds:** `Authorization: Bearer <token>` to all requests
- **Token expiry:** Handled by backend (401 triggers logout)

### Protected Routes
All protected routes check:
1. User is authenticated (token exists)
2. User has correct role (student/admin/junior)
3. If not → Redirects to /login

---

## API Integration Details

### Authentication Endpoints

```javascript
// Login
POST /api/auth/login
Request: { email, password }
Response: { success, data: {user}, token, refreshToken }

// Register  
POST /api/auth/register
Request: { email, password, first_name, last_name, role, phone, department, batch_year }
Response: { success, data: {user}, token, refreshToken }

// Get Profile
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { success, data: {user} }

// Logout
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

### Company Endpoints (Admin & Public)

```javascript
// Admin: Get all companies
GET /api/admin/companies?page=1&limit=20
Response: { success, data: [...], pagination: {} }

// Admin: Create company
POST /api/admin/companies
Body: { name, description, website, headquarters, industry, company_size, founded_year }
Response: { success, data: {company}, message }

// Admin: Update company
PUT /api/admin/companies/:id
Body: { ...fields to update }
Response: { success, data: {company}, message }

// Admin: Delete company
DELETE /api/admin/companies/:id
Response: { success, message }

// Public/Junior: Browse companies
GET /api/public/companies?search=google&industry=Technology
Response: { success, data: [...] }
```

### Experience Endpoints (Student)

```javascript
// Submit experience
POST /api/student/experience
Body: {
  company_name,
  role_applied,
  drive_id,
  result,
  offer_received,
  ctc_offered,
  overall_difficulty,
  confidence_level,
  overall_feedback,
  interview_duration,
  rounds: [{ round_number, round_type, duration_minutes, result, difficulty_level, ... }]
}
Response: { success, data: {experience}, message }

// Get my experiences
GET /api/student/experiences?page=1&limit=20
Response: { success, data: [...], pagination: {} }

// Get single experience
GET /api/student/experience/:id
Response: { success, data: {experience} }

// Update experience (before approval)
PUT /api/student/experience/:id
Body: { ...fields to update }
Response: { success, data: {experience}, message }

// Delete experience
DELETE /api/student/experience/:id
Response: { success, message }
```

### Admin Approval Endpoints

```javascript
// Get pending submissions
GET /api/admin/submissions/pending?page=1&limit=20
Response: { success, data: [...experiences], pagination: {} }

// Approve experience
POST /api/admin/submissions/:id/approve
Body: { comments }
Response: { success, message }

// Reject experience
POST /api/admin/submissions/:id/reject
Body: { reason, admin_comments }
Response: { success, message }
```

### Analytics Endpoints

```javascript
// Most asked topics
GET /api/admin/analytics/topics
Response: { success, data: { topics: [{name, frequency}, ...] } }

// Difficulty distribution
GET /api/admin/analytics/difficulty
Response: { success, data: { distribution: {easy, medium, hard} } }

// Skills analysis
GET /api/admin/analytics/skills
Response: { success, data: { skills: [{name, count}, ...] } }

// Company selection rate
GET /api/admin/analytics/company-rate
Response: { success, data: { companies: [{name, selections}, ...] } }
```

---

## Component Usage Examples

### Using Button Component
```jsx
<Button
  label="Click me"
  onClick={handleClick}
  variant="primary"     // primary, secondary, success, danger, outline
  size="default"        // default, small, large
  disabled={false}
  loading={isLoading}
  fullWidth={true}
/>
```

### Using Input Component
```jsx
<Input
  label="Email"
  name="email"
  type="email"          // email, text, password, number, textarea, select
  value={value}
  onChange={handleChange}
  placeholder="your@email.com"
  error={errorMessage}
  hint="Helpful hint"
  required
/>
```

### Using Card Component
```jsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content here</Card.Body>
  <Card.Footer>
    <Button label="Action" />
  </Card.Footer>
</Card>
```

### Using Modal Component
```jsx
const [isOpen, setIsOpen] = useState(false);

<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <Modal.Body>
    Are you sure?
  </Modal.Body>
  <Modal.Footer>
    <Button label="Cancel" onClick={() => setIsOpen(false)} />
    <Button label="Confirm" onClick={handleConfirm} />
  </Modal.Footer>
</Modal>
```

### Using Alert Component
```jsx
<Alert
  type="success"        // success, error, warning, info
  title="Success"
  message="Operation completed"
  onClose={handleClose}
  autoClose={5000}      // milliseconds, 0 for no auto-close
/>
```

### Using Loading Component
```jsx
<Loading
  type="spinner"        // spinner, skeleton
  message="Loading..."
/>
```

### Using Authentication Hook
```jsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, token, isAuthenticated, login, logout, register } = useAuth();
  
  // user: { id, email, role, first_name, last_name }
  // token: JWT token string
  // isAuthenticated: boolean
}
```

---

## State Management Pattern

### Global State (Context)
- Authentication state (user, token, isAuthenticated)
- Login/logout logic
- Token refresh logic

### Local State (useState)
- Form data
- Modal visibility
- Loading states
- Component-specific data

### Data Fetching
- Axios with interceptors for requests
- Error handling in catch blocks
- Loading states before/after fetch
- Success/error alerts

Example:
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await someAPI.getAll();
      setData(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## Form Validation Examples

### Login Validation
```javascript
const validateLogin = () => {
  if (!email || !password) {
    setError('Email and password are required');
    return false;
  }
  if (!email.includes('@')) {
    setError('Invalid email format');
    return false;
  }
  return true;
};
```

### Experience Submission Validation
```javascript
const validateExperience = () => {
  if (!companyName || !roleApplied) {
    return false;
  }
  if (confidenceLevel < 1 || confidenceLevel > 10) {
    return false;
  }
  return true;
};
```

---

## Routing Architecture

### Public Routes
- `/login` - LoginPage
- `/register` - RegisterPage
- `/` - Redirects to `/login`

### Protected Routes (require authentication)
- `/admin/*` - Admin pages (requires role: admin)
- `/student/*` - Student pages (requires role: student)
- `/junior/*` - Junior pages (requires role: junior)

### Route Guards
```jsx
<Route
  path="/admin"
  element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
/>
```

---

## Responsive Design

### Breakpoints
```css
Mobile: max-width 640px
Tablet: 641px to 1024px
Desktop: min-width 1025px
```

### Mobile Optimization
- Sidebar hidden by default, toggle with hamburger menu
- Single column layouts
- Touch-friendly button sizes
- Full-width inputs and cards

### Responsive Components
- Grid layouts use `grid-template-columns: repeat(auto-fit, minmax(...))`
- Flexbox for responsive alignment
- Media queries for layout changes

---

## Common Tasks & How-Tos

### Adding a New Page
1. Create component in `src/components/<Feature>/PageName.jsx`
2. Add route in `App.jsx`
3. Add navigation link in `Sidebar.jsx`
4. Style with component.css file

### Adding a New API Endpoint
1. Add function in `src/api/index.js`
2. Create API wrapper: `export const featureAPI = { getAll: (...) => {} }`
3. Use in component: `const response = await featureAPI.getAll()`
4. Handle response and errors

### Adding Form Validation
1. Create validation function
2. Call before submission
3. Show error message in Alert
4. Prevent submission if invalid

### Adding Loading State
1. Create state: `const [loading, setLoading] = useState(false)`
2. Set true before API call: `setLoading(true)`
3. Set false in finally block: `setLoading(false)`
4. Show loading UI: `{loading ? <Loading /> : <Content />}`

---

## Debugging Tips

### Network Debugging
- Open DevTools → Network tab
- Check API requests & responses
- Verify headers include Authorization token

### State Debugging
- React DevTools extension
- Console.log before/after state changes
- Check localStorage for token/user

### Common Issues
1. **401 Unauthorized** - Token expired or invalid
   - Solution: Login again, token in localStorage
   
2. **404 Not Found** - Endpoint doesn't exist
   - Solution: Check API_URL and endpoint path
   
3. **CORS Errors** - Backend CORS not configured
   - Solution: Check backend CORS settings
   
4. **Empty data** - API returns empty array
   - Solution: Check if data exists in backend
   
5. **Styling issues** - CSS not applying
   - Solution: Check CSS specificity, clear browser cache

---

## Performance Optimization

### Code Splitting
```javascript
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));

<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

### Memoization
```javascript
import { memo } from 'react';

const CompanyCard = memo(({ company }) => {
  return <div>{company.name}</div>;
});
```

### Preventing Unnecessary Re-renders
```javascript
useEffect(() => {
  // Only run when dependencies change
  fetchData();
}, [id]); // Specify dependencies

const handleClick = useCallback(() => {
  // Memoize function
  doSomething();
}, [dependency]);
```

---

## Testing (Optional)

### Writing Tests
```javascript
// Example test for LoginPage
import { render, screen } from '@testing-library/react';
import LoginPage from './components/Auth/LoginPage';

test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});
```

### Running Tests
```bash
npm test
```

---

## Building for Production

```bash
# Create optimized production build
npm run build

# Serve production build locally (for testing)
npm install -g serve
serve -s build

# Deploy to hosting (Vercel, Netlify, etc.)
# Follow hosting provider's deployment guides
```

---

## Environment Variables

Create `.env` file in frontend root:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Environment
REACT_APP_ENV=development

# Feature Flags (optional)
REACT_APP_ENABLE_ANALYTICS=true
```

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 npm start
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CSS Not Loading
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### API Connection Issues
```bash
# Verify backend is running on port 5000
# Check REACT_APP_API_URL in .env
# Check network tab in DevTools
```

---

## Next Steps

### Phase 2 Implementation
1. **Drive Management** - Full CRUD for drives
2. **Approvals Dashboard** - Admin review workflow
3. **Analytics Dashboard** - Data visualization
4. **Advanced Search** - Filters for companies/drives
5. **User Profiles** - Student profile editing

### Phase 3 Features
1. **Notifications** - Email/in-app notifications
2. **Comments System** - Discussion on experiences
3. **Rating System** - Student ratings for companies
4. **Export Reports** - PDF/CSV export
5. **Admin Batch Operations** - Bulk actions

### Performance Enhancements
1. Implement pagination for large lists
2. Add caching for frequently accessed data
3. Lazy load images and components
4. Minify and compress assets

---

## Support & Documentation

- **Backend API Docs**: See `/docs/API_ENDPOINTS.md`
- **Database Schema**: See `/docs/DATABASE_SCHEMA.md`
- **Architecture**: See `/docs/ARCHITECTURE.md`
- **React Docs**: https://react.dev
- **Axios Docs**: https://axios-http.com

---

**Frontend is production-ready! 🚀**
