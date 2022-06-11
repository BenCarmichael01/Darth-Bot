/* global __base */
const { MSGTIMEOUT } = require(`${__base}include/utils`);
import { Message, CommandInteraction, ButtonInteraction } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';
/**
 * Either replies to a discord message or interaction depending on which is passed to it
 * @param {{message: Message, interaction: CommandInteraction, content: string, ephemeral: boolean}}
 * @returns {Promise<Message>} The outgoing message/interaction object
 */
export async function reply({
	message,
	interaction,
	content,
	ephemeral,
}: {
	message?: Message;
	interaction?: CommandInteraction | ButtonInteraction;
	content: string;
	ephemeral?: boolean;
}): Promise<Message | undefined> {
	if (message) {
		return message
			.reply(content)
			.then((msg: Message) => {
				setTimeout(() => {
					msg.delete().catch();
				}, MSGTIMEOUT);
				return msg;
			})
			.catch((error) => {
				console.error(error);
				return undefined;
			});
	} else if (interaction) {
		if (ephemeral) {
			return Promise.resolve(interaction.editReply({ content }) as Promise<Message>);
		} else {
			if ('command' in interaction) {
				return interaction
					.editReply({ content })
					.then((msg) => {
						setTimeout(() => {
							if ('delete' in msg) {
								msg.delete().catch(console.error);
							}
						}, MSGTIMEOUT);
						return msg;
					})
					.catch((error) => {
						console.error(error);
						return undefined;
					}) as Promise<Message>;
			}
		}
	}
}
/**
 * Either replies to a discord message or interaction depending on which is passed to it
 * @param {{message: Message, interaction: CommandInteraction, content: string, ephemeral: boolean}}
 * @returns {Promise<Message>} The outgoing message/interaction object
 */
export function followUp({
	message,
	interaction,
	content,
	ephemeral,
}: {
	message?: Message;
	interaction?: CommandInteraction | ButtonInteraction;
	content: string;
	ephemeral?: boolean;
}): Promise<Message | void> | undefined {
	if (message) {
		return message.channel
			.send(content)
			.then((msg) => {
				setTimeout(() => {
					// message.delete();
					msg.delete().catch();
				}, MSGTIMEOUT);
			})
			.catch(console.error);
	} else if (interaction) {
		if (ephemeral === true) {
			return Promise.resolve(interaction.followUp({ content, ephemeral }) as Promise<Message>);
		} else {
			return interaction
				.followUp({ content })
				.then((msg) => {
					setTimeout(() => {
						if ('delete' in msg) {
							msg.delete().catch();
						}
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
	}
}
