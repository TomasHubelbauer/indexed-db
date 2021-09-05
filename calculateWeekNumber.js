// https://weeknumber.com/how-to/javascript
export default function calculateWeekNumber() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1Date = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1Date.getTime()) / 86400000 - 3 + (week1Date.getDay() + 6) % 7) / 7);
}
