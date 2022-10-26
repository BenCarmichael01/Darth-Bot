"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const tslib_1 = require("tslib");
const npmessage_1 = require("../include/npmessage");
const utils_1 = require("../include/utils");
const discord_js_1 = require("discord.js");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
async function messageStartup(musicGuilds, client) {
    for (let i = 0; i <= musicGuilds.length - 1; i++) {
        const npmessageOutput = await (0, npmessage_1.npMessage)({
            client,
            guildIdParam: musicGuilds[i],
        });
        let message = npmessageOutput.npmessage;
        let collector = npmessageOutput.collector;
        if (!message) {
            console.log('no npmessage found');
            continue;
        }
        if (!collector) {
            console.log('no collector found');
            continue;
        }
        let oldRow = message.components[0];
        for (let i = 0; i < oldRow.components.length; i++) {
            if (oldRow.components[i].customId === 'loop') {
                oldRow.components[i] = new discord_js_1.MessageButton()
                    .setCustomId('loop')
                    .setEmoji('🔁')
                    .setStyle('SECONDARY');
            }
        }
        message.edit({ components: [oldRow] });
        collector.on('collect', (i) => {
            const queue = i.client.queue.get(i.guildId);
            if (!queue || queue.songs.length === 0) {
                i.reply({
                    content: i18n_1.default.__('nowplaying.errorNotQueue'),
                    ephemeral: true,
                });
            }
        });
    }
}
async function isBotInGuild(guildId, client) {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (guild != null) {
            return true;
        }
    }
    catch (error) {
        return false;
    }
}
exports.default = (client) => {
    client.once('dbCached', async () => {
        const musicGuilds = [];
        await Promise.all(client.db.each(async (guildDb, id) => {
            let inGuild = await isBotInGuild(id, client);
            if (guildDb.musicChannel && inGuild) {
                musicGuilds.push(id);
            }
        }));
        messageStartup(musicGuilds, client);
    });
};
const config = {
    displayName: 'Now Playing Message Startup',
    dbName: 'NPMESSAGE_STARTUP',
};
exports.config = config;
//# sourceMappingURL=message-startup.js.map