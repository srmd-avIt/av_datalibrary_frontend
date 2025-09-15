// Simple date formatting utility to replace date-fns
export function format(date: Date, formatStr: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  switch (formatStr) {
    case 'PPP':
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    case 'PP':
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    case 'P':
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    case 'yyyy-MM-dd':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    case 'yyyy-MM':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'yyyy':
      return `${date.getFullYear()}`;
    case "yyyy-'W'ww":
      const week = Math.ceil(date.getDate() / 7);
      return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    case 'EEEE, MMMM do, yyyy':
      return `${daysFull[date.getDay()]}, ${monthsFull[date.getMonth()]} ${date.getDate()}${getOrdinalSuffix(date.getDate())}, ${date.getFullYear()}`;
    case 'MMMM yyyy':
      return `${monthsFull[date.getMonth()]} ${date.getFullYear()}`;
    case 'MMM do':
      return `${months[date.getMonth()]} ${date.getDate()}${getOrdinalSuffix(date.getDate())}`;
    case 'MMM do, yyyy':
      return `${months[date.getMonth()]} ${date.getDate()}${getOrdinalSuffix(date.getDate())}, ${date.getFullYear()}`;
    case "MMM do, yyyy 'at' h:mm a":
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${months[date.getMonth()]} ${date.getDate()}${getOrdinalSuffix(date.getDate())}, ${date.getFullYear()} at ${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    default:
      return date.toLocaleDateString();
  }
}

export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function eachDayOfInterval(interval: { start: Date; end: Date }): Date[] {
  const days: Date[] = [];
  const currentDate = new Date(interval.start);
  
  while (currentDate <= interval.end) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}