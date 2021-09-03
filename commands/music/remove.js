const { canModifyQueue, LOCALE } = require("@util/utils");
const i18n = require("i18n");
const { Command } = require('@sapphire/framework');
i18n.setLocale(LOCALE);

const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;

module.exports = class removeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remove',
			group: 'music',
			memberName: 'remove',
			description: i18n.__("remove.description"),
			guildOnly: 'true',
			argsType: 'single'
		});
	}

	async run(message, args) {
		const queue = message.client.queue.get(message.guild.id);

		if (!queue) return message.channel.send(i18n.__("remove.errorNotQueue")).catch(console.error);
		if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");
		if (!args.length) return message.reply(i18n.__mf("remove.usageReply", { prefix: message.client.prefix }));

		//const args = args//.join("");
		const songs = args.split(",").map((arg) => parseInt(arg));
		let removed = [];

		if (pattern.test(args)) {
			queue.songs = queue.songs.filter((item, index) => {
				if (songs.find((songIndex) => songIndex - 1 === index)) removed.push(item);
				else return true;
			});

			queue.textChannel.send(
				`${message.author} ❌ removed **${removed.map((song) => song.title).join("\n")}** from the queue.`
			);
		} else if (!isNaN(args[0]) && args[0] >= 1 && args[0] <= queue.songs.length) {
			console.log("we got elsed!");
			return queue.textChannel.send(
				`${message.author} ❌ removed **${queue.songs.splice(args[0] - 1, 1)[0].title}** from the queue.`
			);
		} else {
			console.log("we got the last one");
			return message.reply(i18n.__mf("remove.usageReply", { prefix: message.client.prefix }));
		}
	}
};
