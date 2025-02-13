import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { data as playerCommands } from '../commands/player-commands.js';
import { data as maintenanceCommands } from '../commands/maintenance-commands.js';
import config from ".././config.json" with {type: "json"};

export function init_slash_commands() {
	const commands = [];
	
	//Importo i comandi del player
	for (const singleCommand of playerCommands) {
		commands.push(singleCommand);
	}
	
	//Importo i comandi del player
	for (const singleCommand of maintenanceCommands) {
		commands.push(singleCommand);
	}
	
	//Updating slash commands
	const rest = new REST().setToken(config.token);
	(async () => {
		try {
			await rest.put(
				Routes.applicationCommands(config.clientId),
				{ body: commands },
			);
	
			console.log('Successfully reloaded application (/) commands.');
		} catch (error) {
			console.error(error);
		}
	})();
}
