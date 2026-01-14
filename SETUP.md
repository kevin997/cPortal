# cPortal Setup Guide

## Quick Start

Follow these steps to get cPortal running on your local machine.

### Step 1: Install Dependencies

```bash
cd /home/atlas/Projects/CSL/cPortal
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Generate a secret for NextAuth:
```bash
openssl rand -base64 32
```

Update `.env` with the generated secret:
```env
DATABASE_URL="mysql://cportal_user:cPortal2024!Secure@localhost:3308/cportal_db"
NEXTAUTH_SECRET="<your-generated-secret-here>"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Start Database

```bash
cd /home/atlas/Projects/CSL/CSL-DevOps
docker-compose up -d mysql-cportal
```

Wait for the database to be ready (about 10-15 seconds).

### Step 4: Run Migrations

```bash
cd /home/atlas/Projects/CSL/cPortal
npx prisma migrate dev --name init
```

### Step 5: Seed Database

```bash
npx prisma db seed
```

This creates three test users:
- **Sales Agent**: agent@cportal.com / password123
- **Sales Rep**: rep@cportal.com / password123
- **Sales Manager**: manager@cportal.com / password123

And two sample bootcamp sessions.

### Step 6: Start Development Server

```bash
npm run dev
```

### Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

Login with one of the test users above.

## Database Management

### View Database with Prisma Studio

```bash
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555` where you can view and manage your data.

### Reset Database

If you need to start fresh:

```bash
npm run db:reset
```

This will:
1. Drop the database
2. Recreate it
3. Run all migrations
4. Run the seed script

## Testing on Mobile

### Option 1: Local Network

1. Find your local IP address:
   ```bash
   ip addr show | grep inet
   ```

2. Update `.env`:
   ```env
   NEXTAUTH_URL="http://YOUR_LOCAL_IP:3000"
   NEXT_PUBLIC_APP_URL="http://YOUR_LOCAL_IP:3000"
   ```

3. Restart the dev server

4. Access from your mobile device:
   ```
   http://YOUR_LOCAL_IP:3000
   ```

### Option 2: ngrok (for external testing)

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start ngrok:
   ```bash
   ngrok http 3000
   ```

3. Update `.env` with the ngrok URL:
   ```env
   NEXTAUTH_URL="https://your-ngrok-url.ngrok.io"
   NEXT_PUBLIC_APP_URL="https://your-ngrok-url.ngrok.io"
   ```

4. Access from any device using the ngrok URL

## Installing as PWA

### On iOS (Safari)

1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### On Android (Chrome)

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen"
4. Tap "Add"

The app will now appear on your home screen like a native app!

## Common Issues

### Database Connection Error

If you get a database connection error:

1. Check if the MySQL container is running:
   ```bash
   docker ps | grep cportal
   ```

2. If not running, start it:
   ```bash
   cd /home/atlas/Projects/CSL/CSL-DevOps
   docker-compose up -d mysql-cportal
   ```

3. Wait 10-15 seconds for MySQL to initialize

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or run on a different port
npm run dev -- -p 3001
```

### NextAuth Secret Error

Make sure you generated a proper secret:

```bash
openssl rand -base64 32
```

And added it to your `.env` file.

## Next Steps

After setup, you can:

1. **Explore the Dashboard**: View KPIs and bootcamp capacity
2. **Add Students**: Navigate to Students tab and create new student records
3. **Create Bootcamps**: Set up new bootcamp sessions
4. **Enroll Students**: Link students to bootcamp sessions

## Production Deployment

For production deployment instructions, see the main README.md file.
