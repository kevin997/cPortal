# Database Setup Complete ✅

**Date**: January 14, 2026
**Status**: Database ready and seeded

---

## What Was Done

### 1. Fixed Prisma Warning ✅
- Removed deprecated `prisma` configuration from package.json
- Updated to use direct script command instead
- Added `db:seed` and `db:push` scripts for manual control

### 2. Database Migration Complete ✅
- Used `prisma db push` to create all tables
- Database schema successfully applied to MySQL
- All tables created:
  - `users` - Authentication and user management
  - `students` - Student records
  - `bootcamp_sessions` - Bootcamp sessions
  - `enrollments` - Student enrollments

### 3. Database Seeded ✅
Test data created:

**Users Created:**
- **agent@cportal.com** / password123 (Sales Agent)
- **rep@cportal.com** / password123 (Sales Representative)
- **manager@cportal.com** / password123 (Sales Manager)

**Bootcamp Sessions Created:**
1. **Web Development Bootcamp Q1 2024**
   - Dates: March 1 - May 31, 2024
   - Capacity: 30 students
   - Location: Douala, Cameroon

2. **Data Science Bootcamp Q2 2024**
   - Dates: April 15 - July 15, 2024
   - Capacity: 25 students
   - Location: Yaoundé, Cameroon

---

## Database Connection

**Connection Details:**
- **Host**: localhost
- **Port**: 3308
- **Database**: cportal_db
- **User**: root (for migrations) / cportal_user (for app)
- **Password**: cPortal2024!Secure

**Connection String:**
```
mysql://root:cPortal2024!Secure@localhost:3308/cportal_db
```

---

## Available Commands

### Database Commands
```bash
# Push schema changes (no migration files)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with test data
npm run db:seed

# Generate Prisma Client
npm run db:generate

# Reset database (drop all data)
npm run db:reset
```

### Application Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Next Steps

### 🚀 Start the Application

```bash
npm run dev
```

Then open: **http://localhost:3000**

### 🔑 Login

Use any of the test accounts:
- agent@cportal.com / password123
- rep@cportal.com / password123
- manager@cportal.com / password123

### ✨ What You Can Do

1. **View Dashboard** - See KPIs and bootcamp capacity
2. **Manage Students** - Add, edit, search, delete students
3. **Manage Bootcamps** - Create and manage bootcamp sessions
4. **Enroll Students** - Enroll students in bootcamps with capacity tracking

---

## Database Schema

### Tables Created

```sql
-- Users (Authentication)
CREATE TABLE users (
  id VARCHAR(191) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  name VARCHAR(191) NOT NULL,
  password VARCHAR(191) NOT NULL,
  role VARCHAR(191) DEFAULT 'sales_agent',
  avatar VARCHAR(191),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE students (
  id VARCHAR(191) PRIMARY KEY,
  fullName VARCHAR(191) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  phoneNumber VARCHAR(191) NOT NULL,
  neighbourhood VARCHAR(191),
  address VARCHAR(191),
  dateOfBirth DATETIME,
  gender VARCHAR(191),
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdById VARCHAR(191) NOT NULL,
  FOREIGN KEY (createdById) REFERENCES users(id)
);

-- Bootcamp Sessions
CREATE TABLE bootcamp_sessions (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  description TEXT,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  targetCapacity INT NOT NULL,
  currentCapacity INT DEFAULT 0,
  status VARCHAR(191) DEFAULT 'upcoming',
  location VARCHAR(191),
  imageUrl VARCHAR(191),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Enrollments
CREATE TABLE enrollments (
  id VARCHAR(191) PRIMARY KEY,
  studentId VARCHAR(191) NOT NULL,
  bootcampSessionId VARCHAR(191) NOT NULL,
  enrolledById VARCHAR(191) NOT NULL,
  enrollmentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(191) DEFAULT 'enrolled',
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (bootcampSessionId) REFERENCES bootcamp_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (enrolledById) REFERENCES users(id),
  UNIQUE KEY unique_enrollment (studentId, bootcampSessionId)
);
```

---

## Verification

### Check Database

```bash
# Open Prisma Studio
npm run db:studio
```

Or connect directly:
```bash
docker exec -it csl-mysql-cportal mysql -u root -p'cPortal2024!Secure' cportal_db
```

### Verify Data

```sql
-- Check users
SELECT id, email, name, role FROM users;

-- Check bootcamps
SELECT id, name, targetCapacity, currentCapacity, status FROM bootcamp_sessions;

-- Check students count
SELECT COUNT(*) FROM students;

-- Check enrollments count
SELECT COUNT(*) FROM enrollments;
```

---

## Troubleshooting

### Database Not Accessible

If you get connection errors:

```bash
# Check if database is running
docker ps | grep csl-mysql-cportal

# If not running, start it
cd /home/atlas/Projects/CSL/CSL-DevOps
docker-compose up -d mysql-cportal

# Wait 10-15 seconds for MySQL to initialize
```

### Prisma Client Errors

If you get Prisma Client errors:

```bash
# Regenerate Prisma Client
npm run db:generate

# Or reinstall dependencies
rm -rf node_modules
npm install
```

### Need to Reset Database

```bash
# This will drop all data and recreate tables
npm run db:reset
```

---

## Success! 🎉

Your database is ready! You can now:

1. ✅ Start the development server
2. ✅ Login with test accounts
3. ✅ Create students
4. ✅ Create bootcamp sessions
5. ✅ Enroll students
6. ✅ View real-time dashboard

**Have fun building with cPortal!** 🚀
