import { LOCALE } from '../../include/utils';
import i18n from 'i18n';
import { ChatInputCommandInteraction, GuildMember, Message, SlashCommandBuilder } from 'discord.js';
import { shuffle } from '../../include/shuffle';

if (LOCALE) i18n.setLocale(LOCALE);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription(i18n.__('shuffle.description')),

	async execute(interaction:ChatInputCommandInteraction) {
		try {
			await interaction.deferReply();

			shuffle(interaction);

			return;
		} catch (error) {
			console.error(error);
		}
	}
}
