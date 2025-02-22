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
