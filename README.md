# Ovijog (অভিযোগ)

A **Smart Complaint & Civic Issue Reporting App** for Bangladesh — built as a Mobile App Development (MAD) course project.

Ovijog lets citizens report local civic issues (broken roads, electricity outages, water/sewage problems, safety hazards, etc.) with photos and location, track the status of their reports, and lets designated admins update and resolve them.

## Features

- **Authentication** — Email/password signup & login (Supabase Auth)
- **Feed** — Browse all reported complaints with category and status
- **Report** — Submit a new complaint with title, category, description, location, and photo (camera or gallery)
- **Complaint Detail** — Full complaint view with reporter info, photo, and status
- **Profile** — View personal stats (total, pending, resolved reports) and log out
- **Admin Panel** — Role-restricted screen for updating complaint status (Pending → In Progress → Resolved)
- **Delete** — Complaint owners and admins can delete complaints

## Tech Stack

- **Frontend:** React Native + Expo Router (TypeScript)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Build:** EAS Build (Expo Application Services) for standalone Android APK

## Project Structure

```
app/
  (auth)/         → Login & Signup screens
  (tabs)/         → Feed, Report, Profile (bottom tab navigation)
  complaint/[id]  → Complaint detail screen
  admin/          → Admin panel (status management)
contexts/
  AuthContext.tsx → Global auth/session state
lib/
  supabase.js     → Supabase client setup
```

## Database Schema

Two core tables in Supabase:

- **profiles** — id, full_name, email, role (`user` / `admin`)
- **complaints** — id, user_id, title, description, category, status, location_text, photo_url, created_at

Row Level Security (RLS) policies ensure:
- Anyone can view complaints
- Users can only create/update/delete their own complaints
- Admins can update or delete any complaint

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run the SQL schema (see `/supabase` if included) in your Supabase project's SQL Editor.
4. Start the development server:
   ```bash
   npx expo start
   ```

## Build

To generate a standalone Android APK:
```bash
eas build --platform android --profile preview
```

## Author

Fahim Uddin — Mobile App Development (MAD) course project