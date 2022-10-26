"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const voice = tslib_1.__importStar(require("@discordjs/voice"));
const utils_1 = require("../../include/utils");
const upsert_1 = require("../../include/upsert");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
async function runSetup(interaction, channelTag, client, guild) {
    await interaction.reply({
        content: i18n_1.default.__mf('moderation.setup.start', { channel: channelTag }),
        ephemeral: true,
        components: [],
    });
    const connection = voice.getVoiceConnection(interaction.guildId);
    const queue = interaction.client.queue.get(interaction.guildId);
    if (queue && queue.player) {
        try {
            queue.player.stop();
        }
        catch (error) {
            console.error(error);
        }
        connection.destroy();
        interaction.client.queue.delete(interaction.guildId);
    }
    try {
        const musicChannel = interaction.guild?.channels.cache.get(channelTag);
        if (!musicChannel || musicChannel.type != 'GUILD_TEXT') {
            interaction.followUp({
                content: i18n_1.default.__('moderation.setup.notChannel'),
                ephemeral: true,
            });
            return;
        }
        await musicChannel?.bulkDelete(100, true);
        const outputQueue = i18n_1.default.__('npmessage.emptyQueue');
        const newEmbed = new discord_js_1.MessageEmbed()
            .setColor('#5865F2')
            .setTitle(i18n_1.default.__('npmessage.title'))
            .setURL('')
            .setImage('https://i.imgur.com/TObp4E6.jpg')
            .setFooter({ text: i18n_1.default.__('npmessage.footer') });
        const buttons = [
            new discord_js_1.MessageButton().setCustomId('playpause').setEmoji('⏯').setStyle('SECONDARY'),
            new discord_js_1.MessageButton().setCustomId('skip').setEmoji('⏭').setStyle('SECONDARY'),
            new discord_js_1.MessageButton().setCustomId('loop').setEmoji('🔁').setStyle('SECONDARY'),
            new discord_js_1.MessageButton().setCustomId('shuffle').setEmoji('🔀').setStyle('SECONDARY'),
            new discord_js_1.MessageButton().setCustomId('stop').setEmoji('⏹').setStyle('SECONDARY'),
        ];
        const row = new discord_js_1.MessageActionRow().addComponents(...buttons);
        const playingMessage = await musicChannel.send({
            content: outputQueue,
            embeds: [newEmbed],
            components: [row],
        });
        const collector = playingMessage.createMessageComponentCollector({ componentType: 'BUTTON' });
        collector.on('collect', (i) => {
            if (!i.isButton())
                return;
            const queue = client.queue.get(i.guildId);
            if (!queue) {
                i.reply({ content: i18n_1.default.__mf('nowplaying.errorNotQueue'), ephemeral: true });
            }
        });
        const doc = await (0, upsert_1.upsert)({
            _id: guild.id,
            musicChannel: musicChannel.id,
            playingMessage: playingMessage.id,
        });
        const MUSIC_CHANNEL_ID = doc?.musicChannel;
        const PLAYING_MESSAGE_ID = doc?.playingMessage;
        if (MUSIC_CHANNEL_ID === channelTag && PLAYING_MESSAGE_ID === playingMessage.id) {
            client.db.set(guild.id, {
                musicChannel: MUSIC_CHANNEL_ID,
                playingMessage: PLAYING_MESSAGE_ID,
            });
            interaction.followUp({
                content: i18n_1.default.__mf('moderation.setup.success', { MUSIC_CHANNEL_ID }),
                ephemeral: true,
            });
        }
        else {
            interaction.followUp({
                content: i18n_1.default.__mf('moderation.setup.fail'),
                ephemeral: true,
            });
        }
    }
    catch (e) {
        var e;
        if (typeof e === 'string') {
            var error = e;
        }
        else if (e instanceof Error) {
            var error = e.message;
        }
        else
            return;
        console.error(error);
        interaction.followUp({
            content: i18n_1.default.__('moderation.setup.error', { error }),
            ephemeral: true,
        });
    }
}
exports.default = {
    name: 'setup',
    category: 'moderation',
    description: i18n_1.default.__('moderation.setup.description'),
    guildOnly: true,
    testOnly: utils_1.TESTING,
    slash: true,
    ownerOnly: true,
    options: [
        {
            name: 'channel',
            description: i18n_1.default.__('moderation.setup.optionDescription'),
            type: 'CHANNEL',
            channelTypes: ['GUILD_TEXT'],
            required: true,
        },
    ],
    async callback({ interaction, args, guild, client, }) {
        let channelTag = args[0];
        const buttons = [
            new discord_js_1.MessageButton()
                .setCustomId('yes')
                .setStyle('SUCCESS')
                .setLabel(i18n_1.default.__('moderation.setup.continue')),
            new discord_js_1.MessageButton()
                .setCustomId('no')
                .setStyle('DANGER')
                .setLabel(i18n_1.default.__('moderation.setup.cancel')),
        ];
        const row = new discord_js_1.MessageActionRow().addComponents(...buttons);
        const warning = await interaction.reply({
            content: i18n_1.default.__('moderation.setup.warning'),
            ephemeral: true,
            components: [row],
            fetchReply: true,
        });
        if ('awaitMessageComponent' in warning) {
            warning
                .awaitMessageComponent({ componentType: 'BUTTON', time: 20000 })
                .then((i) => {
                if (i.customId === 'yes') {
                    runSetup(i, channelTag, client, guild);
                }
                else {
                    i.reply({ content: i18n_1.default.__('moderation.setup.cancelled'), ephemeral: true });
                }
            })
                .catch(console.error);
        }
    },
};
//# sourceMappingURL=setup.js.map