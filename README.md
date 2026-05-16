# 🎯 Performix

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-f38b10?style=for-the-badge&logo=groq&logoColor=white)

> **In-House Goal Setting & Tracking Portal** built for **AtomQuest Hackathon 1.0**

Performix is a comprehensive, enterprise-grade goal setting and tracking portal designed to align team execution, streamline performance reviews, and empower employees and managers to achieve their targets efficiently. 

---

## ✨ Features

### Phase 1 — Goal Creation & Approval
- ✅ **Employee Goal Creation**: Define goals with 4 Unit of Measurement (UoM) types: Min, Max, Timeline, and Zero.
- ✅ **Intelligent Weightage Validation**: Ensures total weightage equals exactly 100%, with a minimum of 10% per goal and a maximum of 8 goals.
- ✅ **Manager (L1) Approval Workflow**: Seamless inline editing and approval processes for managers.
- ✅ **Goal Locking**: Goals are immutable after approval to ensure data integrity during execution.
- ✅ **Shared Goals Engine**: Managers can push departmental KPIs to multiple employees with a single click.
- ✅ **Achievement Sync**: Automated synchronization of achievements across all shared goal recipients.

### Phase 2 — Achievement Tracking & Check-ins
- ✅ **Quarterly Check-in Submission**: Structured check-in windows (Q1: July, Q2: Oct, Q3: Jan, Q4: Mar/Apr).
- ✅ **Auto Progress Score Calculation**: Dynamically computed based on UoM:
  - `min`: `(actual / target) * 100`
  - `max`: `(target / actual) * 100`
  - `timeline`: Evaluates completion date versus deadline.
  - `zero`: `actual === 0 ? 100% : 0%`
- ✅ **Manager Check-in Review**: Comprehensive comment and feedback system for managers.
- ✅ **Live Score Preview**: Real-time feedback while employees enter their achievements.

### 👥 User Roles
- 🧑‍💻 **Employee**: Create goals, submit quarterly check-ins, and view progress dashboards.
- 👔 **Manager**: Approve/return goals, review team check-ins, inline-edit goals, and push shared goals.
- 🛡️ **Admin**: Manage user lifecycles, unlock goals for edge cases, configure cycle windows, view org-wide reports, and configure escalation rules.

### 📊 Reporting & Governance
- ✅ **Achievement Report**: Robust reporting with Excel (CSV/XLSX) export capabilities.
- ✅ **Completion Dashboard**: Real-time visibility into org-wide check-in statuses.
- ✅ **Audit Trail**: Complete traceability (who changed what and when) with CSV export and post-lock filtering.
- ✅ **Manager Effectiveness Report**: Insights into manager engagement and response times.

---

## 🌟 Why Performix Stands Out (Bonus Features)

- 🤖 **AI Goal Suggestions**: Powered by **Groq LLaMA 3.3-70b**. Employees can describe their objective in plain English, and the AI instantly structures it into a SMART goal format.
- ⚙️ **Automated Escalation Engine**: A robust, rule-based node-cron engine running daily at 8:00 AM to monitor and escalate:
  - `goal_not_submitted`
  - `goal_not_approved`
  - `checkin_not_completed`
  - Configurable threshold days and escalation chain (L1 → L2 → HR).
- 📧 **Automated Email Notifications**: Powered by Nodemailer for real-time alerts on goal submissions, approvals, rejections, and check-in reminders.
- 📈 **Advanced Analytics Dashboard**: Built with Recharts for visual insights:
  - Quarter-over-Quarter (QoQ) trend charts
  - Goal distribution pie charts
  - Completion heatmaps
  - Manager effectiveness bar charts
  - Organizational overview highlighting top & bottom performers

---

## 💻 Tech Stack

### Frontend
- **Framework**: React.js + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Server State & Caching**: TanStack React Query
- **Routing**: React Router v6 (Role-based protected routes)
- **Charts**: Recharts
- **Forms & Validation**: React Hook Form + Zod
- **Icons & Notifications**: lucide-react, react-hot-toast
- **Hosting**: Vercel (Free Tier)

### Backend
- **Environment**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ODM (Atlas Free Tier)
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs
- **Task Scheduling**: node-cron
- **Email Service**: Nodemailer
- **Report Generation**: ExcelJS
- **AI Integration**: Groq AI SDK with LLaMA 3.3-70b
- **Security & Logging**: helmet, morgan
- **Hosting**: Render (Free Tier)

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Groq API key (Get a free key at [console.groq.com](https://console.groq.com))
- Git

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env and fill in: MONGO_URI, JWT_SECRET, GROQ_API_KEY, and EMAIL credentials

# 4. Seed the database (Creates demo data + default users)
npm run seed

# 5. Start the development server
npm run dev
```

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Ensure VITE_API_URL is set to your backend URL (e.g., http://localhost:5000/api)

# 4. Start the Vite development server
npm run dev
```

### 🔑 Demo Credentials (Post-Seeding)
Use these credentials to explore the different role perspectives:

| Role | Email | Password | Notes |
|---|---|---|---|
| **Admin** | admin@performix.com | Password@123 | Full system access |
| **Manager** | rahul@performix.com | Password@123 | L1 Manager |
| **Manager** | priya@performix.com | Password@123 | L1 Manager |
| **Employee** | amit@performix.com | Password@123 | Has approved goals + Q1/Q2 check-ins |
| **Employee** | sneha@performix.com | Password@123 | Has submitted goals (pending approval) |
| **Employee** | rohan@performix.com | Password@123 | Has draft goals |

---

## 📁 Project Structure

```text
backend/
├── src/
│   ├── config/        # Database and service configurations
│   ├── controllers/   # Business logic
│   ├── middleware/    # Auth, error handling, validation
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express API routes
│   ├── utils/         # Helper functions, emailers
│   └── cron/          # Scheduled escalation jobs

frontend/
├── src/
│   ├── api/           # Axios interceptors and API wrappers
│   ├── components/
│   │   ├── ui/        # Reusable shadcn/ui components
│   │   ├── employee/  # Employee-specific components
│   │   ├── manager/   # Manager-specific components
│   │   ├── admin/     # Admin-specific components
│   │   ├── shared/    # Shared components (Navbars, Stat cards)
│   │   └── layouts/   # Page layout wrappers
│   ├── pages/
│   │   ├── employee/  # Employee views
│   │   ├── manager/   # Manager views
│   │   └── admin/     # Admin views
│   ├── store/         # Zustand global stores
│   └── utils/         # Frontend helpers and constants
```

---

## 🏆 Evaluation Criteria Highlight

Performix is engineered to meet and exceed hackathon evaluation criteria:
1. **Functionality**: A fully complete end-to-end flow for Employees, Managers, and Admins.
2. **Adherence to BRD**: 100% implementation of all Phase 1 and Phase 2 requirements.
3. **User Friendliness**: Intuitive, role-based dashboards with clear error handling and a polished UI.
4. **Bug-Free Execution**: Strict frontend (Zod) and backend (Mongoose) validation handling all edge cases.
5. **Bonus Features**: Implementation of Groq AI suggestions, automated escalation engine, comprehensive analytics, and email notifications.
6. **Cost Optimisation**: Zero-cost architecture utilizing MongoDB Atlas free tier, Render, Vercel, Groq free tier, efficient React Query caching, and optimized MongoDB aggregation pipelines.

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Goals
- `POST /api/goals`
- `GET /api/goals`
- `PUT /api/goals/:id`
- `DELETE /api/goals/:id`
- `GET /api/goals/my`
- `GET /api/goals/team`
- `POST /api/goals/submit`
- `PUT /api/goals/approve/:id`
- `PUT /api/goals/return/:id`

### Check-ins
- `POST /api/checkins`
- `GET /api/checkins/my`
- `GET /api/checkins/team`
- `PUT /api/checkins/:id/comment`
- `GET /api/checkins/summary/:employeeId`

### Shared Goals
- `POST /api/shared-goals/push`
- `GET /api/shared-goals`

### Reports & Analytics
- `GET /api/reports/achievement`
- `GET /api/reports/achievement/export`
- `GET /api/reports/achievement/export-csv`
- `GET /api/reports/manager-effectiveness`
- `GET /api/analytics/org-overview`
- `GET /api/analytics/employee-trends`
- `GET /api/analytics/team-trends`
- `GET /api/analytics/completion-heatmap`
- `GET /api/analytics/goal-distribution`
- `GET /api/analytics/manager-effectiveness`

### Admin Management
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `PUT /api/admin/goals/:id/unlock`
- `GET /api/admin/cycle-status`
- `GET /api/admin/completion-dashboard`
- `GET /api/admin/cycle-config`
- `PUT /api/admin/cycle-config`

### Escalation Engine
- `GET /api/escalation/rules`
- `POST /api/escalation/rules`
- `PUT /api/escalation/rules/:id`
- `DELETE /api/escalation/rules/:id`
- `GET /api/escalation/logs`
- `POST /api/escalation/run`

### Auditing
- `GET /api/audit`
- `GET /api/audit/export`

### AI Features
- `POST /api/ai/suggest-goal`

---

## 🤝 Contributing

Contributions are welcome! Since this is a hackathon project, feel free to fork the repository, make your tweaks, and submit a pull request. 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

