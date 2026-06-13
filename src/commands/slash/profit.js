import { SlashCommandBuilder } from 'discord.js';
import { FLAGS, stringifyNumber, SYMBOLS } from '../../utils/functions.js';
import { setCache } from '../../../cache/cache.js';
import {getTickerData,getDividendData } from '../../utils/marketdata.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profit')
    .setDescription('Calculate potential stock profit.')
    .addStringOption(option =>
      option.setName('ticker')
        .setDescription('The stock ticker (e.g., WBD)')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('shares')
        .setDescription('Number of shares')
        .setRequired(true))
      .addStringOption(option => 
      option.setName('profit_type')
      .setDescription("Choose percent for a profit percentage, or dollars for exact dollar amounts")
      .setRequired(true)
      .addChoices(
        {
          name: "percent",
          value: "%"
        },
        {
          name: "dollars",
          value: "$"
        }
      ))
      .addStringOption(option =>
      option.setName('value')
      .setDescription("Use this to specify the number for profit_type ( e.g. ($)100 or 10(%) )")
      .setRequired(true)
      ),

  async execute(interaction) {
    const channel = await interaction.client.channels.fetch(process.env.PROFIT_CAL_CHANNEL);

    // Retrieve all the data

    const ticker = interaction.options.getString('ticker').toUpperCase();
    const shares = interaction.options.getNumber('shares');
    const dataExpression = interaction.options.getString('profit_type');
    let value = interaction.options.getString('value');
    const data = await getTickerData(ticker);
    const currentPrice = data.c;

    // In case of null

    if (!currentPrice) {
      return interaction.reply(`${SYMBOLS.cross} Could not fetch price for **${ticker}**.`);
    }



    let targetValue,targetPrice;
    const cost = currentPrice * shares;
    if (dataExpression == "$") 
    {
      if(value.includes("$"))
      value = value.slice(1,value.length);

      value = Number(value);

      targetPrice = value;
      targetValue = value * shares;

    }
    else 
    {
      if(value.includes("%"));
      value = value.slice(0,value.length - 1);
      console.log(value);
      
      value = Number(value);
      const shareValue = currentPrice + (currentPrice * (value/100))

      targetValue = shareValue * shares;
      targetPrice = shareValue
    };
    const profit = targetValue - cost;
    const percentGain = ((profit / cost) * 100);

    // Temp holder for message logic
    let dividendString = `${ticker} does not pay out dividends`;
    try{
        let [dividend, frequency] = await getDividendData(ticker);
        dividendString = `$${await stringifyNumber(new Number(dividend) * shares)} ${frequency} dividend yield`;
    }
    catch(err)
    {
      console.error(err);

    }
   


    const replyHeader =  `Requested by ${interaction.user}\n\n`+
                         `📊 **${ticker} Profit Calculation**\n`;
    const replyMessage = `Shares: **${await stringifyNumber(shares)}**\n` +
                         `Current Price: **$${await stringifyNumber(currentPrice)}**\n` +
                         `Target Price: **$${await stringifyNumber(targetPrice)}**\n` +
                         `Cost Basis: **$${await stringifyNumber(cost)}**\n` +
                         `Target Value: **$${await stringifyNumber(targetValue)}**\n` +
                         `Profit: **$${await stringifyNumber(profit)}** (${await stringifyNumber(percentGain)}%)\n` +
                         `Possible Dividend Payout: **${dividendString}**`


    
    // Store the message for data science

    await setCache(ticker+":PROFIT",replyHeader+replyMessage);

    // Send the message

    channel.send(replyHeader+replyMessage)

    return interaction.reply(`${SYMBOLS.check} Profit calculation for ${ticker} sent in <#${process.env.PROFIT_CAL_CHANNEL}>`

    );
  }
};

