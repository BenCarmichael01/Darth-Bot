import { canModifyQueue, LOCALE, MSGTIMEOUT, TESTING } from '../../include/utils';
import i18n from 'i18n';
import { reply } from '../../include/responses';
import { CommandInteraction, Constants, GuildMember, Message } from 'discord.js';
import { play } from '../../include/play';
import { ICommand } from 'wokcommands';

if (LOCALE) i18n.setLocale(LOCALE);

export default {
	name: 'jump',
	category: 'music',
	description: i18n.__('jump.description'),
	guildOnly: true,
	testOnly: TESTING,
	slash: true,
	options: [
		{
			name: 'number',
			description: 'Queue number to skip to',
			type: Constants.ApplicationCommandOptionTypes.INTEGER,
			minValue: 1,
			required: true,
		},
	],
	async callback({ interaction, args }: { interaction: CommandInteraction; args: string[] }) {
		await interaction.deferReply({ ephemeral: true });

		if (!interaction.guild) return;
		const queue = interaction.client.queue.get(interaction.guild.id);
		if (!queue) {
			reply({
				interaction,
				content: i18n.__('jump.errorNotQueue'),
				ephemeral: true,
			});
			return;
		}

		if (interaction.member) {
			var member = interaction.member as GuildMember;
		} else {
			reply({ interaction, content: i18n.__('common.unknownError'), ephemeral: true });
			return;
		}

		if (!canModifyQueue(member)) {
			return reply({
				interaction,
				content: i18n.__('common.errorNotChannel'),
				ephemeral: true,
			});
		}
		if (parseInt(args[0]) > queue.songs.length) {
			return reply({
				interaction,
				content: i18n.__mf('jump.errorNotValid', {
					length: queue.songs.length,
				}),
				ephemeral: true,
			});
		}
		queue.playing = true;

		if (queue.loop) {
			for (let i = 0; i < parseInt(args[0]); i++) {
				queue.songs.push(queue.songs.shift());
			}
		} else {
			queue.songs = queue.songs.slice(parseInt(args[0]));
		}

		if (queue.player && queue.connection) {
			queue.collector.stop('skipSong');
			queue.connection.removeAllListeners();
			queue.player.removeAllListeners();
			queue.player.stop();
			play({
				song: queue.songs[0],
				interaction,
			});
		}

		reply({
			interaction,
			content: i18n.__mf('jump.success', { track: args[0] }),
			ephemeral: true,
		});
		queue.textChannel
			.send(
				i18n.__mf('jump.result', {
					author: member.id,
					arg: parseInt(args[0]) - 1,
				}),
			)
			.then((msg: Message) => {
				setTimeout(() => {
					msg.delete().catch(console.error);
				}, MSGTIMEOUT);
			})
			.catch(console.error);
	},
} as ICommand;
