
import { toTitleCase, replaceNoValue } from './commonFunctions';

const SECOND_HOUR_EVENTS = [
	'FAST SUNDAY',
	'PRIMARY PROGRAM'
];

export function composeBreadMessage(entry) {
	let lines = [];
	let formattedDate = (new Date(entry.date)).toLocaleDateString();

	if(entry.event && !SECOND_HOUR_EVENTS.includes(entry.event.toUpperCase())) {
		// Special event, no second hour and possibly no sacrament meeting

		lines.push(`Hi! ${toTitleCase(entry.event)} is this Sunday, ${formattedDate}.`);

		if(!entry.bread) {
			lines.push(`No bread assignment this week!`);
		}
	} else {
		// Options for second hour
		if(entry.secondHour.toUpperCase() == 'SS') {
			lines.push(`Hi! We have Sunday School this Sunday, ${formattedDate}.`);
		} else if(entry.secondHour.toUpperCase() == 'ORG') {
			lines.push(`Hi! We have Young Women's/Priesthood this Sunday, ${formattedDate}.`);
		} else if(entry.secondHour.toUpperCase() == '5TH') {
			lines.push(`Hi! We have 5th Sunday this week, ${formattedDate}.`);
		} else if(entry.secondHour.toUpperCase() == 'NONE') {
			lines.push(`Hi! We have no second hour this week, ${formattedDate}.`);
		} else {
			// Silently report error
			// Second hour data will be missing, but it's better that the message just gets send
			console.error({ message: 'Unexpected second hour value', entry });
		}

		if(entry.event.toUpperCase() == 'FAST SUNDAY') {
			lines.push(`Also, don't forget it's Fast Sunday this week!`);
		}
	}

	if(entry.bread) {
		lines.push(`Bread Assignment: ${replaceNoValue(entry.bread)}`);
	}

	return lines.join('\n');
}

export function composeLessonMessage(entry) {
	let lines = [];
	let formattedDate = (new Date(entry.date)).toLocaleDateString();

	if(
		!(entry.event && entry.event.toUpperCase() != 'FAST SUNDAY' && entry.event.toUpperCase() != 'PRIMARY PROGRAM') && 
		(entry.secondHour?.toUpperCase() == 'ORG')
	) {
		// Not special event and second hour is young women's/priesthood

		lines.push(`Hi! Here's your reminder for priesthood lessons for ${formattedDate}.`);
		if(entry.deacon?.toLowerCase()?.includes('combined')) {
			lines.push('Combined young men\'s lesson this week')
		} else {
			lines.push(`Deacons:  ${replaceNoValue(entry.deacons)}`);
			lines.push(`Teachers: ${replaceNoValue(entry.teachers)}`);
			lines.push(`Priests:  ${replaceNoValue(entry.priests)}`);
		}

		return lines.join('\n');
		
	} else {
		return false;
	}
}

export function composeDebugMessage(entry) {
	let breadMessage = composeBreadMessage(entry);
	let lessonMessage = composeLessonMessage(entry);

	return `
${JSON.stringify(entry)}

${lessonMessage === false ? '[No lesson message this week]' : lessonMessage}

${breadMessage}
`.trim();
}
