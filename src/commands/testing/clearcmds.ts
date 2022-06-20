/* eslint-disable no-unused-vars */

import discordjs from 'discord.js';
import { Client, CommandInteraction, Guild } from 'discord.js';
import { ICommand } from 'wokcommands';

export default {
	name: 'clearcmds',
	description: 'Deletes all Guild or Global commands for this bot',
	category: 'testing',
	testOnly: true,
	ownerOnly: true,
	slash: true,
	permissions: ['ADMINISTRATOR'],
	options: [
		{
			name: 'type',
			description: 'Delete Global or Guild Commands',
			type: discordjs.Constants.ApplicationCommandOptionTypes.STRING,
			choices: [
				{
					name: 'Guild',
					value: 'GUILD',
				},
				{
					name: 'Global',
					value: 'GLOBAL',
				},
			],
			required: true,
		},
	],

	async callback({
		interaction,
		guild,
		client,
		args,
	}: {
		interaction: CommandInteraction;
		guild: Guild;
		client: Client;
		args: string[];
	}) {
		if (args[0] === 'GLOBAL') {
			const commands = await client.application?.commands.fetch();
			commands?.each(async (command) => {
				await command.delete();
			});
			interaction.reply({ content: 'Deleted all global commands...', ephemeral: true });
		} else if (args[0] === 'GUILD') {
			guild.commands.cache.forEach((value, key) => {
				console.log(value.name);
				value.delete();
			});
			interaction.reply({ content: 'Deleted all guild-based commands...', ephemeral: true });
		}
	},
} as ICommand;
