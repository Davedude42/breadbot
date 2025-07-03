

export function replaceNoValue(value) {
	if(value === '' || value === undefined || value === null || value === false || value === '-') {
		return '(None Listed)';
	} else {
		return value;
	}
}

export function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

export async function logError(debugKey, message) {
	console.error(message);
	return await sendMessage(debugKey, message);
}

/**
 * Gets breadbot data.
 * Modify if not using Google Sheets and Sheety or if data processing is needed.
 */
export async function getBreadbotData(sheetyUrl, sheetyKey, debugKey) {
	// Uncomment this line if your Sheety access limits are being used up.
	// logError(debugKey, 'Fetching sheety data!');

	let res = await fetch(sheetyUrl, {
		headers: {
			Authorization: 'Bearer ' + sheetyKey
		}
	});
	if(!res.ok) {
		await logError(debugKey, `sheety fetch failed\n\n${await res.text()}`);
		return undefined;
	}

	let data = await res.json();
	let days = data.sheet1;

	let result = [];

	days.forEach(day => {
		result.push({
			date: day.date,
			event: day.event,
			secondHour: day.secondHour,
			deacons: day.deacons,
			teachers: day.teachers,
			priests: day.priests,
			bread: day.bread
		});
	});

	return result;
}

export function getTodaysEntry(data, now) {
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

export async function sendMessage(key, message) {
	let res = await fetch("https://api.groupme.com/v3/bots/post",
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
