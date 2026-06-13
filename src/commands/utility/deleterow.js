import { rawDeleteFromCache } from "../../../cache/cache.js"
import { SYMBOLS } from "../../utils/functions.js";

export default {
    name: "deleterow",
    async execute(message, args){
        if(message.author.id != process.env.OWNER_ID){
            message.channel.send(`${SYMBOLS.cross} Not Authorized!`);
            return;
        }
        else{
            const key = args[0];
            const response = await rawDeleteFromCache(key);
            message.channel.send(response);
        }
    }


}
