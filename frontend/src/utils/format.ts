export function formatRupees(paise: number, forceDecimals: boolean = false): string {
  const rupees = paise / 100;
  if (forceDecimals || rupees % 1 !== 0) {
    return `₹${rupees.toFixed(2)}`;
  }
  return `₹${rupees}`;
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function generateOrderNumber(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD${randomNum}`;
}
