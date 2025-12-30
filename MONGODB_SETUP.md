# MongoDB Setup Guide

## Local MongoDB Setup

1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Follow installation instructions for your OS

2. **Start MongoDB Service**
   \`\`\`bash
   # On macOS with Homebrew
   brew services start mongodb-community

   # On Windows
   net start MongoDB

   # On Linux
   sudo systemctl start mongod
   \`\`\`

3. **Set Environment Variable**
   \`\`\`bash
   DATABASE_URL="mongodb://localhost:27017/travel_buddy"
   \`\`\`

## MongoDB Atlas (Cloud) Setup

1. **Create Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for free account

2. **Create Cluster**
   - Choose free tier (M0)
   - Select region closest to you
   - Create cluster

3. **Setup Database Access**
   - Go to Database Access
   - Add new database user
   - Choose password authentication
   - Give read/write access

4. **Setup Network Access**
   - Go to Network Access
   - Add IP Address
   - For development: Add 0.0.0.0/0 (allow from anywhere)
   - For production: Add specific IP addresses

5. **Get Connection String**
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace <password> with your database user password

6. **Set Environment Variable**
   \`\`\`bash
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/travel_buddy?retryWrites=true&w=majority"
   \`\`\`

## Setup Commands

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Generate Prisma Client**
   \`\`\`bash
   npm run db:generate
   \`\`\`

3. **Push Schema to Database**
   \`\`\`bash
   npm run db:push
   \`\`\`

4. **Seed Database (Optional)**
   \`\`\`bash
   npm run db:seed
   \`\`\`

5. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

## Prisma Studio

To view and edit your data:
\`\`\`bash
npm run db:studio
\`\`\`

This will open Prisma Studio at http://localhost:5555
