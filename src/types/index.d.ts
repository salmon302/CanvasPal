declare module 'ical.js' {
  export class Component {
    constructor(jCal: any);
    getAllSubcomponents(type: string): Component[];
    getFirstPropertyValue(prop: string): string | { toJSDate(): Date };
  }
  
  export class Event {
    constructor(component: Component);
    readonly summary: string;
    readonly startDate: { toJSDate(): Date };
    readonly uid: string;
  }
  
  export function parse(input: string): any;
}

export interface CalendarEvent {
  title: string;
  dueDate: Date;
  courseId: string;
  assignmentId: string;
}

export interface PrioritySettings {
  dueDateWeight: number;
  gradeWeight: number;
  difficultyWeight: number;
}
