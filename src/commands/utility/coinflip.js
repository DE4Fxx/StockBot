import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'coinflip',
  async execute(message, args) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('heads')
        .setLabel('🪙 Heads')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('tails')
        .setLabel('🪙 Tails')
        .setStyle(ButtonStyle.Secondary)
    );

    const sentMessage = await message.channel.send({
      content: 'Pick heads or tails:',
      components: [row]
    });

    const collector = sentMessage.createMessageComponentCollector({
      time: 15000, // 15 seconds
      filter: i => i.user.id === message.author.id
    });

    collector.on('collect', async interaction => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const userChoice = interaction.customId;

      const win = result === userChoice;
      await interaction.update({
        content: `You picked **${userChoice}**. It landed on **${result}**.\n${win ? '🎉 You win!' : '💀 You lose.'}`,
        components: []
      });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        sentMessage.edit({
          content: '⏰ Time ran out!',
          components: []
        });
      }
    });
  }
};