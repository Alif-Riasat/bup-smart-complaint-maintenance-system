export function priorityLabel(priority: string) {
  if (priority === 'Emergency' || priority === 'Urgent') return 'Urgent';
  if (priority === 'Medium' || priority === 'Normal') return 'Normal';
  return priority;
}

export function priorityClass(priority: string) {
  const label = priorityLabel(priority);
  if (label === 'Urgent') return 'bg-red-50 text-red-700 border border-red-200';
  if (label === 'High') return 'bg-orange-50 text-orange-800 border border-orange-200';
  if (label === 'Normal') return 'bg-zinc-100 text-zinc-800 border border-zinc-200';
  return 'bg-zinc-50 text-zinc-600 border border-zinc-200';
}
