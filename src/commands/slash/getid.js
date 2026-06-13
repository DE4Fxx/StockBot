import { SlashCommandBuilder} from 'discord.js';
import { FLAGS } from '../../utils/functions.js';
export default {
  data: new SlashCommandBuilder()
    .setName('getid')
    .setDescription('Returns your Discord user ID'),
  async execute(interaction) {
    await interaction.reply({content: `Your ID is: ${interaction.user.id}`,flags: FLAGS.ephemeral});
  },
};