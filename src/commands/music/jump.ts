import { canModifyQueue, LOCALE, MSGTIMEOUT, TESTING } from '../../include/utils';
import i18n from 'i18n';
import { ChatInputCommandInteraction, CommandInteraction, Constants, GuildMember, Message, SlashCommandAssertions, SlashCommandBuilder } from 'discord.js';
import { play } from '../../include/play';

if (LOCALE) i18n.setLocale(LOCALE);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jump')
		.setDescription(i18n.__('jump.description'))
		.addIntegerOption(option => 
			option.setName('number')
			.setDescription('Queue number to skip to')
			.setRequired(true)
			.setMinValue(1)
		),

		async execute(interaction: ChatInputCommandInteraction) {
			await interaction.deferReply({ ephemeral: true });

			if (!interaction.guild) return;
			const queue = interaction.client.queue.get(interaction.guild.id);
			if (!queue) {
				interaction.reply({
					content: i18n.__('jump.errorNotQueue'),
					ephemeral: true,
				});
				return;
			}

			if (interaction.member) {
				var member = interaction.member as GuildMember;
			} else {
				interaction.reply({ content: i18n.__('common.unknownError'), ephemeral: true });
				return;
			}

			if (!canModifyQueue(member)) {
				return interaction.reply({
					content: i18n.__('common.errorNotChannel'),
					ephemeral: true,
				});
			}

			const jumpTo = interaction.options.getInteger('number');
			if (!jumpTo) {
				interaction.reply({ content: i18n.__('common.unknownError'), ephemeral: true });
				return;
			}

			if (jumpTo > queue.songs.length) {
				return interaction.reply({
					content: i18n.__mf('jump.errorNotValid', {
						length: queue.songs.length,
					}),
					ephemeral: true,
				});
			}
			queue.playing = true;

			if (queue.loop) {
				for (let i = 0; queue.songs.length > 0 && i < jumpTo; i++) {
					queue.songs.push(queue.songs.shift()!); // Forcing non-null since its checked in the loop condition
				}
			} else {
				queue.songs = queue.songs.slice(jumpTo);
			}

			if (queue.player && queue.connection && queue.collector) {
				queue.collector.stop('skipSong');
				queue.connection.removeAllListeners();
				queue.player.removeAllListeners();
				queue.player.stop();
				play({
					song: queue.songs[0],
					interaction,
				});
			}

			interaction.reply({
				content: i18n.__mf('jump.success', { track: jumpTo }),
				ephemeral: true,
			});
			queue.textChannel
				.send(
					i18n.__mf('jump.result', {
						author: member.id,
						arg: jumpTo - 1,
					}),
				)
				.then((msg: Message) => {
					setTimeout(() => {
						msg.delete().catch(console.error);
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
}
