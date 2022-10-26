"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const youtube_ts_1 = tslib_1.__importDefault(require("youtube.ts"));
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const he_1 = tslib_1.__importDefault(require("he"));
const discordjs = tslib_1.__importStar(require("discord.js"));
const voice = tslib_1.__importStar(require("@discordjs/voice"));
const utils_1 = require("../../include/utils");
const responses_1 = require("../../include/responses");
const { MessageEmbed, MessageButton, MessageActionRow } = discordjs;
const youtube = new youtube_ts_1.default(utils_1.YOUTUBE_API_KEY);
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
exports.default = {
    name: 'search',
    category: 'music',
    description: i18n_1.default.__('search.description'),
    guildOnly: true,
    testOnly: utils_1.TESTING,
    slash: true,
    options: [
        {
            name: 'search',
            description: 'The term to search for',
            type: 'STRING',
            required: true,
        },
    ],
    async callback({ interaction, instance, args, }) {
        await interaction.deferReply({ ephemeral: true });
        if (typeof interaction.guildId === 'string') {
            var GUILDID = interaction.guildId;
        }
        else
            return;
        const settings = interaction.client.db.get(interaction.guildId);
        if (!settings?.musicChannel) {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.noSetup'), ephemeral: true });
            return;
        }
        var userVc;
        if ('voice' in interaction.member) {
            userVc = interaction.member.voice?.channel;
        }
        else {
            return await (0, responses_1.reply)({ interaction, content: i18n_1.default.__('search.errorNotChannel'), ephemeral: true });
        }
        if (!userVc) {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('play.errorNotChannel'), ephemeral: true });
            return;
        }
        const serverQueue = interaction.client.queue.get(GUILDID);
        const myVoice = voice.getVoiceConnection(GUILDID);
        if (serverQueue && myVoice && userVc.id !== myVoice.joinConfig.channelId) {
            (0, responses_1.reply)({
                interaction,
                content: i18n_1.default.__mf('play.errorNotInSameChannel', {
                    user: interaction.client.user,
                }),
                ephemeral: true,
            });
            return;
        }
        const search = args[0];
        let resultsEmbed = new MessageEmbed()
            .setTitle(i18n_1.default.__('search.resultEmbedTtile'))
            .setDescription(i18n_1.default.__mf('search.resultEmbedDesc', { search: search }))
            .setColor('#F8AA2A');
        try {
            const results = await youtube.videos.search({ q: search, maxResults: 5 });
            results.items.map((video, index) => {
                video.snippet.title = he_1.default.decode(video.snippet.title);
                let vidURL = `https://youtu.be/${video.id.videoId}`;
                resultsEmbed.addField(`${index + 1}. ${video.snippet.title}`, vidURL);
            });
            let searchEmbed = new MessageEmbed().setTitle('Searching...').setColor('#F8AA2A');
            await interaction.editReply({ embeds: [searchEmbed] });
            const buttons = [
                new MessageButton().setCustomId('one').setLabel('1').setStyle('PRIMARY'),
                new MessageButton().setCustomId('two').setLabel('2').setStyle('PRIMARY'),
                new MessageButton().setCustomId('three').setLabel('3').setStyle('PRIMARY'),
                new MessageButton().setCustomId('four').setLabel('4').setStyle('PRIMARY'),
                new MessageButton().setCustomId('five').setLabel('5').setStyle('PRIMARY'),
            ];
            const row = new MessageActionRow().addComponents(...buttons);
            await interaction.editReply({
                embeds: [resultsEmbed],
                components: [row],
            });
            const collector = await interaction
                .fetchReply()
                .then((reply) => {
                if ('createMessageComponentCollector' in reply) {
                    return reply.createMessageComponentCollector({
                        time: 30000,
                        componentType: 'BUTTON',
                    });
                }
            })
                .catch(console.error);
            if (!collector) {
                (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
                return;
            }
            collector.on('collect', async (i) => {
                await i.deferReply({ ephemeral: true });
                switch (i.customId) {
                    case 'one': {
                        const choice = resultsEmbed.fields[0].name;
                        instance.commandHandler
                            .getCommand('play')
                            .callback({ interaction: i, args: [choice] });
                        collector.stop('choiceMade');
                        break;
                    }
                    case 'two': {
                        const choice = resultsEmbed.fields[1].name;
                        instance.commandHandler
                            .getCommand('play')
                            .callback({ interaction: i, args: [choice] });
                        collector.stop('choiceMade');
                        break;
                    }
                    case 'three': {
                        const choice = resultsEmbed.fields[2].name;
                        instance.commandHandler
                            .getCommand('play')
                            .callback({ interaction: i, args: [choice] });
                        collector.stop('choiceMade');
                        break;
                    }
                    case 'four': {
                        const choice = resultsEmbed.fields[3].name;
                        instance.commandHandler
                            .getCommand('play')
                            .callback({ interaction: i, args: [choice] });
                        collector.stop('choiceMade');
                        break;
                    }
                    case 'five': {
                        const choice = resultsEmbed.fields[4].name;
                        instance.commandHandler
                            .getCommand('play')
                            .callback({ interaction: i, args: [choice] });
                        collector.stop('choiceMade');
                        break;
                    }
                }
            });
            collector.on('end', (_, reason) => {
                if (reason === 'time') {
                    const timeEmbed = new MessageEmbed()
                        .setTitle(i18n_1.default.__('search.timeout'))
                        .setColor('#F8AA2A');
                    interaction.editReply({
                        embeds: [timeEmbed],
                        components: [],
                    });
                }
            });
        }
        catch (error) {
            console.error(error);
        }
    },
};
//# sourceMappingURL=search.js.map