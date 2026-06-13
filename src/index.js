import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { logMessages } from './utils/functions.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize client with correct structural intent gates
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.messageCommands = new Collection();
client.slashCommands = new Collection();

// ========================
// 1. LOAD PREFIX COMMANDS
// ========================
// Point this to your utility/text folder specifically so it avoids reading slash files
const utilityPath = path.join(__dirname, 'commands', 'utility');

if (fs.existsSync(utilityPath)) {
  const utilityFiles = fs.readdirSync(utilityPath).filter(file => file.endsWith('.js'));
  for (const file of utilityFiles) {
    const filePath = path.join(utilityPath, file);
    const commandModule = await import(pathToFileURL(filePath).href);
    const cmd = commandModule.default;
    
    if (cmd && (cmd.name)) {
      client.messageCommands.set(cmd.name, cmd);
    }
  }
}

// ========================
// 2. LOAD SLASH COMMANDS
// ========================
const slashPath = path.join(__dirname, 'commands', 'slash');

if (fs.existsSync(slashPath)) {
  const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));
  console.log(`🔍 Found ${slashFiles.length} slash command files.`);

  for (const file of slashFiles) {
    const filePath = path.join(slashPath, file);
    const commandModule = await import(pathToFileURL(filePath).href);
    const cmd = commandModule.default;

    // Check if the default export is missing entirely
    if (!cmd) {
      console.warn(`⚠️ ${file} is missing a default export (export default)`);
      continue;
    }

    // Check if data or name properties are missing
    if (!cmd.data || !cmd.data.name) {
      console.warn(`⚠️ ${file} default export is missing 'data' or 'data.name'`);
      continue;
    }

    client.slashCommands.set(cmd.data.name, cmd);
    console.log(`✅ Loaded slash command: /${cmd.data.name}`);
  }
} else {
  console.error(`❌ Slash command path not found: ${slashPath}`);
}

// ========================
// 3. GATEWAY LISTENERS
// ========================

// FIXED: Event signature must be 'ready'
client.once('ready', () => {
    console.log(`[+] Logged in as ${client.user.tag} and ready to BUY BUY BUY!!!!!!`);
});

// Message listener (Prefix Commands)
client.on('messageCreate', async (message) => {
  await logMessages(message);
  
  if (message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.messageCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('❌ There was an error trying to execute that command.');
  }
});

// Interaction listener (Slash Commands)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log('🔔 Interaction received:', interaction.commandName);

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) {
    console.log('⚠️ Command not found in client.slashCommands');
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ There was an error executing the command.', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);