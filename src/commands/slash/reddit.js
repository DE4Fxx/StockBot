import { SlashCommandBuilder } from 'discord.js';
import { searchReddit } from '../../utils/functions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redditnews')
    .setDescription('Search Reddit for a stock ticker')
    .addStringOption(option =>
      option.setName('ticker')
        .setDescription('The stock ticker (e.g. AAPL)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ticker = interaction.options.getString('ticker').toUpperCase();
    await interaction.deferReply();

    try {
      const result = await searchReddit(ticker);
      await interaction.editReply(result);
    } catch (err) {
      console.error(err);
      await interaction.editReply('⚠️ Error while searching Reddit.');
    }
  }
};
