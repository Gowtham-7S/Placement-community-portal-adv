# Postman Workspace Setup - Complete Guide

## Overview
This guide walks through setting up Postman for API testing of the Placement Intelligence Portal backend.

## Quick Start: Import Collection

Instead of creating requests manually, you can import the pre-configured collection file:

1. Open Postman.
2. Click **Import** (top left).
3. Drag and drop the file `Placement_Portal_API.postman_collection.json` (located in the project root).
4. The collection "Placement Portal API" will appear in your workspace.
5. **Note:** The collection comes with a `baseUrl` variable set to `http://localhost:5000/api`.

---

## Step 1: Create Postman Account & Workspace

### 1.1 Download Postman
- Go to https://www.postman.com/downloads/
- Download and install for Windows
- Open Postman after installation

### 1.2 Sign In / Create Account
- Click **Sign In** (top right)
- Create a free account or use existing credentials
- Verify email if new account

### 1.3 Create Workspace
- Click **Workspaces** (top navigation)
- Click **Create Workspace**
- Name: `Placement-Portal-API`
- Type: `Personal` or `Team`
- Click **Create**

---

## Step 2: Create Environment Variables

### 2.1 Create Environment
- In Postman, click **Environments** (left sidebar)
- Click **+** button or "Create Environment"
- Name: `local`
- Click **Create**

### 2.2 Add Environment Variables
Add these variables in the `local` environment:

| Variable | Initial Value | Type |
|----------|--------------|------|
| `baseUrl` | `http://localhost:5000/api` | string |
| `accessToken` | (leave empty) | string |
| `companyId` | (leave empty) | string |
| `driveId` | (leave empty) | string |
| `experienceId` | (leave empty) | string |
| `adminEmail` | `admin@example.com` | string |
| `adminPassword` | `StrongPass123!` | string |
| `studentEmail` | `student@example.com` | string |
| `studentPassword` | `StudentPass123!` | string |

**Steps:**
- Click on `local` environment
- In the right panel, add each variable:
  - Column 1: Variable name (e.g., `baseUrl`)
  - Column 2: Initial value
  - Column 3: Current value (usually same)
- Click **Save**

### 2.3 Select Active Environment
- Top right, click environment dropdown
- Select `local`
- Confirm it shows "local" as active

---

## Step 3: Create Collection Structure

### 3.1 Create Main Collection
- Click **Collections** (left sidebar)
- Click **+** button
- Name: `Placement Portal API`
- Click **Create**

### 3.2 Create Sub-folders (Organize requests)
Inside the collection, create folders:
- Right-click collection → **Add Folder**

Folder structure:
```
Placement Portal API/
├── Health & Status
├── Authentication
├── Admin - Companies
├── Admin - Drives
├── Admin - Submissions
├── Student - Experiences
├── Analytics
└── Error Handling
```

---

## Step 4: Create Sample Requests

### 4.1 Health Check (in "Health & Status" folder)

**Request 1: Health Check**
- Method: `GET`
- URL: `{{baseUrl}}/public/health`
- Headers: (none needed)
- Tests (optional): 
  ```javascript
  pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
  });
  ```

### 4.2 Authentication Requests (in "Authentication" folder)

**Request 2: Register Admin**
- Method: `POST`
- URL: `{{baseUrl}}/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "email": "{{adminEmail}}",
    "password": "{{adminPassword}}",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }
  ```
- Tests:
  ```javascript
  pm.test("Status is 201", () => {
    pm.response.to.have.status(201);
  });
  const json = pm.response.json();
  pm.test("Token received", () => {
    pm.expect(json.tokens.accessToken).to.exist;
  });
  pm.environment.set("accessToken", json.tokens.accessToken);
  ```

**Request 3: Login Admin**
- Method: `POST`
- URL: `{{baseUrl}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "{{adminEmail}}",
    "password": "{{adminPassword}}"
  }
  ```
- Tests:
  ```javascript
  pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
  });
  const json = pm.response.json();
  pm.environment.set("accessToken", json.tokens.accessToken);
  ```

**Request 4: Get Current User Profile**
- Method: `GET`
- URL: `{{baseUrl}}/auth/me`
- Headers:
  - `Authorization: Bearer {{accessToken}}`
- Tests:
  ```javascript
  pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
  });
  pm.test("User exists", () => {
    pm.expect(pm.response.json().user).to.exist;
  });
  ```

### 4.3 Companies CRUD (in "Admin - Companies" folder)

**Request 5: Create Company**
- Method: `POST`
- URL: `{{baseUrl}}/admin/companies`
- Headers:
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "name": "Tech Corp {{$randomInt}}",
    "description": "A software company",
    "industry": "Technology",
    "website": "https://techcorp.com"
  }
  ```
- Tests:
  ```javascript
  pm.test("Status is 201", () => {
    pm.response.to.have.status(201);
  });
  const json = pm.response.json();
  pm.environment.set("companyId", json.id);
  ```

**Request 6: Get Companies List**
- Method: `GET`
- URL: `{{baseUrl}}/admin/companies?page=1&limit=20`
- Headers:
  - `Authorization: Bearer {{accessToken}}`
- Tests:
  ```javascript
  pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
  });
  pm.test("Response has data array", () => {
    pm.expect(pm.response.json().data).to.be.an('array');
  });
  ```

---

## Step 5: Set Up Authorization Header (Auto-inject)

### Option A: Per Request (Already shown above)
- Add header: `Authorization: Bearer {{accessToken}}`

### Option B: Collection-level Authorization (Recommended)
- Right-click collection → **Edit**
- Go to **Authorization** tab
- Type: `Bearer Token`
- Token: `{{accessToken}}`
- Click **Update**
- Now all requests inherit this header automatically (unless overridden)

---

## Step 6: Common Postman Features

### 6.1 Use Variables in Body
```json
{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}
```

### 6.2 Generate Random Values
```
{{$randomInt}}
{{$timestamp}}
{{$randomEmail}}
{{$randomFirstName}}
```

### 6.3 Set Variables from Response
In Tests tab:
```javascript
const json = pm.response.json();
pm.environment.set("companyId", json.id);
```

### 6.4 Add Request Comments
- Click request name → **Description** → add details

### 6.5 Organize with Folders & Pre-request Scripts
- Pre-request Script (runs before request): Set up data, check dependencies
- Tests (runs after request): Validate response, extract values

---

## Step 7: Test Workflow (Order of Execution)

### Recommended Test Sequence:
1. **Health Check** → Verify server running
2. **Register Admin** → Create test user
3. **Login Admin** → Get JWT token
4. **Get Profile** → Verify token works
5. **Create Company** → Test admin endpoint
6. **Get Companies** → Test list endpoint
7. **Register Student** → Create student user
8. **Login Student** → Get student token
9. **Submit Experience** → Test student endpoint
10. **Admin Approve** → Test approval workflow

---

## Step 8: Run Collection Tests (Automated)

### 8.1 Use Collection Runner
- Click **Collections** (left sidebar)
- Right-click collection → **Run collection**
- Select environment: `local`
- Click **Run** button
- Watch requests execute in sequence

### 8.2 View Results
- Green ✓ = passed test
- Red ✗ = failed test
- View console for detailed logs: **View** → **Show Postman Console**

---

## Step 9: Export Collection & Environment

### 9.1 Export Collection
- Right-click collection → **Export**
- Save as `PlacementPortal.postman_collection.json`
- Share with team

### 9.2 Export Environment
- Click environment → **Export**
- Save as `local.postman_environment.json`
- (Remove `accessToken` values before sharing for security)

---

## Step 10: Install Newman (Optional - for CI/CD)

Newman runs Postman collections from command line.

```powershell
npm install -g newman
newman run PlacementPortal.postman_collection.json -e local.postman_environment.json
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Variable not defined" | Ensure environment is selected; check variable spelling |
| 401 Unauthorized | Run Login request first; check `accessToken` is set |
| 404 Not Found | Verify `baseUrl` is correct; check endpoint path |
| CORS Error | Backend CORS config must include your Postman origin |
| "Cannot GET /" | Backend server might not be running; run `npm run dev` |

---

## Quick Checklist

- [ ] Postman installed & account created
- [ ] Workspace `Placement-Portal-API` created
- [ ] Environment `local` created with `baseUrl`, `accessToken` variables
- [ ] Collection `Placement Portal API` created
- [ ] Sub-folders organized (Auth, Companies, etc.)
- [ ] Health Check request added & tested
- [ ] Register & Login requests added & tested
- [ ] Admin requests (Companies) added & tested
- [ ] Student requests added & tested
- [ ] Collection Runner used to run multiple requests
- [ ] Collection & Environment exported for sharing

---

**Next:** Run the collection and share the exported JSON files with your testing team!
