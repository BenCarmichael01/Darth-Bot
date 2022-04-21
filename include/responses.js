/* global __base */
const { MSGTIMEOUT } = require(`${__base}include/utils`);
const { Message, CommandInteraction } = require('discord.js');
module.exports = {
	/**
	 * Either replies to a discord message or interaction depending on which is passed to it
	 * @param {{message: Message, interaction: CommandInteraction, content: string, ephemeral: boolean}}
	 * @returns {Message} The outgoing message/interaction object
	 */
	reply({ message, interaction, content, ephemeral }) {
		if (message) {
			return message
				.reply(content)
				.then((msg) => {
					setTimeout(() => {
						message.delete();
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} else if (interaction) {
			if (ephemeral) {
				return interaction.editReply({ content, ephemeral });
			} else {
				return interaction
					.editReply({ content })
					.then((msg) => {
						setTimeout(() => {
							msg.delete();
						}, MSGTIMEOUT);
					})
					.catch(console.error);
			}
		}
	},
	/**
	 * Either replies to a discord message or interaction depending on which is passed to it
	 * @param {{message: Message, interaction: CommandInteraction, content: string, ephemeral: boolean}}
	 * @returns {Message} The outgoing message/interaction object
	 */
	followUp({ message, interaction, content, ephemeral }) {
		if (message) {
			return message.channel
				.send(content)
				.then((msg) => {
					setTimeout(() => {
						message.delete();
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} else if (interaction) {
			if (ephemeral) {
				return interaction.followUp({ content, ephemeral });
			} else {
				return interaction
					.followUp({ content })
					.then((msg) => {
						setTimeout(() => {
							msg.delete();
						}, MSGTIMEOUT);
					})
					.catch(console.error);
			}
		}
	},
};
