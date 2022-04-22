/* global __base */
const { MSGTIMEOUT } = require(`${__base}include/utils`);
module.exports = {
	/**
	 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
	 * @typedef {import('discord.js').Message} Message
	 */
	/**
	 * Either replies to a discord message or interaction depending on which is passed to it
	 * @param {{message: Message, interaction: CommandInteraction, content: string, ephemeral: boolean}}
	 * @returns {Promise<Message>} The outgoing message/interaction object
	 */
	async reply({ message, interaction, content, ephemeral, embed }) {
		if (message && !embed) {
			return message
				.reply({ content })
				.then((msg) => {
					setTimeout(() => {
						message.delete();
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} else if (message && embed) {
			return message
				.reply({ content, embeds: [embed] })
				.then((msg) => {
					setTimeout(() => {
						message.delete();
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} else if (interaction) {
			if (ephemeral && embed) {
				return interaction.editReply({ content, ephemeral, embeds: [embed] });
			} else if (ephemeral && !embed) {
				return interaction.editReply({ content, ephemeral });
			} else if (!ephemeral && embed) {
				return interaction
					.editReply({ content, embeds: [embed] })
					.then((msg) => {
						setTimeout(() => {
							msg.delete();
						}, MSGTIMEOUT);
					})
					.catch(console.error);
			} else if (!ephemeral && !embed) {
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
	 * @returns {Promise<Message>} The outgoing message/interaction object
	 */
	async followUp({ message, interaction, content, ephemeral, embed }) {
		if (message && !embed) {
			return message.channel
				.send(content)
				.then((msg) => {
					setTimeout(() => {
						message.delete();
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} else if (message && embed) {
			return message.channel
				.send({ content, embeds: [embed] })
				.then((msg) => {
					setTimeout(() => {
						message.delete();
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} else if (interaction) {
			if (ephemeral && embed) {
				return interaction.followUp({ content, ephemeral, embeds: [embed] });
			} else if (ephemeral && !embed) {
				return interaction.followUp({ content, ephemeral });
			} else if (!ephemeral && embed) {
				return interaction
					.followUp({ content, embeds: [embed] })
					.then((msg) => {
						setTimeout(() => {
							msg.delete();
						}, MSGTIMEOUT);
					})
					.catch(console.error);
			} else if (!ephemeral && !embed) {
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
