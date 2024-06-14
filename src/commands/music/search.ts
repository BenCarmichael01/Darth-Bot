import YouTube from 'youtube.ts';
import i18n from 'i18n';
import he from 'he';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, VoiceBasedChannel, Guild, ButtonStyle, ComponentType, PermissionFlagsBits, TextBasedChannel, GuildTextBasedChannel, GuildBasedChannel, Message } from 'discord.js';
import * as voice from '@discordjs/voice';
import playdl, { SpotifyTrack, YouTubeVideo } from 'play-dl';


import { YOUTUBE_API_KEY, LOCALE, TESTING, MSGTIMEOUT } from '../../include/utils';
import { IQueue, Isong } from '../../types/types';
import { play } from '../../include/play';
import { npMessage } from '../../include/npmessage';
import { YoutubeVideoSearchItem } from 'youtube.ts';

const youtube = new YouTube(YOUTUBE_API_KEY);

if (LOCALE) i18n.setLocale(LOCALE);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription(i18n.__('search.description'))
		.addStringOption(option =>
			option.setName('search')
			.setDescription('The term to search for')
			.setRequired(true)
		)
		.setDMPermission(false),

	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		
		const {member, guild } = interaction;
		
		const db = await interaction.client.db.findOne({where: {id: interaction.guildId!}});
		if (!db) {
			await interaction.editReply({
				content: i18n.__('common.noSetup'),
			});
			return;
		}
		const musicChannelId = db.get('musicChannel');
		const guildId = db.get('id');
		if (!musicChannelId) {
			await interaction.editReply({
				content: i18n.__('common.noSetup'),
			});
			return;
		};
		
		if (!(guild instanceof Guild)) {
			interaction.editReply({
				 content: 'Cannot read guild from interaction.\nPlease contact my author!',
				});
				return;
		}

		const musicChannel = await interaction.guild!.channels.fetch(musicChannelId);
		const serverQueue = interaction.client.queue.get(guild.id);

		if (!musicChannel) {
			await interaction.editReply({
				content: i18n.__('common.noSetup'),
			});
			return;
		}

		let userVc: VoiceBasedChannel;
		let botVoiceChannel: VoiceBasedChannel|null;


		if ((member instanceof GuildMember) && member.voice.channel) {
			userVc = member.voice.channel;
		} else {
			interaction.editReply({
				content: i18n.__('play.errorNotChannel'),
			});
			return;
		}

		if (guild.members.me?.voice.channel) {
			botVoiceChannel = guild.members.me.voice.channel;

		} else {
			botVoiceChannel = null;
		}

		if (serverQueue && userVc !== botVoiceChannel) {
			interaction.editReply({
				content: i18n.__mf('play.errorNotInSameChannel', {
					user: interaction.client.user,
				}),
			});
			return;
		}


		const search = interaction.options.getString('search');
		if (!search) throw new Error('Unable to read search: getString() failed');

		let resultsEmbed = new EmbedBuilder()
			.setTitle(i18n.__('search.resultEmbedTtile'))
			.setDescription(i18n.__mf('search.resultEmbedDesc', { search: search }))
			.setColor('#F8AA2A');

		try {
			const results = await youtube.videos.search({ q: search, maxResults: 5 });
			// console.log(results.items[0].id);
			results.items.map((video:YoutubeVideoSearchItem, index:number) => {
				video.snippet.title = he.decode(video.snippet.title);
				let vidURL = `https://youtu.be/${video.id.videoId}`;
				
				resultsEmbed.addFields({name: `${index + 1}. ${video.snippet.title}`, value: vidURL});
			});
			let searchEmbed = new EmbedBuilder().setTitle('Searching...').setColor('#F8AA2A');

			await interaction.editReply({ embeds: [searchEmbed] });

			const buttons = [
				new ButtonBuilder().setCustomId('one').setLabel('1').setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId('two').setLabel('2').setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId('three').setLabel('3').setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId('four').setLabel('4').setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId('five').setLabel('5').setStyle(ButtonStyle.Primary),
			];
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

			await interaction.editReply({
				embeds: [resultsEmbed],
				components: [row],
			});

			const collector = await interaction
				.fetchReply()
				.then((reply) => {
					if ('createMessageComponentCollector' in reply) {
						return reply.createMessageComponentCollector({
							time: 30_000,
							componentType: ComponentType.Button,
						});
					}
				})
				.catch(console.error);

			if (!collector) {
				interaction.reply({ content: i18n.__('common.unknownError'), ephemeral: true });
				return;
			}
			collector.on('collect', async (i) => {
				await i.deferReply({ ephemeral: true });
				switch (i.customId) {
					case 'one': {
						let url = `https://youtu.be/${results.items[0].id.videoId}`;
						createSong(interaction, member, url, musicChannel );
						break;
					}
					case 'two': {
						let url = `https://youtu.be/${results.items[0].id.videoId}`;
						createSong(interaction, member, url, musicChannel );
						collector.stop('choiceMade');
						break;
					}
					case 'three': {
						let url = `https://youtu.be/${results.items[0].id.videoId}`;
						createSong(interaction, member, url, musicChannel );
						collector.stop('choiceMade');
						break;
					}
					case 'four': {
						let url = `https://youtu.be/${results.items[0].id.videoId}`;
						createSong(interaction, member, url, musicChannel );
						collector.stop('choiceMade');
						break;
					}
					case 'five': {
						let url = `https://youtu.be/${results.items[0].id.videoId}`;
						createSong(interaction, member, url, musicChannel );
						collector.stop('choiceMade');
						break;
					}
				}
			});
			collector.on('end', (_, reason) => {
				if (reason === 'time') {
					const timeEmbed = new EmbedBuilder()
						.setTitle(i18n.__('search.timeout'))
						.setColor('#F8AA2A');
					interaction.editReply({
						embeds: [timeEmbed],
						components: [],
					});
				}
			});
		} catch (error) {
			console.error(error);
		}
	}
}
async function createSong(
	interaction:ChatInputCommandInteraction,
	member: GuildMember,
	url: YouTubeVideo["url"], 
	musicChannel: GuildBasedChannel) {

		const userVc = member.voice.channel;
		if (!userVc) return;
		const permissions = userVc.permissionsFor(interaction.client.user);
		if (!permissions) {
			interaction.editReply({
				content: i18n.__('play.permsNotFound'),
			});
			return;
		}
		if (!permissions.has(PermissionFlagsBits.Connect)) {
			interaction.editReply({
				content: i18n.__('play.missingPermissionConnect'),
			});
			return;
		}
		if (!permissions.has(PermissionFlagsBits.Speak)) {
			interaction.editReply({
				content: i18n.__('play.missingPermissionSpeak'),
			});
			return;
		}

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
			interaction.editReply({
				content: i18n.__('play.missingSpot'),
			});
		}

		if (playdl.is_expired()) {
			await playdl.refreshToken(); // This will check if access token has expired. If yes, then refresh the token.
		}

		if (!(interaction.guild instanceof Guild)) {
			interaction.editReply({
				content: 'Cannot read guild from interaction.\nPlease contact my author!',
				});
				return;
		}
		
		const { guild} = interaction;
		const serverQueue = interaction.client.queue.get(guild.id);

		if (serverQueue?.timeout) {
			clearTimeout(serverQueue.timeout);
		}

		let song:Isong;

		
		try {
			let video = await youtube.videos.get(url);
			if (video) {
				let replaceDur = video.contentDetails.duration.replace("PT","").replace("M",":").replace("S","")
				let intermediate = replaceDur.split(':');
				let duration = parseInt(intermediate[0])*60 + parseInt(intermediate[1]); // duration seconds
				song = {
					title: he.decode(video.snippet.title),
					url,
					thumbUrl: video.snippet.thumbnails.high.url,
					duration,
				};
			} else {
				throw new Error('Search failed. Unable to get song info from youtube');
			};
		} catch (error) {
			if (!(error instanceof Error)) return;
			console.error(error);
			interaction.followUp({
				content: i18n.__mf('play.queueError', {
					error: error.message ? error.message : error,
				}),
				ephemeral: false,
			});
			return;
		}

		// if (!song) {
		// 	interaction.editReply({
		// 		content: i18n.__('play.songError'),
		// 	});
		// 	return;
		// } 

		if (serverQueue) {
			if (serverQueue.songs.length === 0) {
				serverQueue.songs.push(song);
				play({
					song: serverQueue.songs[0],
					interaction,
				});
				await songAdded(interaction, serverQueue, song);
				return;
			} else {
				serverQueue.songs.push(song);
				await songAdded(interaction, serverQueue, song);
			}
			}
		
		try {
			const currentConnection = voice.getVoiceConnection(guild.id!);
			
			const queueConstruct: IQueue = {
				textChannel: musicChannel as TextBasedChannel,
				collector: null,
				voiceChannel: userVc,
				connection: currentConnection ? currentConnection : 
					voice.joinVoiceChannel({
						channelId: userVc.id,
						guildId: userVc.guildId,
						selfDeaf: true,
						adapterCreator: userVc.guild.voiceAdapterCreator as voice.DiscordGatewayAdapterCreator,
						// TODO the type cast above is a temp workaround. discord js github issue #7273:
						// https://github.com/discordjs/discord.js/issues/7273
						// will be fixed in v14 not v13
					}),
				player: null,
				timeout: null,
				songs: [song],
				loop: false,
				playing: true,
			};
		
			interaction.client.queue.set(guild.id, queueConstruct);
			play({
				song: queueConstruct.songs[0],
				interaction,
			});
			await interaction.editReply({
				content: i18n.__('play.success'),
			});
			console.log(MSGTIMEOUT);
			queueConstruct.textChannel
				.send({
					content: i18n.__mf('play.queueAdded', {
						title: queueConstruct.songs[0].title,
						author: member.id,
					}),
				})
				.then((msg: Message) => {
					setTimeout(() => {
						msg.delete().catch(console.error);
					}, MSGTIMEOUT as number);
				})
				.catch(console.error);
			} catch (error) {
				if (!(error instanceof Error)) return;
		
				console.error(error);
				interaction.client.queue.delete(guild.id);
				let pcon = voice.getVoiceConnection(guild.id!);
				pcon?.destroy();
		
				interaction.followUp({
					content: i18n.__('play.cantJoinChannel', {
						error: error.message,
					}),
					ephemeral: true,
				});
			};
	
	}
async function songAdded(
		//message: Message | undefined,
		interaction: ChatInputCommandInteraction,
		serverQueue: IQueue,
		song: Isong) {
		if (!interaction || !(interaction.member instanceof GuildMember)) return; 
	
		npMessage({
			interaction,
			npSong: serverQueue.songs[0],
		});
		await interaction.editReply({
			content: i18n.__('play.success'),
		});
	
		serverQueue.textChannel
			.send(
				i18n.__mf('play.queueAdded', {
					title: song!.title,
					author: !interaction.member.id,
				}),
			)
			.then((msg: Message) => {
				setTimeout(() => msg.delete(), MSGTIMEOUT);
			})
			.catch(console.error);
	};