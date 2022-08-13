import { npMessage } from '../include/npmessage';
import { LOCALE } from '../include/utils';
import { Client, MessageButton, ButtonInteraction, ApplicationCommand } from 'discord.js';
import i18n from 'i18n';
import WOKCommands from 'wokcommands';

if (LOCALE) i18n.setLocale(LOCALE);

export default async (client: Client, instance: WOKCommands) => {
	const commands: Map<string, ApplicationCommand> = await instance.slashCommands.get();
};

const config = {
	displayName: 'Hides the testing commands',
	dbName: 'COMMAND_FIXER',
};

export { config };
