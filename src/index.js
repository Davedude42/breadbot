
function replaceNoValue(value) {
	if(value === '' || value === undefined || value === null || value === false || value === '-') {
		return '(None Listed)';
	} else {
		return value;
	}
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

async function getBreadbotData(sheetyKey) {
	let res = await fetch('https://api.sheety.co/9b81eca6e097f927c510daac7996c3aa/breadBotData/sheet1', {
		headers: {
			Authorization: 'Bearer ' + sheetyKey
		}
	});
	let data = await res.json();

	return data.sheet1;
}

function getTodaysEntry(data, now) {
	let nowDate = new Date(now);

	let i = 0;
	let entryDate = new Date(data[i].date);

	while(nowDate > entryDate) {
		i++;

		if(i >= data.length) {
			return null;
		}

		entryDate = new Date(data[i].date);
	}

	return data[i];
}

function composeBreadMessage(entry) {
	let lines = [];
	let formattedDate = (new Date(entry.date)).toLocaleDateString();

	if(entry.event && entry.event.toUpperCase() != 'FAST SUNDAY' && entry.event.toUpperCase() != 'PRIMARY PROGRAM') {
		// Special event, likely no sacrament meeting or second hour

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

function composeLessonMessage(entry) {
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

function composeDebugMessage(entry) {
	let breadMessage = composeBreadMessage(entry);
	let lessonMessage = composeLessonMessage(entry);

	return `
${JSON.stringify(entry)}

${lessonMessage === false ? '[No lesson message this week]' : lessonMessage}

${breadMessage}
`.trim();
}

async function sendMessage(key, message) {
	let res = await fetch('https://api.groupme.com/v3/bots/post',
		{
			method: 'POST',
			body: JSON.stringify({
				"bot_id"  : key,
				"text"    : message
			})
		}
	);

	return res;
}


export default {
	/**
	 * Runs when worker is previewed.
	 * Responds debug message.
	 * 
	 * Currently, routing to the worker is disabled.
	 */
	async fetch(request, env, ctx) {

		let data = await getBreadbotData(env.SHEETY_KEY);
		let todaysEntry = getTodaysEntry(data, new Date());

    return new Response(composeDebugMessage(todaysEntry));
  },

	/**
	 * Run by cron timer every Tuesday, Wednesday, and Friday at 11pm UTC.
	 */
	async scheduled(event, env, ctx) {
		let schedTime = new Date(event.scheduledTime);

		let data = await getBreadbotData(env.SHEETY_KEY);
		let todaysEntry = getTodaysEntry(data, new Date());

		let dayOfWeek = schedTime.getDay();

		// Tuesday (debug day)
		if(dayOfWeek == 2) {
			let message = composeDebugMessage(todaysEntry);
			if(message !== null) {
				let res = await sendMessage(env.DEBUG_KEY, message);
				if(!res.ok) {
					let response = await res.text();
					console.error({ code: res.status, response });
				}
				console.log({ type: 'debug', message });
			}
		}
		// Wednesday
		else if(dayOfWeek == 3) {
			let message = composeLessonMessage(todaysEntry);
			if(message !== null) {
				let res = await sendMessage(env.REAL_KEY, message);
				if(!res.ok) {
					let response = await res.text();
					console.error({ code: res.status, response });
				}
				console.log({ type: 'wednesday', message });
			}
		}
		// Friday
		else if(dayOfWeek == 5) {
			let message = composeBreadMessage(todaysEntry);
			if(message !== null) {
				let res = await sendMessage(env.REAL_KEY, message);
				if(!res.ok) {
					let response = await res.text();
					console.error({ code: res.status, response });
				}
				console.log({ type: 'friday', message });
			}
		}
  }
};
