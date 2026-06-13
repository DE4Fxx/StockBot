export default {
    name: 'say',
    execute(message,args){
        message.channel.send(args.join(' '));
    }

}