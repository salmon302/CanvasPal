import type { CalendarEvent, PrioritySettings } from '../types/models';

export const calculatePriority = (
    event: CalendarEvent, 
    settings: PrioritySettings
): number => {
    const daysUntilDue = (event.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const dueScore = Math.max(0, 10 - daysUntilDue);
    return dueScore * settings.dueDateWeight;
};

export type { PrioritySettings };
