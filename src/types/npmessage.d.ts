import Discord from 'discord.js';
declare module "npmessage.ts" {
	export function npMessage(args:{ client:Discord.Client, npSong: any, guildIdParam: string, interaction: Discord.Interaction, message: Discord.Message }): Array<any>;
}