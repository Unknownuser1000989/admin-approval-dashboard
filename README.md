# React Auth Dashboard with Admin Approval

A premium Next.js dashboard featuring a robust authentication system with mandatory admin approval.

## Features
- **Premium Design**: Sleek, glassmorphism UI built with Vanilla CSS modules.
- **Admin Approval Flow**: New users are marked as `pending` and must be approved by an administrator before they can log in.
- **Role-Based Access**: Specialized dashboards for `admin` and `user` roles.
- **Secure Auth**: Powered by NextAuth.js with JWT sessions and Bcrypt password hashing.
- **Neon DB Integration**: High-performance serverless PostgreSQL storage.

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_neon_db_connection_string
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Migration
Install dependencies and push the schema to Neon:
```bash
npm install
npx drizzle-kit push
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Admin Account
The **first** user to sign up will automatically be granted the `admin` role and `approved` status. Subsequent users will be `user` role and `pending` status.

## Deployment on Vercel
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Add the environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) in the Vercel dashboard.
4. Vercel will automatically build and deploy the application.
