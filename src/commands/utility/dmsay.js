const OWNER_ID = process.env.OWNER_ID;
const GUILD_ID = process.env.WALL_STREET_ID;

export default {
  name: "dmsay",
  description: "Make the bot speak in a specified channel from a DM",
  async execute(message, args, client) {

    if (!message.guild) {
      // Only allow from one specific user (optional)
      if (message.author.id != OWNER_ID) {
        return message.reply("You're not allowed to use this command.");
      }

      const guild = await client.guilds.fetch(GUILD_ID)
      const guildChannels = await guild.channels.fetch();

      console.log(guildChannels);

      // Match the channel name

      const name = args[args.length - 1];
      if(!name.startsWith('#')){
        return message.reply("Please use a existing channel name");
      }

      // Extract the last argument as a channel mention
      const channelMentionMatch = args[args.length - 1].match(/^#(\d+)$/);
      if (!channelMentionMatch) {
        return message.reply("Please end your message with a channel mention like `<#channel_id>`.");
      }

      const channelId = channelMentionMatch[1];
      const channel = await client.channels.fetch(channelId).catch(() => null);

      if (!channel || !channel.isTextBased()) {
        return message.reply("That channel is invalid or inaccessible.");
      }

      // Remove the channel mention from the message
      args.pop();
      const sayMessage = args.join(" ").trim();

      if (!sayMessage) return message.reply("Your message is empty.");

      try {
        await channel.send(sayMessage);
        await message.reply(`✅ Sent to <#${channelId}>`);
      } catch (err) {
        console.error(err);
        await message.reply("❌ Could not send the message.");
      }
    }
  },
};
