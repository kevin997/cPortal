# cPortal Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (PWA)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js 16 App Router                   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         React 19 Components                   │   │   │
│  │  │  ┌────────────────────────────────────────┐  │   │   │
│  │  │  │   Dashboard   │ Students │ Bootcamps  │  │   │   │
│  │  │  │   Enrollments │  Login   │   ...      │  │   │   │
│  │  │  └────────────────────────────────────────┘  │   │   │
│  │  │                                               │   │   │
│  │  │  ┌────────────────────────────────────────┐  │   │   │
│  │  │  │     Radix UI Components                │  │   │   │
│  │  │  │  Button, Card, Dialog, Input, etc.    │  │   │   │
│  │  │  └────────────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │           NextAuth.js v5                      │   │   │
│  │  │       JWT Session Management                 │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    HTTP/HTTPS (REST API)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     Backend (API Routes)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │    /api/auth/[...nextauth]    (NextAuth)    │   │   │
│  │  │    /api/students              (CRUD)        │   │   │
│  │  │    /api/bootcamps             (CRUD)        │   │   │
│  │  │    /api/enrollments           (CRUD)        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │          Prisma ORM Client                   │   │   │
│  │  │     Type-safe Database Access                │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
                      MySQL Protocol
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL 8.0)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Docker Container (csl-mysql-cportal)      │   │
│  │                                                       │   │
│  │    Tables:                                           │   │
│  │    ┌─────────────────────────────────────────┐     │   │
│  │    │  users                                  │     │   │
│  │    │  - id, email, name, password, role      │     │   │
│  │    └─────────────────────────────────────────┘     │   │
│  │    ┌─────────────────────────────────────────┐     │   │
│  │    │  students                               │     │   │
│  │    │  - id, fullName, email, phone, etc.     │     │   │
│  │    └─────────────────────────────────────────┘     │   │
│  │    ┌─────────────────────────────────────────┐     │   │
│  │    │  bootcamp_sessions                      │     │   │
│  │    │  - id, name, dates, capacity, status    │     │   │
│  │    └─────────────────────────────────────────┘     │   │
│  │    ┌─────────────────────────────────────────┐     │   │
│  │    │  enrollments                            │     │   │
│  │    │  - id, studentId, bootcampSessionId     │     │   │
│  │    └─────────────────────────────────────────┘     │   │
│  │                                                       │   │
│  │    Port: 3308                                        │   │
│  │    Network: csl-shared-network                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication Flow

```
User → Login Form → POST /api/auth/signin
                    ↓
              NextAuth.js validates credentials
                    ↓
              Prisma queries users table
                    ↓
              bcrypt.compare(password, hash)
                    ↓
              Generate JWT token
                    ↓
              Set HTTP-only cookie
                    ↓
              Redirect to /dashboard
```

### 2. Student CRUD Flow

#### Create Student
```
User → Student Form → POST /api/students
                      ↓
                Check authentication (session)
                      ↓
                Validate input data
                      ↓
                Prisma.student.create()
                      ↓
                MySQL INSERT INTO students
                      ↓
                Return student object
                      ↓
                Update UI optimistically
```

#### List Students
```
User → Students Page → GET /api/students?search=query
                       ↓
                 Check authentication
                       ↓
                 Prisma.student.findMany()
                       ↓
                 MySQL SELECT with WHERE/LIKE
                       ↓
                 Return students array
                       ↓
                 Render cards in UI
```

### 3. Enrollment Flow

```
User → Enrollment Form
       ↓
Select Student (from dropdown)
       ↓
Select Bootcamp (show available capacity)
       ↓
Add Notes
       ↓
Submit → POST /api/enrollments
         ↓
   Check authentication
         ↓
   Validate student & bootcamp exist
         ↓
   Check bootcamp capacity
         ↓
   Prisma.enrollment.create()
         ↓
   Update bootcamp currentCapacity
         ↓
   MySQL transaction (INSERT + UPDATE)
         ↓
   Return enrollment object
         ↓
   Show success notification
```

## Component Hierarchy

```
RootLayout
├── SessionProvider (NextAuth context)
└── Page Content
    ├── Login Page (public)
    │   └── LoginForm
    └── Dashboard Layout (protected)
        ├── MobileNav
        │   ├── TopBar (logo, logout)
        │   └── BottomNav (tabs)
        └── Dashboard Content
            ├── Dashboard Page
            │   ├── KPI Cards
            │   └── Capacity Chart
            ├── Students Page
            │   ├── Search Bar
            │   ├── Add Button
            │   ├── Student Cards
            │   └── Student Dialog
            │       └── StudentForm
            ├── Bootcamps Page
            │   ├── Bootcamp Cards
            │   └── Bootcamp Dialog
            │       └── BootcampForm
            └── Enrollments Page
                ├── Quick Enroll
                └── Enrollment Dialog
                    └── EnrollmentForm
```

## State Management

### Server State (Next.js)
- **Server Components**: Fetch data at build/request time
- **API Routes**: Handle mutations and complex queries
- **Revalidation**: Use Next.js revalidation for cache updates

### Client State (React)
- **useState**: Local component state (forms, modals, filters)
- **useEffect**: Side effects (data fetching, subscriptions)
- **Props**: Parent-child communication

### Session State (NextAuth)
- **useSession**: Access current user session
- **auth()**: Server-side session access
- **JWT**: Token-based authentication

## Security Architecture

### Authentication Layer
```
Request → Middleware (optional)
          ↓
API Route → auth() check
            ↓
      Session valid?
            ↓
       Yes → Process request
            ↓
       No → Return 401 Unauthorized
```

### Authorization Layer
```
Authenticated User → Check user.role
                     ↓
              Role permissions
                     ↓
          Allow/Deny resource access
```

### Data Validation
```
User Input → Client-side validation (HTML5)
             ↓
       API Route → Server-side validation
                   ↓
             Prisma schema validation
                   ↓
             MySQL constraints
```

## Database Relationships

```
users (1) ─────< (many) students
   │                        │
   │                        │
   │                   (many) ↓
   │                  enrollments
   │                        ↓ (many)
   │                        │
   └──────< (many) ─────────┘
                            │
                       (many) │
                            ↓
                   bootcamp_sessions (1)
```

### Key Relationships

1. **User → Students**: One-to-Many
   - User creates many students
   - Tracked via `createdById`

2. **User → Enrollments**: One-to-Many
   - User enrolls many students
   - Tracked via `enrolledById`

3. **Student → Enrollments**: One-to-Many
   - Student can enroll in many bootcamps
   - Tracked via `studentId`

4. **BootcampSession → Enrollments**: One-to-Many
   - Bootcamp has many enrolled students
   - Tracked via `bootcampSessionId`

## PWA Architecture

### Service Worker
```
User Request → Service Worker (if installed)
               ↓
         Cache available?
               ↓
          Yes → Return cached response
               ↓
          No → Fetch from network
               ↓
         Cache response
               ↓
         Return to user
```

### Offline Strategy
- **Network First**: API calls (students, bootcamps)
- **Cache First**: Static assets (JS, CSS, images)
- **Cache & Update**: Background sync for mutations

## Mobile Optimization

### Layout Strategy
```
Screen Size Detection
        ↓
  Mobile (< 768px)
        ↓
  ┌─────────────────┐
  │   Top Bar       │ (fixed)
  ├─────────────────┤
  │                 │
  │   Scrollable    │
  │   Content       │
  │                 │
  ├─────────────────┤
  │   Bottom Nav    │ (fixed)
  └─────────────────┘
```

### Touch Optimization
- Minimum tap target: 44x44px
- Swipe gestures for navigation
- Pull-to-refresh on lists
- Haptic feedback (if available)

## Performance Architecture

### Server-Side Rendering (SSR)
```
Request → Next.js Server
          ↓
    Fetch data (Prisma)
          ↓
    Render React to HTML
          ↓
    Send HTML to client
          ↓
    Hydrate on client
```

### Code Splitting
```
Route-based splitting
    ↓
Load only required JS for current page
    ↓
Prefetch on hover/viewport
    ↓
Lazy load modals and heavy components
```

## Deployment Architecture

### Development
```
Local Machine
    ↓
npm run dev (Next.js dev server)
    ↓
localhost:3000
    ↓
Docker MySQL (localhost:3308)
```

### Production
```
Build Server
    ↓
npm run build (Next.js build)
    ↓
Static optimization + SSR
    ↓
Docker container or VPS
    ↓
Production MySQL (cloud or on-prem)
    ↓
Reverse proxy (Nginx/Caddy)
    ↓
HTTPS with SSL certificate
```

## Monitoring & Observability

### Logging
- Server errors → Console/File
- API requests → Access logs
- Database queries → Prisma logs
- Client errors → Browser console

### Metrics (Future)
- Response times
- Error rates
- Database query performance
- User analytics

---

This architecture provides a solid foundation for a scalable, maintainable, and performant bootcamp management system.
