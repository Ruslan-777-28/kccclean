# **App Name**: ConnectNow

## Core Features:

- User Authentication: Allow users to sign up, log in, and log out securely using email/password authentication.
- Profile Creation and Viewing: Enable users to create and view public profiles.  Profile pages display user information.
- Call Initiation: Allow users to initiate a call with another user. This creates a new call document in Firestore and redirects to the call page.
- Incoming Call Listening: Listen for incoming calls where the current user is the callee and the call status is 'ringing'. Display a modal to accept or decline the call.
- Call Acceptance: Allow users to accept an incoming call, updating the call status in Firestore and redirecting to the call page.
- Call Status Updates: Update the status of a call in Firestore (e.g., 'ringing', 'accepted', 'ended').
- Call Page Placeholder: Display a placeholder component on the call page, including caller/callee info and call status, and prepare the container for future Daily.co integration.

## Style Guidelines:

- Primary color: Deep Blue (#1A237E) to convey trust and professionalism. 
- Background color: Light Blue (#E3F2FD) - a desaturated version of the primary color, offering a calm backdrop.
- Accent color: Purple (#9C27B0) for interactive elements and highlights, providing a distinctive contrast.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, and 'Inter' (sans-serif) for body text. This pairing provides a clean, modern look with good readability.
- Use simple, modern icons from a library like Feather or Font Awesome to represent actions and status.
- Employ a responsive layout using TailwindCSS grid and flexbox to ensure a seamless experience across devices.
- Incorporate subtle animations for transitions and loading states to enhance the user experience without being distracting.