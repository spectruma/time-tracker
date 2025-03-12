# Time Tracker Frontend

A modern web application for tracking working hours, managing leave requests, and monitoring time balances.

## Project Overview

Time Tracker is a comprehensive time management solution designed for businesses to track employee working hours, manage leave requests, and ensure compliance with working time regulations. The application provides both user and admin interfaces with role-based access control.

## Technology Stack

- **React 19**: Modern UI library for building component-based interfaces
- **Redux Toolkit**: State management with simplified Redux configuration
- **Redux Toolkit Query**: Data fetching and caching with automatic state management
- **React Router DOM v7**: Client-side routing and navigation
- **Material UI v6**: Component library for consistent and responsive UI
- **date-fns**: Date manipulation library
- **Recharts**: Charting library for data visualization
- **Vite**: Fast build tool and development server
- **TypeScript**: Type checking for improved code quality

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/             # Authentication-related components
│   ├── layout/           # Layout components (MainLayout, SideNav, TopBar)
│   └── utils/            # Utility components
├── pages/                # Page-level components
│   ├── Admin/            # Admin pages
│   ├── Auth/             # Authentication pages
│   ├── Dashboard/        # Dashboard pages and widgets
│   ├── LeaveManagement/  # Leave management pages
│   ├── TimeTracking/     # Time tracking pages
│   └── ...               # Other feature pages
├── store/                # Redux store configuration
│   ├── services/         # Redux Toolkit Query API services
│   └── slices/           # Redux slices for state management
├── App.jsx               # Main application component with routing
├── config.js             # Application configuration
├── index.jsx             # Application entry point
└── index.css             # Global styles
```

## Key Features

### User Features

- **Time Tracking**: Start and stop time tracking with real-time updates
- **Dashboard**: Overview of time balance, leave balance, and working hours
- **Leave Management**: Request and manage leave with different types (vacation, sick leave, special permit)
- **Reports**: View and export time and leave reports
- **Profile Management**: Update personal information and preferences

### Admin Features

- **User Management**: Create, edit, and manage user accounts
- **Approval Workflow**: Approve time entries and leave requests
- **Compliance Monitoring**: Track compliance with working time regulations
- **System Settings**: Configure system-wide settings for time tracking and leave management

## Component Architecture

The application follows a component-based architecture with a clear separation of concerns:

### Core Components

- **MainLayout**: Main layout component that wraps all authenticated pages
- **SideNav**: Navigation sidebar with links to different sections
- **TopBar**: Top navigation bar with user information and actions
- **ProtectedRoute**: Route wrapper that handles authentication and authorization
- **RefreshTokenHandler**: Background component that handles JWT token refresh

### Dashboard Components

- **Dashboard**: Main dashboard page with date filtering and widgets
- **TimeBalanceCard**: Displays total hours and overtime
- **LeaveBalanceCard**: Displays leave balances for different leave types
- **TimeTrackerCard**: Interactive widget for starting and stopping time tracking
- **WorkingHoursChart**: Bar chart displaying daily working hours
- **OvertimeWidget**: Displays overtime analysis and status

### Admin Components

- **AdminDashboard**: Overview of system status and pending approvals
- **UserManagement**: Interface for managing user accounts
- **AdminSettings**: Configuration interface for system-wide settings

## State Management

The application uses Redux Toolkit and Redux Toolkit Query for state management:

### Redux Toolkit Query

- **API Services**: The application defines several API services using Redux Toolkit Query's `createApi`:
  - `analyticsApi`: Endpoints for dashboard data, reports, and compliance checks
  - `timeEntriesApi`: Endpoints for time entry CRUD operations
  - `leaveRequestsApi`: Endpoints for leave request CRUD operations
  - `usersApi`: Endpoints for user management operations
  - `authApi`: Endpoints for authentication operations

- **Auto-generated Hooks**: Redux Toolkit Query automatically generates React hooks for each endpoint, which are used in components to fetch data and trigger mutations.

### Redux State

- **Authentication State**: Manages user authentication state, including tokens and user information
- **UI State**: Manages UI-related state, such as loading indicators and error messages

## API Integration

The frontend integrates with a RESTful backend API:

- **Base URL**: Configured in `src/config.js` as `API_URL`
- **Authentication**: JWT-based authentication with access and refresh tokens
- **Token Refresh**: Automatic token refresh mechanism implemented in `RefreshTokenHandler`
- **Error Handling**: Consistent error handling across API calls

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/time-tracker.git
   cd time-tracker/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     REACT_APP_API_URL=http://localhost:8000/api/v1
     ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run serve` - Preview the production build locally

## Deployment

### Build for Production

```bash
npm run build
```

This will create a `dist` directory with the production-ready build.

### Deployment Options

- **Static Hosting**: Deploy the contents of the `dist` directory to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)
- **Docker**: Use the provided Dockerfile to build and deploy as a containerized application
- **CI/CD**: Set up continuous integration and deployment using GitHub Actions, GitLab CI, or similar services

## Backend Integration

This frontend application is designed to work with the Time Tracker Backend API. Make sure the backend is running and accessible at the URL specified in the `.env` file.

## License

[MIT License](LICENSE)
