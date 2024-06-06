import path from 'path';
import fs from 'fs';
import i18n from 'i18n';
import { Sequelize, STRING} from 'sequelize';
import { ApplicationCommand, channelLink, Client, Collection, Events, GatewayIntentBits, Message, REST, Routes, SlashCommandBuilder } from 'discord.js';
// import WOKCommands from 'wokcommands';
import 'dotenv/config';

global.__base = path.join(__dirname, '/');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildVoiceStates,
	],
});

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

client.db = sequelize.define('musicGuilds', {
	id: {
		type: STRING,
		unique: true,
		primaryKey: true,
	},
	musicChannel: {
		type: STRING,
		allowNull: false,	
	},
	playingMessage: {
		type: STRING,
		allowNull: false,
	}
})

// i18n locale config
i18n.configure({
	locales: ['en', 'es', 'ko', 'fr', 'tr', 'pt_br', 'zh_cn', 'zh_tw'],
	directory: path.join(__dirname, '..', 'locales'),
	defaultLocale: 'en',
	objectNotation: true,
	register: global,
	autoReload: true,

	logWarnFn: function warn(msg) {
		console.log('warn', msg);
	},

	logErrorFn: function err(msg) {
		console.log('error', msg);
	},

	missingKeyFn: function noKey(locale, value) {
		return value;
	},

	mustacheConfig: {
		tags: ['{{', '}}'],
		disable: false,
	},
});

if (process.argv[2] === 'dev') {
	var token = process.env.DISCORD_TOKEN_DEV;
	var clientId = process.env.CLIENT_ID_DEV;
	var guildId = process.env.TESTING_GUILD_ID;
} else {
	var token = process.env.DISCORD_TOKEN;
	var clientId = process.env.CLIENT_ID;
}

client.login(token);

client.queue = new Map();
// client.db = new Collection();
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const commands: SlashCommandBuilder[] = [];

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			commands.push(command.data.toJSON());

		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// client.on('debug', console.log);
client.on(Events.Warn, (info) => console.log(info));
client.on(Events.Error, (error) => console.error(error));

client.once(Events.ClientReady, async (client) => {
	console.log(`Logged in as ${client.user.username} (${client.user.id})`);
	client.db.sync({ force: true });

	try {
        if (!clientId || !guildId || !token) throw "Bad vars";

        const rest = new REST().setToken(token);

		console.log(`Started refreshing ${client.commands.size} application (/) commands.`);

		const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId),{ body: commands },) as Array<ApplicationCommand>;
		// const dataGlobal = await rest.put(Routes.applicationCommands(clientId),{ body: commands },) as Array<ApplicationCommand>;

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);

	} catch (error) {
		console.error(error);
	}
});

client.on(Events.MessageCreate, async (message: Message) => {
	if (message.author.bot) return;
	const { guildId } = message;

	const db = await client.db.findOne({where: {id: guildId}});
	
	if (!db) return;

	let MUSIC_CHANNEL_ID = db.get('musicChannel');

	if (message.channelId === MUSIC_CHANNEL_ID) {
		message.delete();
	} else return;
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}


})
