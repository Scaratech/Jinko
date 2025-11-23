# Jinko
An AI girlfriend that lives in your Discord DMs

## Deployment Guide
### Discord Configuration
1. Go [here](https://discord.com/developers/applications)
    - "New Application"
2. Copy the "Application ID"
3. Go to "Installation"
    - Make sure only "User Install" is selected
    - Make sure it has the scope `applications.commands`
3. Go to "Bot"
    - Reset the token and copy it
    - Disable the "Public Bot" option
    - Enable the "Message Content Intent"
4. Go to "OAuth2"
    - Under scopes, click on `applications.commands`
    - Make sure "Integration Type" is "User Install"
    - Copy the generated URL and paste it into either Discord or your web-browser, and add the app

### OpenRouter
1. Go [here](hhttps://openrouter.ai/)
    - Create an account if you haven't already, and add funds
2. Click on your PFP, then "Keys"
    - Click on "Create API Key"
    - Copy the created API key

### Code
Requirements: [NodeJS](https://nodejs.org), [Git](https://git-scm.com/), and [PNPM](https://pnpm.io/)
```sh
$ git clone https://github.com/scaratech/jinko
$ cd jinko
$ pnpm i
$ pnpm build
```
Create a file called `.env` and enter in (or see `.env.example`):
```
### DISCORD CONFIGURATION ###
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_APP_ID=your_app/client_id

### OPENROUTER CONFIGURATION ###
OPENROUTER_API_KEY=your_openrouter_api_key

### OTHER ###
DB_DIR=./db.json # Path to DB
PROMPT_DIR=./prompts/ # Path to prompts
```
Then, run
```sh
$ pnpm run deploy
$ pnpm start
```

### Prompts
You need to supply your own prompts
1. Create the directory you have for `PROMPT_DIR` (e.g. `prompts`)
2. Create a text file (e.g. `prompt.txt`)
    - Input your prompt

### Discord Setup
1. Once you've confirmed the bot is up and running, and that you have it added, run the `/ping` command
2. Then, click on the bots profile and click the message bot. Then, inside the bots DMs, run `/help` to get started!