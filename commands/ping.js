module.exports = {
    name: 'ping',
    description: 'Ping!',
    args: false,
    cooldown: 5,
    usage: 'Ping!',
    guildOnly: false,
    execute(message, args) {
        message.channel.send('Pong');
    },
};