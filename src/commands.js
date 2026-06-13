import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const commands = [];
    
    // Target the specific directory where your 8 command files live
    const slashCommandPath = path.join(__dirname, 'commands', 'slash');

    if (!fs.existsSync(slashCommandPath)) {
        console.error(`❌ Slash command path not found: ${slashCommandPath}`);
        process.exit(1);
    }

    const commandFiles = fs.readdirSync(slashCommandPath).filter(file => file.endsWith('.js'));
    console.log(`🔍 Found ${commandFiles.length} slash command files to deploy.`);

    for (const file of commandFiles) {
        const filePath = path.join(slashCommandPath, file);
        const commandModule = await import(pathToFileURL(filePath).href);
        const cmd = commandModule.default;

        if (!cmd) {
            console.warn(`⚠️ ${file} is missing a default export (export default)`);
            continue;
        }

        if (!cmd.data || typeof cmd.data.toJSON !== 'function') {
            console.warn(`⚠️ Skipping ${file} — missing data or data.toJSON()`);
            continue;
        }

        commands.push(cmd.data.toJSON());
        console.log(`📋 Prepared command for deployment: /${cmd.data.name}`);
    }

    if (commands.length === 0) {
        console.warn('⚠️ No valid slash commands were found to register.');
        process.exit(1);
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('🚀 Deploying slash commands to Discord...');
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.DISCORD_CLIENT_ID,
                process.env.WALL_STREET_ID
            ),
            { body: commands }
        );

        console.log('✅ Slash commands successfully registered with Discord guild!');
        process.exit(0); 
    } catch (err) {
        console.error('❌ Discord API Error:', err);
        process.exit(1);
    }
}

main();