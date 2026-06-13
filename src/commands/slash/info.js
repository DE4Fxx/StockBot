import { stringifyNumber, SYMBOLS } from "../../utils/functions.js"
import { SlashCommandBuilder } from "discord.js";
import { detailThis } from "../../utils/marketdata.js";


export default{
    data:new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get detailed information about a stock')
    .addStringOption(option =>
      option.setName('symbol')
        .setDescription('The stock symbol (e.g., AAPL, TSLA)')
        .setRequired(true)
    ),

    async execute(interaction, client){
        const ticker = interaction.options.getString('symbol').toUpperCase();
        const channel = await client.channels.fetch(process.env.INFO_CHANNEL);
        if (!channel || !channel.isTextBased()){
            return message.reply(`${SYMBOLS.cross} Error sending message to that channel!`)
        }
        const responses = await detailThis(ticker,interaction.user.id)
        try{
            await interaction.deferReply(); // let Discord know we're working

            const profile = responses.profile[0];
            const income = responses.incomeStatement[0];
            const balance = responses.balanceSheet[0];
            const analysts = responses.analystStatements[0];

            // Check to see if analysts' responses are available

            const analystMessage = analysts ? `🧠 **Analyst Ratings**\n\n`+  
            `🟢 Strong Buy: ${analysts.strongBuy}\n`+  
            `🟡 Hold: ${analysts.hold}\n`+  
            `🔴 Sell: ${analysts.sell}\n` : '🧠 **Analyst Ratings**: No recent analyst data available'



            const earnings = responses.quarterlyEarnings?.[0];

            // Check to see if earnings are available

            const earningsMessage = earnings
            ? `🧾 **Earnings (Q${earnings.quarter} ${earnings.year})**\n\n`+
            `• EPS: ${await stringifyNumber(earnings.actual, true)}\n`+
            `• Estimate: ${await stringifyNumber(earnings.estimate, true)}\n`+
            `• Surprise: ${earnings.surprise > 0 ? `${SYMBOLS.check} Beat` : `${SYMBOLS.cross} Miss`}\n`
            : "🧾 **Earnings**: No recent earnings data available.";

    
            const dividends = responses.dividends.historical;

            // Safely handle dividends (could be empty)
            const dividendInfo = dividends.length > 0
            ? `$${dividends[0].dividend} on ${dividends[0].date}`
            : "None";

            const headerFooter = '='.repeat(42);

            const infoMessage = 
            `${headerFooter}\n`+
            `📊 **${profile.companyName}** (${profile.symbol})\n`+
            `*${profile.sector} — ${profile.industry}*\n\n`+
            `💵 **Market Cap**: $${await stringifyNumber(profile.mktCap, false, true)}\n\n`+  
            `📈 **Revenue (YTD)**: $${await stringifyNumber(income.revenue, false, true)}\n\n`+  
            `💸 **Dividends**: ${dividendInfo}\n\n`+  
            `📉 **Total Debt**: $${await stringifyNumber(balance.totalDebt, false, true)}\n\n`+  
            `${earningsMessage}\n`+

            `${analystMessage}\n`+
            `${headerFooter}\n`.trim();

            await channel.send(infoMessage);
            await interaction.editReply(`${SYMBOLS.check} Info about ${ticker} sent in <#${process.env.INFO_CHANNEL}>`);
        }
        catch (err){
            console.error(err);
            await interaction.editReply("❌ Failed to get stock info.");
        }
    }


    

}