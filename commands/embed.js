const Discord = require('discord.js');
module.exports = {
	name: 'embed',
	usage: '<colour> <title> <url> <authorName> <authorImg> <authorURL> <description> <thumb> <fieldTitle> <fieldValue> <img> <footer>',
	execute(message, args) {
		const exampleEmbed = new Discord.MessageEmbed()
			.setColor(args[0])
			.setTitle(args[1])
			.setURL(args[2])
			//.setAuthor(args[3], args[4], args[5])
		if (args[3]) {
			exampleEmbed.setDescription('TEST');
        }
			exampleEmbed.setThumbnail(args[7])
			exampleEmbed.addFields(
				{ name: args[8], value: args[9] },
			)
		//const test = new Discord.MessageEmbed()
			//.setTitle(args[0]);
		message.reply(exampleEmbed);
    }
};
//TODO: add some way to check if an arg is present in cmd 