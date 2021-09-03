const { canModifyQueue, LOCALE } = require("../../util/utils");
const i18n = require("i18n");
const { Command } = require('@sapphire/framework');

i18n.setLocale(LOCALE);

module.exports = class resumeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'resume',
			group: 'music',
			memberName: 'resume',
			description: i18n.__('resume.description'),
			guildOnly: 'true',
		});
	}

	async run(message, args) {
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return message.reply(i18n.__("resume.errorNotQueue")).catch(console.error);
		if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");

		if (!queue.playing) {
			queue.playing = true;
			queue.connection.dispatcher.resume();
			return queue.textChannel
				.send(i18n.__mf("resume.resultNotPlaying", { author: message.author }))
				.catch(console.error);
		}

		return message.reply(i18n.__("resume.errorPlaying")).catch(console.error);
	}
};
