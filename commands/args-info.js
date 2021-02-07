module.exports = {
    name: 'ping',
    description: 'Ping!',
    args: true,
    usage: '<arg1> <args2> <args3>...',
    execute(message, args) {
        if (args[0] === 'foo') {
            return message.channel.send('bar');
        }
        message.channel.send(`Arguments: ${args}\nArguments Length: ${args.length}`);
    },
};