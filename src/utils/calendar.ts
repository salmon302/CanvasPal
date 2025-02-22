import * as ICAL from 'ical.js';
import type { CalendarEvent } from '../types/models';

export const parseICalFeed = (icalData: string): CalendarEvent[] => {
  const jCalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jCalData);
  const vevents = comp.getAllSubcomponents('vevent');
  
  return vevents.map(vevent => {
    const event = new ICAL.Event(vevent);
    return {
      title: event.summary,
      dueDate: event.startDate.toJSDate(),
      courseId: event.uid.split('_')[0],
      assignmentId: event.uid.split('_')[1]
    };
  });
};

export type { CalendarEvent };
