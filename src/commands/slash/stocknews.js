import { SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { SYMBOLS } from '../../utils/functions.js';
import { retrieveNews } from '../../utils/marketdata.js';

// Caches articles so that they aren't repeated

const seen = {}

// Generates choices 1-15 for the news

const choices = Array.from({ length: 10 }, (_, i) => ({
  name: `${i + 1}`,
  value: `${i + 1}`,
}));

export default {
  data: new SlashCommandBuilder()
  .setName('news')
  .setDescription('Get stock news for a symbol')
  .addStringOption(option =>
    option.setName('symbol')
      .setDescription('Stock symbol (e.g., AAPL)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('range')
      .setDescription('How far back to look')
      .setRequired(false)
      .addChoices(
        { name: 'Past week', value: '7' },
        { name: 'Past month', value: '30' },
        { name: 'Past 3 months', value: '90' },
        { name: 'Past Year', value: '365' }
      )
  )
  .addStringOption(option =>
    option.setName('number')
    .setDescription('Choose a number of articles to retrieve (between 1-15)')
    .setRequired(false)
    .addChoices(choices)
  ),

  async execute(interaction, client) {
    const channel = await client.channels.fetch(process.env.NEWS_CHANNEL);
    if (!channel || !channel.isTextBased()){
        return message.reply(`${SYMBOLS.cross} Error sending message to that channel!`)
    }
    let number = interaction.options.getString('number');
    
    await interaction.deferReply(); // let Discord know we're working

    if (isNaN(number) || number < 1 || number > 15) 
        {
            number = 3 // default to 3
    }
    const symbol = interaction.options.getString('symbol').toUpperCase();
    const daysBack = parseInt(interaction.options.getString('range') ?? '7'); // default to 7

    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - daysBack);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];

    try {
      let res = await retrieveNews(symbol,fromStr,toStr);
      if (!res || !res.length ) {
        return interaction.editReply('📰 No news found.');
      }
      console.log(res);
      console.log("End.");
      if (!Array.isArray(res)) {
        throw new Error("Expected an array of articles, but got: " + typeof res);
      }

    // Ensure I don't distribute SeekingAlpha articles cause of their dumb freemium business model

    const embeds = res
      .filter(article => {
        const key = article.url || article.headline;
        const source = article.source;
        if (!key || seen[key] || source.toLowerCase() === "seekingalpha") return false;
        seen[key] = true;
        return true;
      })
      .slice(0, number)
      .map(article =>
        new EmbedBuilder()
          .setTitle(article.headline || 'No headline')
          .setURL(article.url && /^https?:\/\//.test(article.url) ? article.url : null)
          .setImage(article.image || null)
          .setDescription(article.summary || 'No summary available')
          .setTimestamp(article.datetime * 1000)
          .setFooter({ text: article.source || 'Unknown source' })
          .setColor(0x00bcd4)
      );

      if(embeds.length > 0){
        await channel.send({
              content: `Requested by <@${interaction.user.id}>`,  // This pings the user
              embeds: embeds            
        });
        
      }
      else{
        return interaction.editReply(`📰 No news found. Maybe check <#${process.env.NEWS_CHANNEL}>`);
      }
      await interaction.editReply(`${SYMBOLS.check} News for ${symbol} sent in <#${process.env.NEWS_CHANNEL}>`);
      } catch (err) {
        console.error(err);
      // Safe fallback: only reply if not already replied
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('❌ Something went wrong while fetching news.');
      } else {
        await interaction.reply({ content: '❌ Failed to fetch news.'});
      }
    }
  }
};
