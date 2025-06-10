
# CommuniVerse App Blueprint

This document outlines the features and functionalities implemented in the CommuniVerse application.

## Core Application Features

### 1. Online Status Management
- **Feature**: Users can toggle their online/offline status.
- **Implementation**:
    - An "Go Online" / "Go Offline" button is available on the main dashboard.
    - Status is visually indicated on the dashboard.
    - Uses `OnlineStatusButton` component which interacts with `userService` and `useAuth` for managing and displaying status.

### 2. Chat Room Access ("Room Doors")
- **Feature**: The dashboard displays available chat rooms, each showing the current number of users.
- **Implementation**:
    - The main dashboard (`src/app/page.tsx`) fetches and displays room information using `RoomCard` components.
    - Each `RoomCard` shows room name, description, image (placeholder), current user count, and room capacity.
    - Provides a button to enter the selected room.

### 3. Public Chat Rooms
- **Feature**: Users can join public chat rooms (up to 15 users) and communicate via text messages.
- **Implementation**:
    - Dedicated chat room pages (`/chat/[roomId]`).
    - `ChatClientPage` component handles the chat interface, including:
        - Displaying messages with sender's avatar and name.
        - Input field for sending new messages.
        - List of current participants in the room.
    - `chatService` manages sending and retrieving messages (currently mock).
    - `roomService` manages room data, capacity, and participant lists (currently mock).

### 4. "Ring Friends" Feature
- **Feature**: If a user is alone or with few people in a room, a "Ring Friends" button is displayed to notionally invite others.
- **Implementation**:
    - A "Ring Friends" button appears in the `ChatClientPage` participant list area under specific conditions (e.g., user is alone).
    - Clicking the button currently triggers a toast notification (mock implementation).

### 5. Coin Gifting
- **Feature**: Users can gift coins to other users within a chat room.
- **Implementation**:
    - A "Gift" icon/button is available next to each participant (except the current user) in the `ChatClientPage` participant list.
    - Clicking this button currently triggers a toast notification (mock implementation). Actual coin tracking and balance updates are not yet fully implemented in the backend/services.

### 6. Coin Store
- **Feature**: A store where users can purchase coin packages.
- **Implementation**:
    - A dedicated store page (`/store`) displays various coin packages.
    - `CoinPackageCard` components show package details (name, coins, price, image, description).
    - A "Buy Now" button for each package currently triggers a toast notification (mock purchase flow).

## Authentication & User Management

### 1. Firebase Authentication
- **Feature**: Secure user authentication using Firebase.
- **Implementation**:
    - Email and password based sign-up and login.
    - Firebase client app initialized in `src/lib/firebase/clientApp.ts`.
    - `useAuth` hook and `AuthProvider` (`src/hooks/useAuth.tsx`) manage auth state across the app.
    - Login page (`/login`) with `LoginForm` component.
    - Site header dynamically updates to show login/logout buttons and user info.

### 2. User Profiles
- **Feature**: Users have profiles where they can manage their information.
- **Implementation**:
    - Profile page (`/profile`) accessible from the site header.
    - `ProfileForm` component allows users to view and edit their name, bio, and avatar URL.
    - Profile data is managed by `userService` (currently mock), linked to Firebase UID.

## Styling and UI

- **Colors**:
    - Primary: Vivid purple (#9D4EDD)
    - Background: Light gray (#E9ECEF)
    - Accent: Reddish-purple (#E0AED0)
    - Implemented via CSS variables in `src/app/globals.css` for ShadCN theme.
- **Font**: 'PT Sans' for body and headlines.
- **Layout**:
    - Responsive `AppShell` with a sticky header and a fixed footer.
    - Consistent use of ShadCN UI components for a modern look and feel.
    - Clean and intuitive layout.

## Data Management (Mock Services)

- **User Service (`userService.ts`)**: Manages user profile data (creation, retrieval, updates), linked with Firebase UIDs.
- **Room Service (`roomService.ts`)**: Manages chat room data (creation, retrieval), participant lists, and user counts.
- **Chat Service (`chatService.ts`)**: Manages chat messages within rooms, including sending and fetching.

## Chat Archiving
- **Feature**: Chat history for rooms is reset nightly, and previous chats are archived.
- **Implementation (Simulated)**:
    - `chatService.ts` includes:
        - `archiveRoomChatHistory(roomId)`: Simulates archiving messages for a room and clearing current messages.
        - `getArchivedRoomChat(archiveId)`: Fetches an archived chat.
    - The actual nightly execution of this process would require a scheduled backend job (e.g., Cron job with a Cloud Function), which is outside the current frontend scope but the service logic is present.

## Technical Stack
- Next.js (App Router)
- React
- TypeScript
- ShadCN UI components
- Tailwind CSS
- Firebase (for Authentication)
- Genkit (for AI, not yet utilized for core app features)
- Lucide Icons

This blueprint reflects the current state of the application. Further development can build upon these established features and services.
