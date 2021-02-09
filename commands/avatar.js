module.exports = {
    name: 'avatar',
    aliases: ['icon', 'pfp'],
    description: 'Displays user\'s avatar',
    args: true,
    usage: '@<user>',
    guildOnly: true,
    execute(message, args) {
        message.channel.send('<image>');
    },
};