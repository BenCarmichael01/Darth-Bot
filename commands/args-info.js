module.exports = {
    name: 'args-info',
    description: 'Gives info about the supplied arguments',
    args: true,
    usage: '<arg1> <arg2> <arg3>...',
    guildOnly: true,
    execute(message, args) {
        if (args[0] === 'foo') {
            return message.channel.send('bar');
        }
        message.channel.send(`Arguments: ${args}\nArguments Length: ${args.length}`);
    },
};