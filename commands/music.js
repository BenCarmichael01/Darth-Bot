module.exports = {
    name: 'music',
    aliases: [],
    description: 'music command',
    args: true,
    usage: '',
    guildOnly: true,
    execute(message, args) {
        const queue = new Map();

        async function execute(message, serverQueue) {

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel)
                return message.channel.send(
                    "You need to be in a voice channel to play music!"
                );
            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send(
                    "I need the permissions to join and speak in your voice channel!"
                );
            }
            const songInfo = await ytdl.getInfo(args[1]);
            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
        }
       
        };
    },
};