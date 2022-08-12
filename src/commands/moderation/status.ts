import i18n from 'i18n';
import { ICommand } from 'wokcommands';
import discordjs, { ActivityType } from 'discord.js';
import { ActivityTypes } from 'discord.js/typings/enums';
import { LOCALE, TESTING } from '../../include/utils';

if (LOCALE) i18n.setLocale(LOCALE);

export default {
	name: 'status',
	description: i18n.__('moderation.status.description'),
	category: 'moderation',
	ownerOnly: true,
	testOnly: TESTING,
	slash: true,
	options: [
		{
			name: 'activity',
			description: i18n.__('moderation.status.activityDesc'),
			type: 'STRING',
			required: true,
			choices: [
				{
					name: 'Playing',
					value: 'PLAYING',
				},
				{
					name: 'Watching',
					value: 'WATCHING',
				},
				{
					name: 'Streaming',
					value: 'STREAMING',
				},
				{
					name: 'Listening to',
					value: 'LISTENING',
				},
				{
					name: 'Competing in',
					value: 'COMPETING',
				},
			],
		},
		{
			name: 'status',
			description: i18n.__('moderation.status.statusDesc'),
			type: 'STRING',
			required: true,
		},
		{
			name: 'url',
			description: i18n.__('moderation.status.urlDesc'),
			type: 'STRING',
			required: false,
		},
	],
	async callback({ interaction, args, client }) {
		await interaction.deferReply({ ephemeral: true });

		const [activity, status, url] = args;
		try {
			if (client.user == null) {
				throw new Error("Client#User doesn't exist");
			}

			if (url && activity !== 'STREAMING') {
				interaction.followUp({ content: i18n.__('moderation.status.noURL') });
			}

			switch (activity) {
				case 'PLAYING': {
					client.user.setPresence({
						activities: [{ name: status, type: activity }],
					});
					break;
				}
				case 'WATCHING': {
					client.user.setPresence({
						activities: [{ name: status, type: activity }],
					});
					break;
				}
				case 'STREAMING': {
					client.user.setPresence({
						activities: [{ name: status, type: activity, url }],
					});
					break;
				}
				case 'LISTENING': {
					client.user.setPresence({
						activities: [{ name: status, type: activity }],
					});
					break;
				}
				case 'COMPETING': {
					client.user.setPresence({
						activities: [{ name: status, type: activity }],
					});
					break;
				}
				default: {
					throw new Error('Activity type does not exist');
				}
			}
		} catch (e) {
			interaction.editReply({
				content: i18n.__mf('moderation.status.error', { error: e }),
			});
			return;
		}
		interaction.editReply({ content: i18n.__('moderation.status.complete') });
		return;
	},
} as ICommand;
