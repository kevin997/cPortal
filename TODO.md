# cPortal - Remaining Implementation Tasks

## ✅ Completed

- [x] Project structure and configuration
- [x] MySQL database in docker-compose.yml
- [x] Prisma schema with all models
- [x] Authentication system with NextAuth
- [x] PWA manifest and configuration
- [x] Mobile-responsive navigation
- [x] Dashboard with KPIs
- [x] Student CRUD API routes
- [x] Base UI components (Button, Card, Input, Label, Dialog)
- [x] Seed script with test data
- [x] Setup documentation

## 🚧 To Be Implemented

### 1. Students Management Pages

**Priority: HIGH**

Create the following pages:

#### `/src/app/dashboard/students/page.tsx`
- List all students in a mobile-friendly card layout
- Search functionality
- Add new student button
- Click to view/edit student details
- Delete student action

#### `/src/components/StudentForm.tsx`
- Reusable form component for creating/editing students
- Fields: fullName, email, phoneNumber, neighbourhood, address, dateOfBirth, gender, notes
- Form validation
- Success/error handling

**Reference implementation pattern:**
```tsx
"use client";
import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// ... implement students list with search, CRUD operations
```

### 2. Bootcamp Sessions Management

**Priority: HIGH**

#### API Routes

Create `/src/app/api/bootcamps/route.ts`:
- GET: List all bootcamp sessions (with filters)
- POST: Create new bootcamp session

Create `/src/app/api/bootcamps/[id]/route.ts`:
- GET: Get single bootcamp details
- PUT: Update bootcamp
- DELETE: Delete bootcamp

#### Pages

Create `/src/app/dashboard/bootcamps/page.tsx`:
- List all bootcamp sessions
- Display capacity progress bars
- Status badges (upcoming, ongoing, completed, cancelled)
- Create/Edit/Delete actions

Create `/src/components/BootcampForm.tsx`:
- Form for creating/editing bootcamp sessions
- Fields: name, description, startDate, endDate, targetCapacity, location, imageUrl
- Date pickers
- Image upload (optional)

### 3. Enrollment System

**Priority: HIGH**

#### API Routes

Create `/src/app/api/enrollments/route.ts`:
- GET: List all enrollments (with filters)
- POST: Create new enrollment

Create `/src/app/api/enrollments/[id]/route.ts`:
- GET: Get enrollment details
- PUT: Update enrollment status
- DELETE: Remove enrollment

#### Pages

Create `/src/app/dashboard/enrollments/page.tsx`:
- Quick enrollment interface
- Select student (searchable dropdown)
- Select bootcamp session (with available capacity info)
- Add notes
- One-click enrollment

Create `/src/components/EnrollmentForm.tsx`:
- Student selector with search
- Bootcamp session selector
- Display current capacity
- Enrollment notes
- Status selector (enrolled, completed, dropped, transferred)

### 4. Additional UI Components

**Priority: MEDIUM**

Create the following UI components in `/src/components/ui/`:

#### `select.tsx`
- Radix UI Select component
- Needed for dropdowns in forms

#### `textarea.tsx`
- Styled textarea component
- For notes fields

#### `badge.tsx`
- Status badges
- For bootcamp status, enrollment status

#### `toast.tsx`
- Toast notifications
- For success/error messages

**You can copy these from the Coody project at:**
- `/home/atlas/Projects/CSL/Coody/src/components/ui/`

### 5. Enhanced Features (Optional)

**Priority: LOW**

- **Search & Filters**: Advanced filtering on all list pages
- **Bulk Operations**: Select multiple items for batch actions
- **Export Data**: Export student/enrollment data to CSV
- **Analytics**: More detailed charts and insights
- **Notifications**: Toast notifications for all actions
- **Loading States**: Skeleton loaders for better UX
- **Error Boundaries**: Graceful error handling
- **Offline Support**: Better offline functionality

### 6. Testing & Quality

**Priority: MEDIUM**

- Test all CRUD operations
- Test mobile responsiveness on actual devices
- Test PWA installation
- Test authentication flows
- Test form validations
- Test edge cases (duplicate emails, capacity limits, etc.)

## Implementation Order

Recommended order of implementation:

1. **Students Pages** (1-2 hours)
   - StudentForm component
   - Students list page
   - Test CRUD operations

2. **Bootcamp Sessions** (1-2 hours)
   - API routes
   - BootcampForm component
   - Bootcamps list page
   - Test CRUD operations

3. **Enrollment System** (1-2 hours)
   - API routes
   - EnrollmentForm component
   - Enrollments page
   - Test enrollment flow

4. **Additional UI Components** (30 minutes)
   - Copy from Coody project
   - Integrate into forms

5. **Testing & Polish** (1 hour)
   - End-to-end testing
   - Mobile device testing
   - Bug fixes and refinements

## Quick Commands

```bash
# Start development
cd /home/atlas/Projects/CSL/cPortal
npm run dev

# View database
npm run db:studio

# Reset database
npm run db:reset

# Create new migration
npx prisma migrate dev --name <name>
```

## Notes

- All API routes follow RESTful conventions
- Mobile-first design with Tailwind responsive classes
- Use optimistic UI updates for better UX
- Follow the patterns established in the dashboard and auth pages
- Refer to Coody project for UI component implementations
