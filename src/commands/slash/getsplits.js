import { SlashCommandBuilder, EmbedBuilder} from 'discord.js';
import { getPartialMatchFromCache } from '../../../cache/cache.js';
import { paginateEmbeds, SYMBOLS } from '../../utils/functions.js';

export default {
    data : new SlashCommandBuilder()
    .setName("splits")
    .setDescription("Gets upcoming splits from the web"),
    async execute(interaction, client)
    {
        try {
            const channel = await client.channels.fetch(process.env.SPLIT_CHANNEL);
            await interaction.deferReply(); // let Discord know we're working
            const splits = await getPartialMatchFromCache(":SPLIT");
            const embeds = splits
                            .map((split) => {
                                const value = split.value;
                                if (!value) return null;

                                const splitDate = new Date(value.date);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                if (splitDate.getTime() <= today.getTime()) return null;

                                const description =
                                `Ticker: ${value.company}\n` +
                                `Date: ${value.date}\n` +
                                `Reverse or Forward: ${value.splitType}\n` +
                                `Payout: ${value.payout}`;

                                return new EmbedBuilder()
                                .setTitle(value.companyFullName)
                                .setDescription(description);
                            })
                            .filter(Boolean); // <– keep all valid ones

            await paginateEmbeds(interaction,channel,embeds);

            await interaction.editReply(`${SYMBOLS.check} Splits sent in <#${process.env.SPLIT_CHANNEL}>`);
        }

        catch(error)
        {
            console.error(error);
            // Safe fallback: only reply if not already replied
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('❌ Something went wrong while fetching news.');
            } else {
                await interaction.reply({ content: '❌ Failed to fetch news.'});
            }
        }



    }


}