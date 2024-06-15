import { ChatInputCommandInteraction, GuildMember, Message, PermissionFlagsBits, TextBasedChannel } from "discord.js";
import playdl from 'play-dl';
import { IQueue, Isong } from "src/types/types";
import he from "he";
import YouTubeAPI from 'simple-youtube-api';
import * as voice from '@discordjs/voice';
import i18n from 'i18n';


import { LOCALE, MAX_PLAYLIST_SIZE, MSGTIMEOUT } from "./utils";
import { play } from "./play";
import { npMessage } from "./npmessage";


if (LOCALE) i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(process.env.YOUTUBE_API_KEY);

export default async function playlist(interaction:ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
        interaction.editReply({ content: i18n.__('common.unknownError')});
        return;
    }
    
    const db = await interaction.client.db.findOne({where: {id: interaction.guildId!}});
    if (!db) {
        await interaction.editReply({
            content: i18n.__('common.noSetup'),
        });
        return;
    }
    const musicChannelId = db.get('musicChannel');
    if (!musicChannelId) {
        await interaction.editReply({
            content: i18n.__('common.noSetup'),
        });
        return;
    };

    const musicChannel = await interaction.guild.channels.fetch(musicChannelId);
    const member = interaction.member as GuildMember;
    if (!member.voice.channel) {
        interaction.editReply({ content: i18n.__('play.errorNotChannel')});
        return;
    }
    const userVc = member.voice.channel;

    const serverQueue = interaction.client.queue.get(interaction.guild.id);
    const me = interaction.guild.members.me;
    if (me) {
        var permissions = userVc.permissionsFor(me);
    } else {
        interaction.editReply({ content: i18n.__('common.unknownError') });
        return;
    }

    if (!permissions.has(PermissionFlagsBits.Connect)) {
        interaction.editReply({
            content: i18n.__('playlist.missingPermissionConnect'),
        });
        return;
    }
    if (!permissions.has(PermissionFlagsBits.Speak)) {
        interaction.editReply({
            content: i18n.__('missingPermissionSpeak'),
        });
        return;
    }

    if (serverQueue && me.voice.channel && (userVc.id !== me.voice.channel.id)) {
        interaction.editReply({
            content: i18n.__mf('play.errorNotInSameChannel', {
                user: me.id,
            }),
        });
        return;
    }
    // isYt goes here
    if (
        process.env.SPOTIFY_CLIENT &&
        process.env.SPOTIFY_SECRET &&
        process.env.SPOTIFY_REFRESH &&
        process.env.SPOTIFY_MARKET
    ) {
        await playdl.setToken({
            spotify: {
                client_id: process.env.SPOTIFY_CLIENT,
                client_secret: process.env.SPOTIFY_SECRET,
                refresh_token: process.env.SPOTIFY_REFRESH,
                market: process.env.SPOTIFY_MARKET,
            },
        });
    } else {
        interaction.editReply({ content: i18n.__('play.missingSpot')});
    }

    if (playdl.is_expired()) {
        await playdl.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
    }
    const playlist = interaction.options.getString('playlist');
    var url = playlist ? playlist : interaction.options.getString('song');
    if (!url) {
        interaction.editReply({ content: 'Cannot read supplied playlist. Please try again'});
        return;
    }
    const isSpotify = playdl.sp_validate(url);
    const isYt = playdl.yt_validate(url);

    // TODO does this need to be stored? interaciton.editReply() should work if needed
    const searchingReply = await interaction.editReply({
        content: i18n.__('playlist.searching'),
    });

    var videos: Isong[] = [];
    var playlistTitle: string;
    if (isYt === 'playlist') {
        try {
            let playlist = await playdl.playlist_info(url, { incomplete: true });
            if (!playlist.title) return;
            playlistTitle = playlist.title;
            await playlist.fetch(MAX_PLAYLIST_SIZE);
            const vidInfo = playlist.page(1);
            vidInfo.slice(0, MAX_PLAYLIST_SIZE + 1).forEach((video) => {
                if (!video.title) return;
                let song = {
                    title: he.decode(video.title),
                    url: video.url,
                    thumbUrl: video.thumbnails[video.thumbnails.length - 1].url,
                    duration: video.durationInSec,
                };
                videos.push(song);
            });
            
        } catch (error) {
            console.error(error);
            
            interaction.editReply({
                content: i18n.__('playlist.errorNotFoundPlaylist'),
            });
            return;
        }
    } else if (isSpotify === 'playlist' || isSpotify === 'album') {
        try {
            let playlist = await playdl.spotify(url);
            if ('fetch' in playlist) {
                await playlist.fetch();
            }
            playlistTitle = playlist.name;
            if ('page' in playlist) {
                var tracks = playlist.page(1)!;
            } else {
                interaction.editReply({  content: i18n.__('common.unknownError')});
                return;
            }

            if (tracks.length > MAX_PLAYLIST_SIZE) {
                interaction.editReply({
                    content: i18n.__mf('playlist.maxSize', { maxSize: MAX_PLAYLIST_SIZE }),
                });
            }
            for (let i = 0; i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 20) && i < tracks.length; i++) {
                let search = tracks[i].name + ' ' + tracks[i].artists[0].name;
                const results = await youtube.searchVideos(search, 1, {
                    part: 'snippet.title, snippet.maxRes, snippet.durationSeconds',
                });
                const searchResult = results[0];
                if (!searchResult) continue;
                let song = {
                    title: he.decode(searchResult?.title),
                    url: searchResult?.url,
                    thumbUrl: searchResult?.maxRes.url,
                    duration: searchResult?.durationInSec,
                };
                videos.push(song);
            }
        } catch (error:any) {
            console.error(error);
            interaction.editReply({ content: error });
            return;
        }
    } else {
        interaction.editReply({ content: i18n.__('playlist.notPlaylist') });
        return;
    }
    // else {
    // 	try {
    // 		let [playlist] = await playdl.search(search, {
    // 			source: { youtube: 'playlist' },
    // 			limit: 1,
    // 		});
    // 		await playlist.all_videos();
    // 		for (
    // 			let i = 0;
    // 			i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) && i < playlist.videos.length;
    // 			i++
    // 		) {
    // 			let video = playlist.videos[i];
    // 			let song = {
    // 				title: video.title,
    // 				url: video.url,
    // 				thumbUrl: video.thumbnails[search.thumbnails.length - 1].url,
    // 				duration: video.durationInSec,
    // 			};
    // 			videos.push(song);
    // 		}
    // 		if (message) {
    // 			searching.delete().catch(console.error);
    // 		}
    // 	} catch (error) {
    // 		if (message) {
    // 			searching.delete().catch(console.error);
    // 		}
    // 		console.error(error);
    // 		return reply({ message, interaction, content: error.message, ephemeral: true });
    // 	}
    // }
    
    // TODO this could be refactored. If server queue exists then songs.length should not be zero?
    if (serverQueue) {
        if (serverQueue.songs.length === 0) {
            serverQueue.songs.push(...videos);
            play({
                song: serverQueue.songs[0],
                interaction,
            });
            await songAdded( interaction, serverQueue, playlistTitle);
            return;
        } else {
            serverQueue.songs.push(...videos);
            await songAdded(interaction, serverQueue, playlistTitle);
        }
    }
    try {
        const currentConnection = voice.getVoiceConnection(interaction.guild.id);

        const queueConstruct: IQueue = {
            textChannel: musicChannel as TextBasedChannel, // type is verified before adding to db. 
            collector: null,
            voiceChannel: userVc,
            connection: currentConnection ? currentConnection: 
                voice.joinVoiceChannel({
                    channelId: userVc.id,
                    guildId: userVc.guildId,
                    adapterCreator: userVc.guild.voiceAdapterCreator as voice.DiscordGatewayAdapterCreator,
                    // TODO the type cast above is a temp workaround. discord js github issue #7273:
                    // https://github.com/discordjs/discord.js/issues/7273
                    // will be fixed in v14 not v13 - still not fixed in v14
                    }),
            player: null,
            timeout: null,
            songs: [...videos],
            loop: false,
            playing: true,
        };
        interaction.client.queue.set(interaction.guild.id, queueConstruct);
        const finalQueue = interaction.client.queue.get(interaction.guild.id);
        finalQueue?.textChannel.send({
            content: i18n.__mf('playlist.queueAdded', {
                playlist: playlistTitle,
                author: member.id,
            }),
        })
        .then((msg: Message) => {
            setTimeout(() => {
                msg.delete().catch(console.error);
            }, MSGTIMEOUT);
        })
        .catch(console.error);
        play({ song: queueConstruct.songs[0], interaction });
    } catch (error) {
        console.error(error);
        interaction.client.queue.delete(interaction.guild.id);
        let pcon = voice.getVoiceConnection(interaction.guild.id);
        pcon?.destroy();
        interaction.followUp({
            content: i18n.__mf('play.cantJoinChannel', { error }),
            ephemeral: true,
        });
        return;
    }
}

async function songAdded(
	interaction: ChatInputCommandInteraction,
	serverQueue: IQueue,
	playlistTitle: string
) {
	if (!interaction.member) return;
	npMessage({
		interaction,
		npSong: serverQueue.songs[0],
	});
	await interaction.editReply({
		content: i18n.__('playlist.success'),
	});
	await serverQueue.textChannel
		.send({
			content: i18n.__mf('playlist.queueAdded', {
				playlist: playlistTitle,
				author: interaction.member.user.id,
			}),
		})
		.then((msg: Message) => {
			setTimeout(() => {
				msg.delete().catch(console.error);
			}, MSGTIMEOUT);
		})
		.catch(console.error);
		return;
}