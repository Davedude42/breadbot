# Bread Bot

Bread Bot sends a message twice weekly to our LDS church's youth Group Me, giving the lesson assignments and bread assignment for the next Sunday.

Created by David using Node on Cloudflare, Group Me API, and Sheety. 

## Messages Sent

Sent each of these days at 11pm UTC.

**Tuesday** - Debug message containing both upcoming messages sent to "Bot" chat.  
**Wedneday** - Lesson assignments. Not sent if second hour is not priesthood.  
**Friday** - Bread assignment.

## Dev Process

### Local Installation

To edit locally: clone the repo to your device and run `npm install`, assuming Node and npm is installed on your device. Use Wrangler commands to debug and deploy the project.

#### Wrangler Commands

Open local preview: `npx wrangler dev` (Note that for some reason, the API keys are not defined under `env`, so it won't be able to fetch data)

Deploy project and upload to Cloudflare: `npx wrangler deploy`

### Cloudflare Worker

The Cloudflare worker is owned by the Bread Bot account. Use the Cloudflare dashboard to edit settings and view logs. After logging into Cloudflare, you can always find the worker under Workers & Pages in the sidebar. You can edit the code on the dashboard, but it's compiled weirdly before being deployed, so I recommend not.

#### cron Timer

A cron timer, which can be found under `Settings > Trigger Events` on the dashboard, runs `scheduled()` every Tuesday, Wednesday, and Friday at 11pm UTC. Depending on daylight savings, this is either 5pm CST or 6pm CDT.

#### Preview

The preview of the site runs `fetch()`, which responds the debug message without sending a Group Me message. Can be used to debug the upcoming message anytime.

Currently, routing to the worker is disabled.

### Group Me API

Group Me API account is owned by David. Messages are sent to Group Me API using the separate API keys for the debug bot and the real bot. If something about the bots needs to be changed, let David know. Custom messages can also be sent by any bot on the API site by request.

### Sheety

Sheety account is the Bread Bot account. 

Bread Bot owns a Google Sheet that imports the youth planner data using `IMPORTRANGE` (which is found under cell A2 of the sheet). Sheety reads the Google Sheet and makes it into an API. 

Note: The free version of Sheety only allows 100 rows of data. If the import range is not shifted down within... 2 years, data will be cut off by Sheety.