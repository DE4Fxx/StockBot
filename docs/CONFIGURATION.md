# Configuration

## Runtime Configuration Sources

StockBot configuration currently comes from:

- Environment variables loaded via `.env` (using `dotenv` in runtime scripts).
- Hardcoded runtime defaults in code (e.g. message prefix `$`, scraper timeout values).
- Docker compose env_file reference (`docker-compose.yml` → `.env`).

## Environment Variables

Use the following variables in your `.env` file.

### Discord

- `DISCORD_TOKEN`
  - Bot token used for login and slash registration.
- `DISCORD_CLIENT_ID`
  - Discord application (client) ID used when registering slash commands.
- `WALL_STREET_ID`
  - Guild/server ID target for guild-scoped slash command registration.
- `OWNER_ID`
  - User ID authorized for restricted prefix commands (e.g. `$deleterow`, DM relay command checks).

### Channel Routing

- `SUMMARY_CHANNEL`
- `INFO_CHANNEL`
- `NEWS_CHANNEL`
- `SPLIT_CHANNEL`
- `PROFIT_CAL_CHANNEL`

Each value should be a numeric Discord channel ID where command results are posted.

### Market Data and Scraping

- `FMP_API_KEY`
  - Financial Modeling Prep API key.
- `FINNHUB_API_KEY`
  - Finnhub API key.
- `TIP_RANKS_UPCOMING`
  - URL used by the splits update helper script.

## Config Files

- `.env`
  - Local secrets and environment config (never commit).
- `docker-compose.yml`
  - References `.env` via `env_file`.
- `package.json`
  - Scripts and dependency versions.

## Where Secrets Live

Secrets should exist only in environment variables or secret managers:

- Local development: `.env` (gitignored).
- Container/deployment: orchestrator-managed env vars / secret injection.

Never hardcode tokens or API keys in source files.

## Safe Setup Example

```env
# Discord
DISCORD_TOKEN=replace_with_bot_token
DISCORD_CLIENT_ID=replace_with_client_id
WALL_STREET_ID=replace_with_guild_id
OWNER_ID=replace_with_owner_user_id

# APIs
FMP_API_KEY=replace_with_fmp_key
FINNHUB_API_KEY=replace_with_finnhub_key
TIP_RANKS_UPCOMING=https://example.com/upcoming-splits

# Output channels
SUMMARY_CHANNEL=000000000000000000
INFO_CHANNEL=000000000000000000
NEWS_CHANNEL=000000000000000000
SPLIT_CHANNEL=000000000000000000
PROFIT_CAL_CHANNEL=000000000000000000
```

## Script Verification

`package.json` currently contains:

- `start`: `node index.js`
- `test`: `jest`

Repository runtime files indicate actual operational commands are:

- `node src/commands.js` (register slash commands)
- `node src/index.js` (run bot)

If you rely on `npm start`, consider aligning it to `src/index.js` in a future safe refactor milestone.
