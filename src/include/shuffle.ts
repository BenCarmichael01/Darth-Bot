import { ButtonInteraction, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { myClient } from "src/types/types";
import { npMessage } from "./npmessage";
import { MSGTIMEOUT, canModifyQueue } from "./utils";
import i18n from 'i18n';


export function shuffle(interaction:ChatInputCommandInteraction | ButtonInteraction) {
   
    let guildId = interaction.guildId;
    if (!guildId) {
        return interaction.editReply({ content: i18n.__('common.unknownError') });
    }

    const client = interaction.client as myClient;
    const queue = client.queue.get(guildId);

    if (!queue) {
        return interaction.editReply({ content: i18n.__('shuffle.errorNotQueue')});
    }

    if (interaction.member instanceof GuildMember) {
        var guildMember = interaction.member as GuildMember;
    } else {
        interaction.editReply({ content: i18n.__('common.unknownError') });
        return;
    }
    
    if (!canModifyQueue(interaction.member)) {
        interaction
            .editReply({ content: i18n.__('common.errorNotChannel') })
            .then((reply) => {
                setTimeout(() => {
                    if ('delete' in reply) {
                        reply.delete().catch(console.error);
                    }
                }, MSGTIMEOUT as number);
            })
            .catch(console.error);
            return;
    }
    
    const { songs } = queue;
    for (let i = songs.length - 1; i > 1; i--) {
        let j = 1 + Math.floor(Math.random() * i);
        [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    queue.songs = songs;
    if (!interaction.guildId) return;
    interaction.client.queue.set(interaction.guildId, queue);
    npMessage({ interaction: interaction, npSong: songs[0] });
    
    interaction.editReply({
        content: i18n.__mf('shuffle.result', {
            author: interaction.member.id,
        }),
    })
        .then((reply) => {
            setTimeout(() => {
                    reply.delete().catch(console.error);
            }, MSGTIMEOUT as number);
        })
        .catch(console.error);
}
