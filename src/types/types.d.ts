declare module 'ical.js' {
  export class Component {
    constructor(jCal: any);
    getAllSubcomponents(type: string): Component[];
  }
  
  export class Event {
    constructor(component: Component);
    readonly summary: string;
    readonly startDate: {
      toJSDate(): Date;
    };
    readonly uid: string;
  }
  
  export function parse(input: string): any;
}

declare global {
  type CalendarEvent = {
    title: string;
    dueDate: Date;
    courseId: string;
    assignmentId: string;
  };

  type PrioritySettings = {
    dueDateWeight: number;
    gradeWeight: number;
    difficultyWeight: number;
  };
}
