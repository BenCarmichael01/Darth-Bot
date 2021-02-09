const Discord = require('discord.js');
module.exports = {
	name: 'embed',
	usage: '<colour> <title> <url> <authorName> <authorImg> <authorURL> <description> <thumb> <fieldTitle> <fieldValue> <img> <footer>',
	execute(message, args) {
		const exampleEmbed = new Discord.MessageEmbed()
			.setColor(args[0])
			.setTitle(args[1])
			.setURL(args[2])
			.setAuthor(args[3], args[4], args[5])
			.setDescription(args[6])
			.setThumbnail(args[7])
			.addFields(
				{ name: args[8], value: args[9] },
				{ name: '\u200B', value: '\u200B' },
				{ name: 'Inline field title', value: 'Some value here', inline: true },
				{ name: 'Inline field title', value: 'Some value here', inline: true },
			)
			.addField('Inline field title', 'Some value here', true)
			.setImage(args[10])
			.setTimestamp()
			.setFooter(args[11], args[12]);
			
		//const test = new Discord.MessageEmbed()
			//.setTitle(args[0]);
		message.reply(exampleEmbed);
    }
};