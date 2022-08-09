//@ts-check
import { canModifyQueue, LOCALE } from '../../include/utils';
import { npMessage } from '../../include/npmessage';
import { reply, followUp } from '../../include/responses';
import { Constants, CommandInteraction, GuildMember, Message } from 'discord.js';
import { Isong } from 'src/types';
import i18n from 'i18n';
import { ICommand } from 'wokcommands';

if (LOCALE) i18n.setLocale(LOCALE);

export default {
	name: 'remove',
	category: 'music',
	description: i18n.__('remove.description'),
	guildOnly: true,
	slash: true,
	options: [
		{
			name: 'firstsong',
			description: i18n.__('remove.optionDescription'),
			type: Constants.ApplicationCommandOptionTypes.INTEGER,
			required: true,
		},
		{
			name: 'secondsong',
			description: i18n.__('remove.optionDescription'),
			type: Constants.ApplicationCommandOptionTypes.INTEGER,
			required: false,
		},
		{
			name: 'thirdsong',
			description: i18n.__('remove.optionDescription'),
			type: Constants.ApplicationCommandOptionTypes.INTEGER,
			required: false,
		},
	],
	async callback({
		interaction,
		args,
	}: {
		interaction: CommandInteraction;
		args: Array<string>;
	}): Promise<Message | undefined> {
		await interaction.deferReply({ ephemeral: true });

		if (!interaction.guild) return;
		const queue = interaction.client.queue.get(interaction.guild.id);

		if (interaction.member) {
			var member = interaction.member as GuildMember;
		} else return; // TODO return error message

		if (!canModifyQueue(member)) {
			return reply({
				interaction,
				content: i18n.__('common.errorNotChannel'),
				ephemeral: true,
			});
		}
		if (!queue) {
			return reply({ interaction, content: i18n.__('remove.errorNotQueue'), ephemeral: true });
		}

		const songs = args.map((arg) => parseInt(arg, 10));
		const removed: Isong[] = [];

		queue.songs = queue.songs.filter((item, index) => {
			if (songs.find((songIndex) => songIndex === index)) {
				removed.push(item);
				return false;
			}
			return true;
		});
		npMessage({ interaction, npSong: queue.songs[0] });
		await reply({ interaction, content: 'Successfully removed song(s)', ephemeral: true });
		followUp({
			interaction,
			content: `<@${member.id}> ❌ removed: \n- **${removed
				.map((song) => song.title)
				.join('\n- ')}** \nfrom the queue.`,
			ephemeral: false,
		});
	},
} as ICommand;
