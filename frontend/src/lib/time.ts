/** "agora", "há 12 s", "há 3 min", "há 2 h" — para mostrar a idade da cotação. */
export function relativeTime(date: Date | string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(date).getTime()) / 1000));
  if (seconds < 5) return 'agora';
  if (seconds < 60) return `há ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.floor(minutes / 60)} h`;
}
