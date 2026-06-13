import {FLAGS, SYMBOLS} from "../../utils/functions.js";
import dotenv from 'dotenv';
import { SlashCommandBuilder } from "discord.js";
import { getQuoteData } from "../../utils/marketdata.js";

dotenv.config();

export default {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Get stock summary')
    .addStringOption(option =>
      option.setName('symbol')
        .setDescription('The stock symbol (e.g., AAPL, TSLA)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    const channel = await interaction.client.channels.fetch(process.env.SUMMARY_CHANNEL);

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({ content: `${SYMBOLS.cross} Error sending message to the channel!`, ephemeral: true });
    }

    try {
      const messageContent = await getQuoteData(symbol);
      await channel.send(messageContent);
      await interaction.reply(`${SYMBOLS.check} Summary for ${symbol} sent in <#${process.env.SUMMARY_CHANNEL}>`);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: `${SYMBOLS.cross} Failed to fetch stock data.`, flags:FLAGS.ephemeral });
    }
  }
}








