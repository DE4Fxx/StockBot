# StockBot

StockBot is a Node.js Discord bot for stock-focused communities. It supports both legacy prefix commands (e.g. `$ping`) and modern slash commands (e.g. `/news`) to deliver market data, company info, stock news, split calendars, and utility moderation features.

## Features

- Slash commands for stock workflows:
  - `/summary` (quote summary)
  - `/info` (company fundamentals + analyst/earnings snapshot)
  - `/news` (recent stock news)
  - `/profit` (target-profit calculator)
  - `/splits` (upcoming split feed from cache)
  - `/help`, `/getid`, `/redditnews`
- Prefix utility commands:
  - `$ping`, `$say`, `$coinflip`, `$purge`, `$channelids`, `$deleterow`, `$dmsay`
- SQLite-backed cache storage (`better-sqlite3`) for fetched API payloads.
- Puppeteer-powered scraping utilities for split data.
- Dockerized runtime with optional bind-mounted logs/cache/source.

## Quick Start

1. Install dependencies.
2. Create a `.env` file (see [Environment Variables](#environment-variables)).
3. Register slash commands to your target guild.
4. Start the bot.

## Install

```bash
npm ci
```

### Start the bot

```bash
docker compose up -d
```

> Note: `package.json` currently defines `npm start` as `node index.js`, but the bot entrypoint in this repo is `./entrypoint.sh`.

## Environment Variables

Create a `.env` file at the repository root with placeholders like:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_id
WALL_STREET_ID=your_discord_guild_id
OWNER_ID=your_discord_user_id

FMP_API_KEY=your_financial_modeling_prep_key
FINNHUB_API_KEY=your_finnhub_key
TIP_RANKS_UPCOMING=https://example.com/splits-page

SUMMARY_CHANNEL=discord_channel_id
INFO_CHANNEL=discord_channel_id
NEWS_CHANNEL=discord_channel_id
SPLIT_CHANNEL=discord_channel_id
PROFIT_CAL_CHANNEL=discord_channel_id
```

Never commit real secrets.

## Discord Intents and Permissions

### Gateway intents used

- `Guilds`
- `GuildMessages`
- `MessageContent`

### Common permissions needed

- Send Messages
- View Channels
- Read Message History
- Use Slash Commands
- Manage Messages (for `$purge` only)

## Folder Structure

```text
.
├── cache/
│   └── cache.js                 # SQLite cache helper + CRUD functions
├── docs/
│   ├── ARCHITECTURE.md          # Runtime architecture and flow
│   └── CONFIGURATION.md         # Env vars and safe setup details
├── logs/
│   ├── message-log.txt
│   └── purge-log.txt
├── src/
│   ├── commands.js              # Slash command registration script
│   ├── index.js                 # Main bot runtime entrypoint
│   ├── commands/
│   │   ├── slash/               # Slash command handlers
│   │   └── utility/             # Prefix command handlers
│   └── utils/
│       ├── functions.js         # Shared helpers, pagination, scraping utils
│       ├── marketdata.js        # External market/news API wrappers
│       └── update.js            # Cache update helper script
├── docker-compose.yml
├── Dockerfile
└── entrypoint.sh
```

## Troubleshooting

- **Bot logs in but slash commands do not appear**
  - Re-run `node src/commands.js` and verify `DISCORD_CLIENT_ID` + `WALL_STREET_ID`.
- **`Missing Access` or cannot post into target channels**
  - Ensure channel IDs are correct and the bot has permission to send messages there.
- **Prefix commands do nothing**
  - Prefix is `$` and requires `MessageContent` intent enabled in both code and Discord Developer Portal.
- **Market/news commands fail**
  - Verify `FMP_API_KEY` and `FINNHUB_API_KEY` values.
- **Scraping-related failures in containers**
  - Ensure Chromium is installed and bot can launch Puppeteer with `--no-sandbox` args.
- **Cache-related issues**
  - Confirm `cache/` exists and is writable.

For deeper implementation details, see `docs/ARCHITECTURE.md` and `docs/CONFIGURATION.md`.
