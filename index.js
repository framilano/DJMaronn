import { Client, GatewayIntentBits } from 'discord.js';
import jsonData from './config.json' with { type: "json" };
import { Player } from 'discord-player';
import { SoundcloudExtractor  } from 'discord-player-soundcloud';
import { play, stop, skip, loop, filters } from './src/musicplayer.js';
import { autoCompleteSongs } from './src/autocomplete.js';
import { deleteOldBotMessagesCommand, checkCommandPermissions } from './src/discord-utils.js';
import { init_slash_commands } from './src/loader.js';
import { handle_events } from './src/events.js'
//import { ProxyAgent } from 'undici'

//Reloading slash Commands
init_slash_commands()

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages] });
const player = new Player(client);

//Handling Player events
handle_events(player, client)


/** 
  //Registering Youtube Extractor
  const proxyAgent = new ProxyAgent({
    uri: new URL(jsonData.proxyUrl)
  })
  const youtubeExtractorOptions = {
    "proxy": proxyAgent,
    "cookie": jsonData.cookie,
    generateWithPoToken: true,
    streamOptions: {
      useClient: "WEB_EMBEDDED"
    }
  }
  player.extractors.register(YoutubeiExtractor, youtubeExtractorOptions)
*/

// Enables default extractor
await player.extractors.register(SoundcloudExtractor);

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) await handleChatCommands(interaction);
	else if (interaction.isAutocomplete()) handleAutoComplete(interaction)
});

async function handleAutoComplete(interaction) {
  if (interaction.commandName == 'play') await autoCompleteSongs(interaction)
}

async function handleChatCommands(interaction) {
  if (interaction.commandName === 'delete-messages') {
    deleteOldBotMessagesCommand(interaction)
    return
  }

  if (!checkCommandPermissions(interaction)) return

  if (interaction.commandName === 'play') await play(interaction)
  if (interaction.commandName === 'stop') await stop(interaction)
  if (interaction.commandName === 'skip') await skip(interaction)
  if (interaction.commandName === 'loop') await loop(interaction)
  if (interaction.commandName === 'filters') await filters(interaction)
}

client.login(jsonData.token);