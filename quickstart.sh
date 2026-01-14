#!/bin/bash

# cPortal Quick Start Script
# This script sets up the cPortal development environment

set -e

echo "🚀 cPortal Quick Start"
echo "====================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the cPortal root directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env

    # Generate NextAuth secret
    SECRET=$(openssl rand -base64 32)

    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-here-use-openssl-to-generate/$SECRET/" .env
    else
        # Linux
        sed -i "s/your-secret-here-use-openssl-to-generate/$SECRET/" .env
    fi

    echo "✅ .env file created with generated secret"
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if database is running
echo ""
echo "🗄️  Checking database..."
if docker ps | grep -q csl-mysql-cportal; then
    echo "✅ Database is running"
else
    echo "⚠️  Database is not running"
    echo "Starting database..."
    cd /home/atlas/Projects/CSL/CSL-DevOps
    docker-compose up -d mysql-cportal
    cd -
    echo "⏳ Waiting for database to be ready (15 seconds)..."
    sleep 15
    echo "✅ Database started"
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations completed"

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"

# Seed database
echo ""
echo "🌱 Seeding database..."
npx prisma db seed
echo "✅ Database seeded"

echo ""
echo "✅ Setup complete!"
echo ""
echo "You can now start the development server with:"
echo "  npm run dev"
echo ""
echo "Test accounts:"
echo "  - agent@cportal.com / password123"
echo "  - rep@cportal.com / password123"
echo "  - manager@cportal.com / password123"
echo ""
echo "Access the app at: http://localhost:3000"
echo ""
echo "View database at: npm run db:studio"
echo ""
