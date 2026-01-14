# cPortal - Bootcamp Management Portal

A Progressive Web App (PWA) for managing bootcamp student enrollments and onboarding.

## Features

- **Student Management**: CRUD operations for student records
- **Bootcamp Sessions**: Create and manage bootcamp sessions with capacity tracking
- **Enrollment System**: Enroll students into bootcamp sessions
- **Dashboard**: Real-time KPIs and capacity monitoring
- **Mobile-First**: Optimized for mobile devices with PWA support
- **Authentication**: Secure login with role-based access (Sales Agent, Sales Rep, Sales Manager)

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Database**: MySQL 8.0
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Styling**: TailwindCSS 4 with Radix UI components
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for database)

### Installation

1. **Clone the repository**
   ```bash
   cd /home/atlas/Projects/CSL/cPortal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the following:
   ```env
   DATABASE_URL="mysql://cportal_user:cPortal2024!Secure@localhost:3308/cportal_db"
   NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Start the MySQL database**
   ```bash
   cd /home/atlas/Projects/CSL/CSL-DevOps
   docker-compose up -d mysql-cportal
   ```

5. **Run database migrations**
   ```bash
   cd /home/atlas/Projects/CSL/cPortal
   npx prisma migrate dev --name init
   ```

6. **Seed the database (optional)**
   Create a seed script to add a test user:
   ```bash
   npx prisma db seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open the app**
   Navigate to `http://localhost:3000`

## Database Schema

### User
- Authentication and user management
- Roles: sales_agent, sales_rep, sales_manager

### Student
- Full student information
- Contact details
- Neighbourhood tracking

### BootcampSession
- Session details and schedules
- Capacity tracking
- Status management

### Enrollment
- Links students to bootcamp sessions
- Enrollment status tracking
- Notes and metadata

## API Routes

### Students
- `GET /api/students` - List all students (with search)
- `POST /api/students` - Create a new student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Bootcamp Sessions
- `GET /api/bootcamps` - List all bootcamp sessions
- `POST /api/bootcamps` - Create a new bootcamp session
- `GET /api/bootcamps/[id]` - Get bootcamp details
- `PUT /api/bootcamps/[id]` - Update bootcamp session
- `DELETE /api/bootcamps/[id]` - Delete bootcamp session

### Enrollments
- `GET /api/enrollments` - List all enrollments
- `POST /api/enrollments` - Create a new enrollment
- `PUT /api/enrollments/[id]` - Update enrollment status
- `DELETE /api/enrollments/[id]` - Remove enrollment

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma Client
npm run db:reset         # Reset database

# Linting
npm run lint
```

## Production Deployment

1. Set up production environment variables
2. Run migrations: `npm run db:migrate:prod`
3. Build the application: `npm run build`
4. Start the server: `npm start`

## PWA Features

- **Offline Support**: Core functionality available offline
- **Install to Home Screen**: Add to mobile home screen
- **App-like Experience**: Full-screen mobile app experience
- **Push Notifications**: (Future enhancement)

## Mobile Navigation

The app features a bottom tab navigation optimized for mobile:
- Dashboard
- Students
- Bootcamps
- Enrollments

## License

Proprietary - CSL Internal Use Only
