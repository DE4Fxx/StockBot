import { getChannelIDs } from "../../utils/functions.js";

export default {
    name: "channelids",
    async execute(message,args){
        const guild = message.guild;
        const channelIDMap = await getChannelIDs(guild);
        let messageContent = "Channels:            IDs:\n";
        for(const channel of channelIDMap){
            messageContent += `${channel.name}            ${channel.id}\n`
        }
        console.log(messageContent)
        
    }
}