# Fix the daily tracker time selection

**Features**
- [x] Replace the broken manual time entry with a reliable time selector for start and end times.
- [x] Let the user pick hours and minutes more easily instead of typing freeform text.
- [x] Keep the existing AM/PM behavior so saved work hours still calculate correctly.
- [x] Show a clear fallback on devices where the time picker behaves differently.
- [x] Prevent invalid time formats from being entered and show a simple message if a time is missing.

**Design**
- [x] Keep the current daily tracker layout, but make the time fields feel more tappable and obvious.
- [x] Use clean time cards with strong contrast and clear selected states.
- [x] Make the interaction feel mobile-native, with a simple tap-to-pick flow.

**Pages / Screens**
- [x] Daily tracker screen: fix the start and end time controls so they open and update properly.
- [x] No other screens need visual changes unless the saved time display needs to match the new selector.