import fs from 'fs';
import path from 'path';
import { logDenied } from "../../utils/functions.js";


export default {
    name: 'purge',
    async execute(message, args){
        if (!message.member.permissions.has('ManageMessages')) {
            logDenied(message.author,"Not Authorized","purge")
            return message.reply('❌ You need the **Manage Messages** permission to use this command.');
        }
        const amount = parseInt(args[0]);
        if(isNaN(amount) || (amount < 1 || amount > 101)){
            return message.reply("Enter a number between 1 and 100...")
        }

      try {
            const messages = await message.channel.messages.fetch({ limit: amount + 1 }); // +1 to get the command message too
            const logLines = [];

            messages.forEach(msg => {
                const timestamp = new Date(msg.createdTimestamp).toISOString();
                logLines.push(`[${timestamp}] ${msg.author.tag}: ${msg.content}`);
            });

            const logHeader = `\n\n=== Purge by ${message.author.tag} (${message.author.id}) at ${new Date().toISOString()} ===\n`;
            const logPath = path.join('logs', 'purge-log.txt');

            // Append log to file
            fs.appendFileSync(logPath, logHeader + logLines.join('\n'));

            // Delete the messages
            await message.channel.bulkDelete(messages);

            const confirm = await message.channel.send(`✅ Deleted ${messages.size - 1} messages.`);
            setTimeout(() => confirm.delete(), 10000);
            } 
            catch (err) {
                console.error(err);
                message.channel.send('❌ Error deleting messages or saving log.');
        }
    }
}

