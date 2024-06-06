import i18n from 'i18n';
import { ActivityType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { LOCALE, TESTING } from '../../include/utils';

if (LOCALE) i18n.setLocale(LOCALE);
module.exports = {
	data: new SlashCommandBuilder()
			.setName('status')
			.setDescription(i18n.__('moderation.status.description'))
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
			.addStringOption(option =>
				option.setName('activity')
					.setDescription(i18n.__('moderation.status.activityDesc'))
					.setRequired(true)
					.addChoices(
						{ name: 'Playing', value: 'PLAYING'},
						{ name: 'Watching', value: 'WATCHING'},
						{ name: 'Streaming', value: 'STREAMING'},
						{ name: 'Listening to', value: 'LISTENING'},
						{ name: 'Competing in', value: 'COMPETING'},
					))
			.addStringOption(option => 
				option.setName('status')
				.setDescription(i18n.__('moderation.status.statusDesc'))
				.setRequired(true)
			)
			.addStringOption(option =>
				option.setName('url')
				.setDescription(i18n.__('moderation.status.urlDesc'))
				.setRequired(false)
			),

			async execute(interaction: ChatInputCommandInteraction) {
				await interaction.deferReply({ ephemeral: true });
		
				const activity = interaction.options.getString('activity');
				const status = interaction.options.getString('status');
				const url = interaction.options.getString('url');
				const client =interaction.client;

				try {
					if (client.user == null) {
						throw new Error("Client#User doesn't exist");
					}

					if (!activity ) {
						throw new Error('Unable to read activity from command');
					} else if (!status) {
						throw new Error('Unable to read status from command');
					}
					if (activity === 'STREAMING' && !url) {
						throw new Error('You must provide a url if you chose the Streaming activity');
					}
		
					if (url && activity !== 'STREAMING') {
						interaction.followUp({ content: i18n.__('moderation.status.noURL') });
					}
		
					switch (activity) {
						case 'PLAYING': {
							client.user.setPresence({
								activities: [{ name: status, type: ActivityType.Playing }],
							});
							break;
						}
						case 'WATCHING': {
							client.user.setPresence({
								activities: [{ name: status, type: ActivityType.Watching }],
							});
							break;
						}
						case 'STREAMING': {
							if (!url) throw new Error('Url not provided');
							client.user.setPresence({
								activities: [{ name: status, type: ActivityType.Streaming, url }],
							});
							break;
						}
						case 'LISTENING': {
							client.user.setPresence({
								activities: [{ name: status, type: ActivityType.Listening }],
							});
							break;
						}
						case 'COMPETING': {
							client.user.setPresence({
								activities: [{ name: status, type: ActivityType.Competing }],
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

}