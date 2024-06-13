import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default function makeButtons<ActionRowBuilder>(loop:boolean) {
    var buttons: ButtonBuilder[];
    if (loop === true) {
		buttons = [
			new ButtonBuilder().setCustomId('playpause').setEmoji('⏯').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('skip').setEmoji('⏭').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('loop').setEmoji('🔁').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('stop').setEmoji('⏹').setStyle(ButtonStyle.Secondary),
		];
    } else {
        buttons = [
			new ButtonBuilder().setCustomId('playpause').setEmoji('⏯').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('skip').setEmoji('⏭').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('stop').setEmoji('⏹').setStyle(ButtonStyle.Secondary),
		];
    }
		const row = new ActionRowBuilder<ButtonBuilder>().setComponents(...buttons);
        return row;
}