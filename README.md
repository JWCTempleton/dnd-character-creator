# D&D Character Creator - Frontend

This is the frontend for the D&D Character Creator application, a modern, single-page application built with React, Vite, and TypeScript. It provides a stylish, interactive, and polished user interface for creating, managing, and viewing Dungeons & Dragons 5th Edition characters.

**Live Demo:** [https://dnd-character-creator-iota.vercel.app/](https://dnd-character-creator-iota.vercel.app/)

## Key Features

- **Interactive Character Creation:** A multi-panel interface guides users through selecting a race, class, background, and alignment.
- **Dynamic Stat Allocation:** Users can choose between two methods for ability scores: using the "Standard Array" or rolling dice ("4d6 drop lowest"), with a fully interactive UI for assigning the resulting scores.
- **Detailed Selections:** Users can select skill proficiencies and level 0 spells (cantrips) based on their chosen class, with built-in logic to enforce the game's rules on selection limits.
- **User Authentication:** Seamless registration and login flow with client-side validation for a smooth user experience.
- **Full CRUD for Characters:** Users can create, view, edit, and delete their saved characters.
- **Dynamic Character Sheet:** A detailed character sheet view that displays all of a character's saved data, including calculated stats like ability modifiers, armor class, and initiative.
- **Character Leveling:** A "Level Up" system that increases a character's level and HP, and dynamically displays newly gained class features.

## Tech Stack

- **Framework:** React
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **API Client:** Axios
- **Routing:** React Router
- **Form Management:** React Hook Form & Zod
- **Notifications:** React Hot Toast

## Design Philosophy & Architecture

This application was designed to be both functional and aesthetically pleasing, using modern development patterns and a focus on user experience.

### 1. Component-Based Architecture

The UI is broken down into reusable components organized into a logical folder structure:

- `/src/pages`: Top-level components that correspond to a page/route (e.g., `DashboardPage`, `CharacterSheetPage`).
- `/src/components`: Reusable UI elements that are used across multiple pages (e.g., `Header`, `AuthModal`, `LevelUpModal`).
- `/src/services`: Contains the API interaction logic, including a centralized `apiClient` (Axios instance) configured to handle credentials and base URLs.
- `/src/lib`: Houses helper functions and validation schemas, separating pure logic from UI components.

### 2. Modern Styling with Tailwind CSS

Styling is handled exclusively with Tailwind CSS. This utility-first approach allows for rapid development while maintaining a consistent design system. The design emphasizes:

- **Visual Hierarchy:** Using font size, weight, and color to guide the user's attention.
- **Whitespace:** Generous padding and gaps create a clean, uncluttered, and readable layout.
- **Interactivity:** Subtle transitions, hover effects, and focus states are used on all interactive elements to make the application feel responsive and alive.

### 3. User Experience (UX) Enhancements

Significant effort was put into polishing the user experience:
- **Toast Notifications:** All `alert()` popups have been replaced with `react-hot-toast` notifications for a non-blocking and professional user feedback system.

## Upcoming changes
- **Client-Side Validation:** The login/registration forms use `react-hook-form` and `Zod` to provide instant, inline validation feedback, preventing bad data from being sent to the server.
- **Skeleton Loading States:** When data is being fetched, the UI displays skeleton placeholders that mimic the final layout, which improves perceived performance.

## Getting Started (Local Development)

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/dnd-character-creator.git
    cd dnd-character-creator
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Create a `.env.local` file** in the root directory. This file is for local environment variables and is not committed to Git.

    ```
    # The URL of your local backend server
    VITE_API_URL=http://localhost:5001
    ```

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173`.

## Deployment

This application is deployed on **Vercel**. Vercel automatically detects the Vite configuration and builds the project. The only required step is to set the `VITE_API_URL` environment variable in the Vercel project settings to point to the live URL of the deployed backend API.
