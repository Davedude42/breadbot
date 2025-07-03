
import { getBreadbotData, getTodaysEntry, sendMessage } from './commonFunctions';
import { composeDebugMessage, composeLessonMessage, composeBreadMessage } from './composeMessages';

export default {
	/**
	 * Runs when worker is previewed.
	 * Responds debug message when the not-so-secret password is provided.
	 */
	async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const params = url.searchParams;

    const mode = params.get('mode');

		// Defining a mode is required to fetch sheety data.
		// Otherwise web crawlers or whatever use up all of your monthly Sheety requests :(
		if(mode == 'debug') {
			let data = await getBreadbotData(env.SHEETY_URL, env.SHEETY_KEY, env.DEBUG_KEY);
			if(data === undefined) console.error({ message: 'Sheety fetched data is undefined' });
	
			let todaysEntry = getTodaysEntry(data, new Date());
	
			return new Response(composeDebugMessage(todaysEntry));
		} else if(mode == 'bot') {
			let data = await getBreadbotData(env.SHEETY_URL, env.SHEETY_KEY, env.DEBUG_KEY);
			if(data === undefined) console.error({ message: 'Sheety fetched data is undefined' });
	
			let todaysEntry = getTodaysEntry(data, new Date());
			let message = composeDebugMessage(todaysEntry);
			if(message !== false) {
				let res = await sendMessage(env.DEBUG_KEY, message);
				if(!res.ok) {
					let response = await res.text();
					console.error({ code: res.status, response });
				}
			}
			return new Response('Send bot message.');
		} else {
			return new Response('Please add a mode.');
		}
  },

	/**
	 * Run by cron timer every Tuesday, Wednesday, and Friday at 11pm UTC.
	 */
	async scheduled(event, env, ctx) {
		let now = new Date();
		let dayOfWeek = now.getDay();

		if(!(dayOfWeek == 2 || dayOfWeek == 3 || dayOfWeek == 5)) {
			console.error({ message: 'Not the correct day!' });
			return;
		}

		let data = await getBreadbotData(env.SHEETY_URL, env.SHEETY_KEY, env.DEBUG_KEY);
		if(data === undefined) console.error({ message: 'Sheety fetched data is undefined' });

		let todaysEntry = getTodaysEntry(data, new Date());

		// Tuesday (debug day)
		if(dayOfWeek == 2) {
			let message = composeDebugMessage(todaysEntry);
			if(message !== false) {
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
			if(message !== false) {
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
			if(message !== false) {
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
