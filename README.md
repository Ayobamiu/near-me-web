# NearMe Web MVP

A web-based proximity social app built with Next.js and TailwindCSS.

## Features

- **QR Code Scanning**: Scan QR codes to join places
- **Location-based Grouping**: Users within 100m radius are grouped together
- **Real-time Updates**: See who's nearby in real-time
- **LinkedIn-inspired Design**: Clean, professional interface
- **Responsive Layout**: Works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: TailwindCSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **QR Scanning**: @yudiel/react-qr-scanner
- **Geolocation**: Browser Geolocation API

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:
   Create `.env.local` with your Firebase config:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Flow

### **First User (Place Creator):**

1. **Scan QR Code**: Use camera to scan QR or enter place code
2. **Allow Location**: Grant location access
3. **Create Place**: Location becomes the "origin" for this place
4. **Join Place**: Automatically added as first member

### **Subsequent Users:**

1. **Scan QR Code**: Use camera to scan QR or enter place code
2. **Allow Location**: Grant location access
3. **Check Proximity**: App checks if within 100m of place origin
4. **Join Place**: If close enough, join the place group
5. **View Members**: See all nearby users in real-time

### **Key Features:**

- **No URL Location Params**: Clean, shareable links
- **First User Sets Origin**: Their location becomes the meeting point
- **Real-time Proximity**: Live updates of who's nearby
- **Geospatial Queries**: Efficient proximity-based user discovery

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page (QR scan/enter)
│   ├── place/[id]/page.tsx   # Place page (group members)
│   └── globals.css           # Global styles
├── components/
│   └── QRScanner.tsx         # QR code scanner component
├── lib/
│   ├── firebase.ts           # Firebase configuration
│   └── geolocation.ts        # Location utilities
└── types/
    └── index.ts              # TypeScript type definitions
```

## Development Status

✅ **Completed:**

- Next.js project setup with TailwindCSS
- QR code scanning interface
- Place page with LinkedIn-style layout
- Geolocation API integration
- Proximity-based grouping logic
- Responsive design

🚧 **In Progress:**

- Firebase integration
- Real-time updates
- User authentication

📋 **Todo:**

- Connection features
- Chat functionality
- User profiles
- Real-time database integration
