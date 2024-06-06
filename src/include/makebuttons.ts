import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default function makeButtons<ActionRowBuilder>(loop:boolean) {
    const buttons: ButtonBuilder[] = [];
    if (loop) {
		const buttons = [
			new ButtonBuilder().setCustomId('playpause').setEmoji('⏯').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('skip').setEmoji('⏭').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('loop').setEmoji('🔁').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('stop').setEmoji('⏹').setStyle(ButtonStyle.Secondary),
		];
    } else {
        const buttons = [
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