module.exports = {
    name: 'kick',
	description: 'Kick a user from server',
	args: true,
	usage: '@User-to-kick',
	guildOnly: true,
    execute(message, args) {
		//check if user is mentioned
		if (!message.mentions.users.size) {
			return message.reply('You need to tag a user in order to kick them!')
		}
		// grab the "first" mentioned user from the message
		// this will return a `User` object, just like `message.author`
		const taggedUser = message.mentions.users.first();

		message.channel.send(`You wanted to kick: ${taggedUser.username}`);
    },
};