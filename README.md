# AtomQuest Portal

AtomQuest Portal is a modern, responsive Goal Setting & Tracking application. It provides a centralized platform for employees, managers, and administrators to define, monitor, and manage performance goals throughout the fiscal year.

## Features

* **Role-Based Access:** Distinct workflows for Employees, Managers, and HR Administrators.
* **Goal Management:** Employees can create, edit, and submit their quarterly/annual goals.
* **Manager Approvals & Check-ins:** Managers can review team goals, approve them, or send them back for rework. Periodic check-ins allow managers to track and log team progress.
* **Admin Dashboard:** Comprehensive oversight with analytics, completion tracking, audit logging, and the ability to push shared goals across the organization.
* **Escalation Engine:** Automated tracking for delayed goal submissions and missing check-ins.
* **Modern Interface:** Built with a sleek, light-grey aesthetic, gold accents, smooth transitions, and fully responsive design using the Inter font.

## Technology Stack

* **Framework:** React 19
* **Build Tool:** Vite
* **Styling:** Tailwind CSS v4 (with PostCSS)

## Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* npm (comes with Node.js)

### Installation

1. Clone or download the repository to your local machine.
2. Navigate to the project directory:
   ```bash
   cd atomquest-app
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

Start the local Vite development server:
```bash
npm run dev
```
By default, the application will be accessible at `http://localhost:5173/`. 

### Building for Production

To create an optimized production build:
```bash
npm run build
```
The bundled files will be generated in the `dist` folder. You can preview the production build locally with:
```bash
npm run preview
```

## Usage

The application includes several pre-configured demo accounts to easily explore different role perspectives:

* **Employees:** Priya Sharma, Rohan Mehta, Aisha Khan
* **Managers:** Vikram Nair, Sunita Rao
* **HR Admin:** HR Admin

Simply select one of these profiles from the Login Screen to sign in and interact with the application.
