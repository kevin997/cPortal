# cPortal Project Summary

## Overview

**cPortal** is a Progressive Web App (PWA) designed for internal use by sales teams to manage bootcamp student enrollments and onboarding. The application is mobile-first, built with modern web technologies, and provides a native app-like experience.

## Project Details

- **Name**: cPortal
- **Type**: Progressive Web App (PWA)
- **Target Users**: Sales Agents, Sales Representatives, Sales Managers
- **Primary Use Case**: Bootcamp student onboarding and enrollment management
- **Platform**: Web (optimized for mobile devices)

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.7
- **React**: 19.2.0
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4 with custom design system
- **UI Components**: Radix UI primitives
- **Animations**: tw-animate-css
- **PWA**: next-pwa

### Backend
- **API**: Next.js App Router API Routes
- **Authentication**: NextAuth.js v5 (beta)
- **Password Hashing**: bcryptjs

### Database
- **Database**: MySQL 8.0
- **ORM**: Prisma 6.19.0
- **Host**: Docker container (csl-mysql-cportal)
- **Port**: 3308
- **Connection**: localhost:3308

### State Management
- **Client State**: React Hooks (useState, useEffect)
- **Server State**: Server Components + API Routes
- **Forms**: Controlled components

## Database Schema

### Tables

1. **users**
   - Authentication and user management
   - Roles: sales_agent, sales_rep, sales_manager
   - Tracks created students and enrollments

2. **students**
   - Full student information
   - Contact details (email, phone, address)
   - Neighbourhood tracking
   - Optional demographics (DOB, gender)
   - Notes field for additional information

3. **bootcamp_sessions**
   - Session details (name, description, dates)
   - Capacity tracking (target vs. current)
   - Status management (upcoming, ongoing, completed, cancelled)
   - Location information

4. **enrollments**
   - Links students to bootcamp sessions
   - Tracks enrollment status
   - Maintains enrollment metadata (date, notes)
   - References enrolling user

## Application Structure

```
cPortal/
├── src/
│   ├── app/
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # NextAuth endpoints
│   │   │   └── students/             # Student CRUD
│   │   ├── dashboard/                # Protected routes
│   │   │   ├── page.tsx              # Dashboard with KPIs
│   │   │   ├── students/             # Student management
│   │   │   ├── bootcamps/            # Bootcamp management
│   │   │   └── enrollments/          # Enrollment management
│   │   ├── login/                    # Auth pages
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home (redirects)
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   ├── providers/                # Context providers
│   │   └── MobileNav.tsx             # Bottom navigation
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client
│   │   └── utils.ts                  # Utility functions
│   ├── types/                        # TypeScript types
│   └── auth.ts                       # NextAuth configuration
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Seed data
├── public/                           # Static assets
│   └── manifest.json                 # PWA manifest
└── Configuration files
```

## Key Features Implemented

### ✅ Completed

1. **Authentication System**
   - Secure login with NextAuth
   - JWT-based sessions
   - Role-based access control
   - Protected routes

2. **Database Setup**
   - MySQL container in docker-compose
   - Prisma schema with relationships
   - Migration system
   - Seed script with test data

3. **Mobile Navigation**
   - Bottom tab navigation
   - Fixed top header
   - Responsive design
   - Safe area insets for iOS

4. **Dashboard**
   - Real-time KPIs
   - Total students count
   - Active bootcamps count
   - Enrollment statistics
   - Enrollment rate percentage
   - Bootcamp capacity visualization

5. **Student API**
   - GET /api/students (list with search)
   - POST /api/students (create)
   - GET /api/students/[id] (details)
   - PUT /api/students/[id] (update)
   - DELETE /api/students/[id] (remove)

6. **PWA Configuration**
   - Manifest file
   - Service worker setup
   - Install prompt support
   - Offline capability

### 🚧 To Be Completed

See `TODO.md` for detailed implementation tasks:

1. **Student Management Pages**
   - List page with search
   - Create/Edit forms
   - Delete confirmation

2. **Bootcamp Sessions**
   - API routes
   - Management pages
   - Create/Edit forms

3. **Enrollment System**
   - API routes
   - Quick enrollment interface
   - Status management

4. **Additional UI Components**
   - Select dropdown
   - Textarea
   - Badge
   - Toast notifications

## Design System

### Colors
- **Primary**: Blue/Purple (`oklch(0.55 0.25 264)`)
- **Background**: Light gray (`oklch(0.98 0 0)`)
- **Card**: White (`oklch(1 0 0)`)
- **Muted**: Light gray (`oklch(0.95 0 0)`)
- **Destructive**: Red (`oklch(0.58 0.24 27)`)

### Typography
- **Sans**: Geist Sans
- **Mono**: Geist Mono

### Spacing
- Mobile-first with responsive breakpoints
- Safe area insets for notched devices
- Consistent padding and margins

### Components
- Rounded corners (0.75rem radius)
- Shadow system for depth
- Focus rings for accessibility
- Smooth transitions

## User Roles

1. **Sales Agent** (`sales_agent`)
   - Create and manage students
   - Enroll students in bootcamps
   - View dashboard

2. **Sales Representative** (`sales_rep`)
   - All Sales Agent permissions
   - Additional reporting access

3. **Sales Manager** (`sales_manager`)
   - All permissions
   - Manage bootcamp sessions
   - Access to advanced analytics

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start database
cd /home/atlas/Projects/CSL/CSL-DevOps && docker-compose up -d mysql-cportal

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start dev server
npm run dev
```

### Database Management

```bash
# View database
npm run db:studio

# Create migration
npx prisma migrate dev --name <name>

# Generate Prisma Client
npm run db:generate

# Reset database
npm run db:reset
```

## Test Accounts

After running the seed script:

- **Sales Agent**: agent@cportal.com / password123
- **Sales Rep**: rep@cportal.com / password123
- **Sales Manager**: manager@cportal.com / password123

## Mobile Features

### PWA Capabilities
- Install to home screen
- Offline functionality
- App-like full-screen mode
- Native appearance

### Mobile Optimization
- Touch-friendly tap targets (min 44px)
- Bottom navigation for thumb reach
- Swipe gestures support
- Optimized for 360px-428px widths
- Safe area insets for iOS notch

### Performance
- Server-side rendering
- Optimistic UI updates
- Lazy loading
- Image optimization

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get session

### Students
- `GET /api/students?search=<query>` - List students
- `POST /api/students` - Create student
- `GET /api/students/[id]` - Get student
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Bootcamps (To be implemented)
- `GET /api/bootcamps` - List bootcamps
- `POST /api/bootcamps` - Create bootcamp
- `GET /api/bootcamps/[id]` - Get bootcamp
- `PUT /api/bootcamps/[id]` - Update bootcamp
- `DELETE /api/bootcamps/[id]` - Delete bootcamp

### Enrollments (To be implemented)
- `GET /api/enrollments` - List enrollments
- `POST /api/enrollments` - Create enrollment
- `GET /api/enrollments/[id]` - Get enrollment
- `PUT /api/enrollments/[id]` - Update enrollment
- `DELETE /api/enrollments/[id]` - Delete enrollment

## Deployment

### Prerequisites
- Node.js 20+
- MySQL 8.0
- Docker (for database)

### Environment Variables
```env
DATABASE_URL="mysql://cportal_user:cPortal2024!Secure@localhost:3308/cportal_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generated-secret>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production Build
```bash
npm run build
npm start
```

## Security Considerations

- **Authentication**: JWT tokens with secure secret
- **Passwords**: Hashed with bcryptjs (10 rounds)
- **Sessions**: HTTP-only cookies
- **API Routes**: Protected with session checks
- **Database**: Parameterized queries via Prisma
- **Validation**: Server-side validation on all inputs

## Future Enhancements

1. **Push Notifications**: Notify agents of enrollments
2. **Advanced Analytics**: Charts and reports
3. **Bulk Operations**: Import/export CSV
4. **Document Upload**: Student documents
5. **Calendar View**: Bootcamp schedule visualization
6. **Real-time Updates**: WebSocket integration
7. **Payment Tracking**: Integration with payment system
8. **Email Notifications**: Automated emails
9. **Multi-language Support**: i18n

## Support & Documentation

- **Setup Guide**: See `SETUP.md`
- **README**: See `README.md`
- **Todo List**: See `TODO.md`
- **API Documentation**: See API routes inline comments

## Project Status

**Current Status**: Core infrastructure complete, CRUD operations in progress

**Completion**: ~70%

**Next Steps**:
1. Complete student management pages
2. Implement bootcamp sessions CRUD
3. Implement enrollment system
4. Testing and polish

**Estimated Time to MVP**: 4-6 hours of focused development

## License

Proprietary - CSL Internal Use Only

---

**Created**: January 2026
**Last Updated**: January 14, 2026
**Version**: 0.1.0
