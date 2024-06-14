/* global __base */
import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, TextBasedChannel, Message } from 'discord.js';

import playlist from '../../include/playlist';

module.exports = {
	data: new SlashCommandBuilder()
			.setName('playlist')
			.setDescription(i18n.__('playlist.description'))
			.addStringOption(options =>
				options.setName('playlist')
				.setDescription(i18n.__('playlist.option'))
				.setRequired(true)
			)
			.setDMPermission(false),

	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.deferred && !interaction.replied) {
			await interaction.deferReply({ ephemeral: true });
		}

		playlist(interaction);
	}

}


