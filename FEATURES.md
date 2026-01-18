# ChoreChart - Feature Documentation

## Overview
ChoreChart is a mobile-first web application for tracking chores between two roommates: Aleem and Daniyal.

---

## Existing Features (v1.0)

### 1. Authentication System
- **Simple Login**: Users select their name (Aleem or Daniyal) to log in
- **Persistent Sessions**: Login state persists in localStorage - users stay logged in
- **Logout**: Users can log out from the header

### 2. Chore Calendar
- **Monthly View**: Displays all days of the current month in a grid
- **Color Coding**:
  - Blue (A) = Aleem's assigned chore
  - Yellow (D) = Daniyal's assigned chore
  - Green (✓) = Completed chore
- **Month Navigation**: Navigate between months with arrow buttons
- **Chore Types**:
  - Sweeping & Mopping
  - Kitchen Cleaning
  - Veranda Cleaning
  - Toilet & Bathroom

### 3. Trash Tally
- **Counter System**: Track how many times each person takes out trash
- **Monthly Reset**: Tally resets at the start of each month
- **Progress Bar**: Visual representation of who's doing more
- **Status Messages**: Warnings when one person falls behind

### 4. Comments & Attachments
- **Add Comments**: Click on a completed chore to add comments
- **Photo/Video Upload**: Attach images or videos as proof
- **Comment History**: View all comments on a chore

### 5. Today's Quick View
- **Today's Chores**: Shows chores assigned for today
- **Quick Complete**: Mark chores done without navigating the calendar

### 6. Special Features (Daniyal Only)
- **Tutorial Modal**: 8-step tutorial on first login
- **"Good Boy" Popup**: Random popup (1-2x per week) when completing chores

---

## Issues Identified (to be fixed)

### Issue 1: Incorrect Alternating Schedule
**Problem**: Currently chores alternate daily (Aleem odd days, Daniyal even days)
**Expected**: Chores should alternate every other occurrence
- Example: Aleem does Day 1, Daniyal does Day 3, Aleem does Day 5, etc.
- This means each person does the chore once, then skips a day

### Issue 2: Users Can Complete Others' Chores
**Problem**: Any logged-in user can mark any chore as complete
**Expected**: Users should only be able to complete their own assigned chores

### Issue 3: Cannot Uncheck Chores
**Problem**: Once a chore is marked complete, it cannot be undone
**Expected**: Users should be able to toggle chores on/off (in case of mistakes)

### Issue 4: Today's Chores Not Synced with Calendar
**Problem**: Marking done in Today's Chores doesn't properly reflect in calendar
**Expected**: Both views should stay in sync and update together

### Issue 5: Desktop Spacing
**Problem**: Calendar cells are cramped on desktop
**Expected**: More spacious layout on larger screens

### Issue 6: Missing Day Names
**Problem**: Only shows date numbers (1, 2, 3...)
**Expected**: Should also show day names (Mon, Tue, Wed...)

---

## New Features (v1.1)

### Feature 1: Strikes System
- **Purpose**: Hold roommates accountable for incomplete or poorly done chores
- **How it works**:
  - Any user can give the other person a "strike"
  - Strikes require a reason/comment
  - Strikes can include photo evidence
  - Strikes tally up throughout the month
  - Strike count visible in the UI at all times
- **UI Elements**:
  - Strike counter in header for each person
  - Strike button on completed chores (to challenge them)
  - Strike history view

### Feature 2: Improved Calendar Layout
- **Day Names**: Show day abbreviations (Sun, Mon, Tue, etc.)
- **Responsive Spacing**: Larger cells on desktop, compact on mobile
- **Today Highlight**: Clear indication of current day
- **Week Separators**: Visual distinction between weeks

### Feature 3: Permission-Based Actions
- **Own Chores Only**: Can only mark your own chores complete
- **View All**: Can view everyone's chores and status
- **Strike Anyone**: Can give strikes to the other person's completed chores

---

## Technical Implementation Details

### Data Storage
- All data stored in browser's localStorage
- Shared between both users on the same device
- Data structure:
  ```typescript
  {
    currentUser: User | null,
    chores: ChoreEntry[],
    trashTally: TrashTally,
    strikes: Strike[],
    tutorialShown: boolean,
    goodBoyShownDates: string[]
  }
  ```

### Chore Schedule Logic (Fixed)
- **Sweeping & Mopping**: Every other day, alternating between users
  - Days 1, 5, 9, 13, 17, 21, 25, 29: Aleem
  - Days 3, 7, 11, 15, 19, 23, 27, 31: Daniyal
- **Kitchen Cleaning**: Every other day, opposite pattern
  - Days 1, 5, 9, 13, 17, 21, 25, 29: Daniyal  
  - Days 3, 7, 11, 15, 19, 23, 27, 31: Aleem
- **Veranda Cleaning**: Once per week (Sundays)
  - Week 1 & 3: Aleem
  - Week 2 & 4: Daniyal
- **Toilet & Bathroom**: Once per week (Saturdays)
  - Week 1 & 3: Daniyal
  - Week 2 & 4: Aleem

---

## Recommended Future Features

### Priority 1 (High Value) - Recommended First
1. **Cloud Sync with Firebase/Supabase**
   - Both users can access from different devices
   - Real-time updates when one person completes a chore
   - Data backup and persistence
   - *Estimated effort: 1-2 days*

2. **Push Notifications**
   - Morning reminder of today's assigned chores
   - Alert when the other person completes a chore
   - Notification when you receive a strike
   - *Estimated effort: 4-6 hours*

3. **Monthly Summary & Statistics**
   - End-of-month report showing completion rates
   - Charts for chore distribution and strike counts
   - Compare month-over-month performance
   - *Estimated effort: 4-6 hours*

4. **Chore Photo Verification**
   - Optionally require a photo when marking chore complete
   - Auto-timestamp on photos
   - Reduces disputes and strikes
   - *Estimated effort: 2-4 hours*

### Priority 2 (Medium Value) - Quality of Life
5. **Chore Swap Requests**
   - Request to swap chores for a day ("Hey, can you do my sweeping today?")
   - Accept/decline workflow
   - Swap history tracking
   - *Estimated effort: 4-6 hours*

6. **Custom Chore Types**
   - Add new chores (e.g., "Buy groceries", "Pay bills")
   - Set custom frequencies (daily, weekly, monthly, one-time)
   - Assign to specific person or alternating
   - *Estimated effort: 4-6 hours*

7. **Chore Reminders**
   - Set specific times to be reminded
   - "Nag mode" - repeated reminders until completed
   - Location-based reminders (when you get home)
   - *Estimated effort: 2-4 hours*

8. **Notes/Instructions for Chores**
   - Add permanent notes to chore types
   - "Kitchen cleaning includes: dishes, counters, stove"
   - Helps ensure consistent standards
   - *Estimated effort: 1-2 hours*

### Priority 3 (Nice to Have) - Polish
9. **Dark Mode**
   - System preference detection
   - Manual toggle
   - *Estimated effort: 1-2 hours*

10. **Gamification**
    - Weekly streaks for completing all assigned chores
    - Monthly "Champion" badge for fewer strikes
    - Leaderboard (if expanded to more roommates)
    - *Estimated effort: 4-6 hours*

11. **PWA (Progressive Web App)**
    - Install on phone home screen
    - Offline support
    - Native app feel
    - *Estimated effort: 2-4 hours*

12. **Export/Import Data**
    - Download history as CSV/PDF
    - Backup and restore data
    - Share reports
    - *Estimated effort: 2-4 hours*

13. **Calendar Integration**
    - Sync with Google Calendar / Apple Calendar
    - See chores in your regular calendar app
    - *Estimated effort: 4-8 hours*

14. **Voice Commands**
    - "Hey Google, mark sweeping as done"
    - Smart home integration
    - *Estimated effort: 8+ hours*

---

## Known Limitations

1. **Single Device Sync**: Currently data is stored in localStorage, so both users must use the same browser on the same device. Cloud sync would solve this.

2. **No Offline Support**: App requires internet for initial load (could be improved with PWA).

3. **No Authentication Security**: Login is just name selection - no password. Fine for roommates sharing a device, but cloud sync would need proper auth.

4. **Image Storage**: Photos are stored as base64 in localStorage, which has size limits (~5MB). Cloud storage would be better for many photos.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 18, 2026 | Initial release with basic chore tracking |
| 1.1 | Jan 18, 2026 | Fixed alternating schedule, added strikes system, improved UI, day names, permission controls, undo chores |
