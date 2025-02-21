declare module 'ical.js' {
	interface ICalProperty {
		toJSDate(): Date;
	}

	export class Component {
		constructor(jCal: any);
		getAllSubcomponents(name: string): Component[];
		getFirstPropertyValue(name: string): string | ICalProperty;
	}

	export function parse(input: string): any;
}