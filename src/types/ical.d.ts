declare module 'ical.js' {
    interface ICalComponent {
        getAllSubcomponents(type: string): ICalComponent[];
        getFirstPropertyValue(prop: string): string | { toJSDate(): Date };
    }
    
    interface ICalEvent {
        readonly summary: string;
        readonly startDate: { toJSDate(): Date };
        readonly uid: string;
    }
    
    export class Component implements ICalComponent {
        constructor(jCal: any);
        getAllSubcomponents(type: string): Component[];
        getFirstPropertyValue(prop: string): string | { toJSDate(): Date };
    }

    export class Event implements ICalEvent {
        constructor(component: Component);
        readonly summary: string;
        readonly startDate: { toJSDate(): Date };
        readonly uid: string;
    }

    export function parse(input: string): any;
}