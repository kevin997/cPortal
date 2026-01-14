# 🚀 Get Started with cPortal

Welcome to **cPortal** - your bootcamp management PWA!

## 📋 What You Have

A fully structured Progressive Web App with:

✅ **Complete Project Setup**
- Next.js 16 + React 19
- TypeScript configuration
- TailwindCSS 4 with modern design system
- Prisma ORM with MySQL

✅ **Database Infrastructure**
- MySQL 8.0 container in docker-compose
- Prisma schema with all relationships
- Migration system ready
- Seed script with test data

✅ **Authentication System**
- NextAuth.js v5 with JWT
- Secure password hashing
- Protected routes
- Role-based access

✅ **Core Features Implemented**
- Dashboard with real-time KPIs
- Mobile-first navigation
- Student CRUD API routes
- PWA configuration

✅ **Documentation**
- Setup guide
- Architecture documentation
- API documentation
- TODO list for remaining features

## 🎯 Quick Start (2 Minutes)

The fastest way to get started:

```bash
cd /home/atlas/Projects/CSL/cPortal
./quickstart.sh
```

This script will:
1. Create .env with generated secrets
2. Install all dependencies
3. Start the database
4. Run migrations
5. Seed test data

Then start the dev server:
```bash
npm run dev
```

Open `http://localhost:3000` and login with:
- **Email**: agent@cportal.com
- **Password**: password123

## 📱 What You Can Do Right Now

1. **Login**: Use any of the test accounts
2. **View Dashboard**: See KPIs and bootcamp capacity
3. **Navigate**: Use the bottom navigation tabs
4. **Test API**: All student CRUD endpoints work

## 🔨 What's Left to Build

See `TODO.md` for detailed tasks. Summary:

### High Priority
1. **Students Pages** (~1-2 hours)
   - List page with search
   - Create/Edit forms
   - Delete functionality

2. **Bootcamps Pages** (~1-2 hours)
   - API routes
   - List and management pages
   - Create/Edit forms

3. **Enrollments** (~1-2 hours)
   - API routes
   - Quick enrollment interface
   - Status management

### Medium Priority
- Additional UI components (Select, Textarea, Badge, Toast)
- Form validations
- Error handling
- Loading states

### Low Priority
- Advanced features
- Analytics
- Bulk operations
- Export functionality

## 📚 Key Files to Know

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Next.js config
- `.env` - Environment variables

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Seed data
- `src/lib/prisma.ts` - Prisma client

### Authentication
- `src/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - Auth endpoints
- `src/app/login/page.tsx` - Login page

### Core Pages
- `src/app/dashboard/page.tsx` - Dashboard
- `src/app/dashboard/layout.tsx` - Protected layout
- `src/components/MobileNav.tsx` - Navigation

### API Routes
- `src/app/api/students/route.ts` - Students CRUD
- `src/app/api/students/[id]/route.ts` - Single student

### UI Components
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/dialog.tsx`

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma Client
npm run db:reset         # Reset database
npx prisma db seed       # Re-run seed

# Code Quality
npm run lint             # Lint code
```

## 📖 Documentation Map

- **GET_STARTED.md** ← You are here! (Quick overview)
- **SETUP.md** - Detailed setup instructions
- **README.md** - Full project documentation
- **TODO.md** - Remaining implementation tasks
- **ARCHITECTURE.md** - System architecture deep dive
- **PROJECT_SUMMARY.md** - Complete project overview

## 💡 Development Tips

### 1. Database Viewing
Open Prisma Studio to see your data:
```bash
npm run db:studio
```

### 2. API Testing
Use curl or Thunder Client to test APIs:
```bash
# Get all students
curl http://localhost:3000/api/students

# Create a student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@example.com","phoneNumber":"123456789"}'
```

### 3. Mobile Testing
- Use Chrome DevTools mobile emulator
- Or access from your phone via local network
- Or use ngrok for external testing

### 4. Component Reuse
Copy UI components from Coody project:
```bash
cp /home/atlas/Projects/CSL/Coody/src/components/ui/select.tsx \
   /home/atlas/Projects/CSL/cPortal/src/components/ui/
```

## 🎨 Design System

### Colors
- **Primary**: Blue/Purple (#6366f1)
- **Success**: Green
- **Destructive**: Red
- **Muted**: Gray

### Components
- Rounded corners (0.75rem)
- Consistent spacing (1rem base)
- Mobile-first responsive
- Touch-friendly (min 44px)

### Patterns
- Cards for content grouping
- Dialogs for forms
- Buttons for actions
- Badges for status

## 🔐 Test Accounts

All passwords: `password123`

- **agent@cportal.com** - Sales Agent
- **rep@cportal.com** - Sales Representative
- **manager@cportal.com** - Sales Manager

## 📦 Project Structure

```
cPortal/
├── src/
│   ├── app/              # Pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── prisma/               # Database schema
├── public/               # Static files
├── docs/                 # Documentation
└── config files          # Various configs
```

## 🚨 Troubleshooting

### Database won't start
```bash
docker-compose -f /home/atlas/Projects/CSL/CSL-DevOps/docker-compose.yml \
  up -d mysql-cportal
```

### Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

### Prisma errors
```bash
npx prisma generate
npx prisma migrate dev
```

### Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Next Steps

1. **Run the quickstart script** to set everything up
2. **Explore the dashboard** to see what's working
3. **Read TODO.md** to see what to build next
4. **Start with students pages** (easiest first task)
5. **Copy UI components** from Coody as needed

## 💬 Need Help?

- Check **SETUP.md** for detailed setup
- See **ARCHITECTURE.md** for system design
- Read **TODO.md** for implementation guide
- View **PROJECT_SUMMARY.md** for complete overview

## 🎉 You're Ready!

Everything is set up and ready to go. Just run the quickstart script and start coding!

```bash
./quickstart.sh
npm run dev
```

Happy coding! 🚀
