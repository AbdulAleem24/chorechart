# 🧹 ChoreChart - Roommate Chore Tracking App

A mobile-first web application for tracking chores between roommates Aleem and Daniyal.

## Features

- **Persistent Authentication**: Stay logged in on your device
- **Calendar-based Chore Tracking**: Visual grid showing all days of the month
- **Alternating Chore Assignments**: Automatic rotation for daily chores
- **Trash Tally**: Track who takes out the trash with a running tally
- **Comments & Attachments**: Add notes and photos/videos to chores
- **Special Features for Daniyal**: Tutorial and "Good Boy" popup 😉

## Chore Schedule

| Chore | Frequency | Assignment |
|-------|-----------|------------|
| Sweeping & Mopping | Daily | Alternating (Aleem odd days, Daniyal even days) |
| Kitchen Cleaning | Daily | Alternating (Daniyal odd days, Aleem even days) |
| Veranda Cleaning | Weekly | Alternating weeks |
| Toilet & Bathroom | Weekly | Alternating weeks |
| Trash | As needed | Tracked by tally |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- React 18 + TypeScript
- Vite (with Rolldown)
- Tailwind CSS
- LocalStorage for persistence

## Color Legend

- 🔵 **Blue (A)**: Aleem's assigned chore
- 🟡 **Yellow (D)**: Daniyal's assigned chore  
- 🟢 **Green (✓)**: Completed chore
