# Employee Performance Management System

A corporate web application built with the MERN stack (MongoDB, Express, React, Node.js) and orchestratable with Docker. The system supports role-based performance self-assessments, manager override controls, and HR finalizations.

## Technology Stack
- **Frontend**: React, Tailwind CSS v3, Vite, Recharts, Lucide Icons
- **Backend**: Node.js, Express, JSON Web Tokens (JWT), Mongoose
- **Database**: MongoDB
- **Orchestration**: Docker Compose

---

## Port Mappings
- **React Frontend**: [http://localhost:3000](http://localhost:3000)
- **Express Backend**: [http://localhost:5000](http://localhost:5000)
- **MongoDB**: `localhost:27017`

---

## Seeding & Test Credentials
The system includes predefined seed data to let you test the multi-role review loop immediately.

| Role | Email / ID | Password | Test User Name |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@company.com` | `employee123` | Jane Doe (Engineering) |
| **Manager** | `manager@company.com` | `manager123` | John Smith (Engineering) |
| **HR / Admin** | `hr@company.com` | `hr123` | Sarah Connor (Human Resources) |

---

## Core Workflow Steps
1. **Employee Self-Assessment**:
   - Log in as the Employee (`employee@company.com`).
   - Fill out the 20 questions rating yourself (1 to 5) and adding comments.
   - Click **Save Draft** to store your progress or **Submit Review** to lock it and forward it to your manager.
2. **Manager Review**:
   - Log in as the Manager (`manager@company.com`).
   - Click **Review Assessment** next to the employee's name.
   - See the employee's ratings and comment notes side-by-side with your manager input sliders.
   - Adjust the ratings, add your feedback, and click **Submit Manager Evaluation**. This locks the fields and notifies HR.
3. **HR Finalization**:
   - Log in as the HR Admin (`hr@company.com`).
   - Under the directory, locate the employee with status `Manager Reviewed` and click **Finalize**.
   - Compare the employee's self-rating, the manager's adjusted rating, and the **calculated system score** (attendance, hours, projects).
   - Enter a final salary appraisal percentage, select if they are recommended for promotion, add panel remarks, and click **Complete Appraisal**.
   - The final score is computed using the **40-40-20 weighted formula**:
     - *40% Employee average score*
     - *40% Manager average score*
     - *20% System Metrics score*
4. **Appraisal Verification**:
   - Log in back as the Employee. You will see a detailed review sheet showing final grades, remarks, increment percentages, and promotion statuses.

---

## Configuration & Environment Settings
Configuration variables are passed into the containers inside the [docker-compose.yml](docker-compose.yml) file.

### Backend Environment
- `MONGO_URI`: `mongodb://mongo:27017/company_management`
- `PORT`: `5000`
- `JWT_SECRET`: `supersecretkeyforperformancemanagement`

### Frontend Environment
- `VITE_API_URL`: `http://localhost:5000`

---

## Setup & Running the Project

1. **Prerequisites**: Make sure you have Docker Desktop running.
2. **Build and Spin up Containers**:
   ```bash
   docker compose up --build -d
   ```
3. **Seed the database** (Runs inside the container environment):
   ```bash
   docker exec company-backend npm run seed
   ```
4. **Access UI**: Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.
5. **View container logs**:
   ```bash
   docker compose logs -f
   ```
