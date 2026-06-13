import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available slash commands'),

  async execute(interaction) {
    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const fields = [];

    for (const file of commandFiles) {
      const commandModule = await import(pathToFileURL(path.join(commandsPath, file)).href);
      const command = commandModule.default;

      if (command?.data?.name && command?.data?.description) {
        fields.push({
          name: `/${command.data.name}`,
          value: command.data.description,
          inline: false,
        });
      }
    }

    await interaction.reply({
      embeds: [{
        title: '📖 Help Menu',
        description: 'Here are the available slash commands:',
        fields: fields.length > 0 ? fields : [{ name: 'No commands found', value: 'No slash commands were loaded.' }],
        color: 0x00b0f4,
      }]
    });
  }
};

