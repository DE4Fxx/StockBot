# Architecture

## High-Level Flow

StockBot has two primary runtime paths:

1. **Slash command deployment path** (`src/commands.js`)
   - Loads slash command modules from `src/commands/slash`.
   - Converts each command's `data` into JSON.
   - Registers commands with Discord's REST API for a specific guild.

2. **Bot runtime path** (`src/index.js`)
   - Creates a Discord.js `Client` with configured intents.
   - Dynamically loads message and slash command handlers.
   - Listens for Discord events (`clientReady`, `messageCreate`, `interactionCreate`).
   - Delegates execution to command modules.

## Command Pipeline

### Prefix/message commands (`$` prefix)

1. `messageCreate` event receives a message.
2. Message is logged to `logs/message-log.txt`.
3. Bot ignores bot-authored messages and messages not starting with `$`.
4. Message is tokenized into command name + args.
5. Command is resolved from `client.messageCommands` collection.
6. `command.execute(message, args, client)` is invoked.

Command handlers live under `src/commands/utility/` and are loaded recursively from `src/commands/`.

### Slash commands

1. `interactionCreate` receives an interaction.
2. Non-chat-input interactions are ignored.
3. Command is resolved from `client.slashCommands` collection.
4. `command.execute(interaction, client)` is invoked.

Command handlers live under `src/commands/slash/`.

## Event Pipeline

- `clientReady`
  - Logs successful login and readiness.
- `messageCreate`
  - Logs all incoming messages.
  - Handles prefix command execution.
- `interactionCreate`
  - Handles slash command execution.

## Service Layer

The codebase does not have a formal service directory, but helper modules serve that role:

- `src/utils/marketdata.js`
  - Integrates with external APIs (Financial Modeling Prep, Finnhub).
  - Performs market/news fetches.
  - Stores selected payloads in cache.
- `src/utils/functions.js`
  - Shared helpers (number formatting, message logging, pagination).
  - Puppeteer scraping helpers.
- `cache/cache.js`
  - SQLite access layer for cache records (`setCache`, `getCache`, partial/deletion helpers).

## Data Flow Diagram (ASCII)

```text
Discord Gateway
   |
   v
src/index.js (Client + event listeners)
   |                         \
   | messageCreate            \ interactionCreate
   v                           v
Prefix parser              Slash command resolver
   |                           |
   v                           v
utility command execute()   slash command execute()
   |                           |
   +-----------+---------------+
               |
               v
      utils/marketdata.js + utils/functions.js
               |
      +--------+-----------------------+
      |                                |
      v                                v
External APIs                     cache/cache.js (SQLite)
(FMP, Finnhub, web scrape)        cache/cache.db
```

## Notes on Current Structure

- Commands are dynamically imported at runtime.
- Prefix and slash commands coexist.
- Cache and logs are filesystem-backed.
- No dedicated scheduler process is active by default; `src/utils/update.js` can be run manually/externally.
