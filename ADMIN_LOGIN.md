# Admin Login Credentials

## 🔐 Default Admin Account

**Email:** `admin@gmail.com`  
**Password:** `Ashish@1927`

## 📋 Login Instructions

1. Navigate to: `http://localhost:3000/login`
2. Enter email: `admin@gmail.com`
3. Enter password: `Ashish@1927`
4. Click "Sign in"
5. You will be automatically redirected to the Admin Dashboard at `/admin/dashboard`

## ✅ Setup Complete

### What Has Been Configured:

1. **User Model Updated** - Added `username` field to support username-based login
2. **Passport Strategy Modified** - Now accepts both username OR email for login
3. **Admin User Created** - Default admin account is automatically initialized on server start
4. **Login Form Updated** - Changed to accept "Username or Email" instead of just email
5. **Auto-Initialization** - Admin user is created automatically when server starts (if not exists)

### Additional Scripts:

- **Seed Admin Manually**: `npm run seed-admin`
- **Start Server**: `npm start` or `npm run dev`

### Database Info:

- **Admin Email**: `admin@smc.gov.in`
- **Role**: `admin`
- **Name**: `SMC Administrator`

### Role-Based Redirects:

After login, users are redirected based on their role:
- `admin` → `/admin/dashboard` (SMC Command Center)
- `hospital` → `/hospital/dashboard`
- `citizen` → `/citizen/dashboard`

## 🔄 Password Reset

If you need to reset the admin password, run:
```bash
npm run seed-admin
```

This will update the password to `Ashish@1927` if the admin already exists.

## 🚀 Quick Start

```bash
# Start the server
npm start

# Or with auto-reload
npm run dev
```

Then visit: http://localhost:3000/login

---

**Last Updated:** February 8, 2026
