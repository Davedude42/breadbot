# Bread Bot

Bread Bot is a groupme bot that sends messages every Wednesday and Friday with lesson and bread assignments for a ward in the Church of Jesus Christ of Latter-Day Saints. 

Created by David Haroldsen using Cloudflare, Group Me API, and Sheety. 

## Installation

First, clone this repository onto your device. Then follow the steps below, which assume you know the basics of api and command line usage.

### 1. Access the data

This project assumes you are using Google Sheets for your lesson and bread information. If you are not, skip this section. You will need to replace all references to Sheety with whatever api you plan on using. 

#### a. Google Sheets

For rows in your ward's Google Sheet, Bread Bot expects these values. More are allowed but they will not be read.

| Key        | Description |
|------------|-------------|
| date       | The Sunday's date |
| event      | A special event this week. With all events except "Fast Sunday" and "Primary Program", Bread Bot assumes there is no second hour and announces the event. |
| secondHour | Either "SS" for Sunday School, "ORG" for young men's/women's, "5TH" for 5th Sunday, or "NONE" for no second hour |
| deacons    | Teacher for deacons. If "combined", then Bread Bot announces it as such. |
| teachers   | Teacher for teachers |
| priests    | Teacher for priests |
| bread      | Bread assignment |

Create a blank Google Sheet that will import the data from the main sheet. On the second row, use the function `IMPORTRANGE("[url]", "'[sheet name]'![range]")` to import the data from the sheet where lesson info is collected (e.g. `=IMPORTRANGE("https://docs.google.com/spreadsheets/d/...","'Youth Lesson Planner'!A112:H163")`). On the first row, name each column to match the keys above.

#### b. Sheety

Create a free [Sheety](https://sheety.co/) account and a Google Sheet project within it. Connect it to the Google Sheet you just created.

Under API, select Sheet1 (unless you renamed the default sheet) and enable the GET command and save the url given for later.

Under authentication, enable Bearer (Token) and write a long, secure token. Save this as well. If you want to test your api, turn off this authentication and paste your link from before into the browser. This will likely be a point of failure if Sheety reads the sheet incorrectly.

### 2. Send messages

First, create a new group in groupme named "Bot" with you as the only member. This is where the bot will send debug messages that can be checked each week before the real ones are sent.

Go to https://dev.groupme.com/ and create a developer account connected to your main one. Then, under Bots, create two bots, connecting one to your ward's groupme and one to your Bot groupme.

### 3. Put it all together with Cloudflare

Create a free [Cloudflare](https://www.cloudflare.com/) account. Don't follow any of their recommended steps after creating your account. Except, you will need to go to your account and verify your email; do that now.

Download and install [Node](https://nodejs.org/en/download) (which comes with npm) onto your device. 

In the local repository, run these commands:

1. `npm install`.
2. `npx wrangler login` and follow the instructions.
3. `npx wrangler deploy`. Say "yes" to register a workers.dev domain and enter the name "breadbot" for it.
4. `npx wrangler secret put SHEETY_URL` and enter your Sheety url from earlier.
5. `npx wrangler secret put SHEETY_KEY` and enter your Sheety authentication token.
6. `npx wrangler secret put REAL_KEY` and enter the Bot ID of the groupme bot connected to your ward's group.
7. `npx wrangler secret put DEBUG_KEY` and enter the Bot ID of the groupme bot connected to your "Bot" group.
8. `npx wrangler deploy` again.

### 4. Test it!

Run `npx wrangler dev --remote`. This starts a local preview that you can access in your browser. 

This requires a mode in the query parameters to use.  
Enter the debug mode by adding `?mode=debug` to the url. You should see the debug message for this week.  
Now, enter `?mode=bot` instead. You should receive a groupme message in your "Bot" group with the debug message for this week.

You should now be good to go! :)  
The only thing that hasn't been tested is the real groupme bot because testing it requires sending a real message!

If you failed any of these tests, read the response in the preview or check the logs in the project on Cloudflare to figure out what's wrong. Likely, your secret env variables are incorrect.

## Usage

After following the installation steps, it should be chugging along. It will send you debug messages every Wednesday. Checking these every week will allow you to make sure the data and/or messages are not malformed. If you make a change to the spreadsheet, the change will be seen in all future messages.

### Development

If you change the code, env variables, or anything else locally, run `npx wrangler dev --remote` to access the preview locally and run `npx wrangler deploy` to upload your changes to the project.

### Messages Sent

Sent each of these days at 11pm UTC.

**Tuesday** - Debug message containing the raw json data from Sheety and both upcoming messages. Sent to the "Bot" group.  
**Wednesday** - Lesson assignments. Only sent if second hour is priesthood.  
**Friday** - Bread assignment.

### Preview

The preview of the site runs `fetch()`. It can be viewed locally or on the Cloudflare project, and it can be used to debug the upcoming message anytime.

It requires a mode to be entered to prevent web crawlers from using up your Sheety access limits, which they will. The mode is added to your query parameters with `?mode=[mode]` at the end of the url.

Mode `debug` - Displays the debug message for this week.  
Mode `bot` - Sends the debug message to your "Bot" group.

### Other References

#### cron Timer

A cron timer, which can be found in `wrangler.toml`, runs `scheduled()` every Tuesday, Wednesday, and Friday at 11pm UTC. Depending on daylight savings, this is either 5pm CST or 6pm CDT.

#### Bread Bot API

Note: Test messages can also be sent directly from the groupme dev site.

#### Sheety

Converts the rows of a sheet into a list in json using the headers at the top. Values not needed are ignored by Bread Bot. For merged cells, the value is only stored in the top left cell.

Note: The free version of Sheety only allows 100 rows of data. If the import range is not shifted down within... 2 years, data will be cut off by Sheety.