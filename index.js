import { Client, GatewayIntentBits } from 'discord.js';
import jsonData from './config.json' with { type: "json" };
import { Player } from 'discord-player';
import { YoutubeiExtractor } from "discord-player-youtubei"
import { play, stop, skip, loop } from './src/musicplayer.js';
import { deleteOldBotMessagesCommand, checkCommandPermissions } from './src/discord-utils.js';
import { init_slash_commands } from './src/loader.js';
import { handle_events } from './src/events.js'
import { ProxyAgent } from 'undici'
//Reloading slash Commands
init_slash_commands()

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages] });
const player = new Player(client);
//Handling Player events
handle_events(player, client)
//Registering Youtube Extractor
const proxyAgent = new ProxyAgent({
  uri: new URL(jsonData.proxyUrl)
})
const youtubeExtractorOptions = {
  //"proxy": proxyAgent
}
player.extractors.register(YoutubeiExtractor, youtubeExtractorOptions)

client.on('interactionCreate', async interaction => {

  if (interaction.commandName === 'delete-messages') {
    deleteOldBotMessagesCommand(interaction)
    return
  }

  if (!checkCommandPermissions(interaction)) return

  if (interaction.commandName === 'play') await play(interaction)
  if (interaction.commandName === 'stop') await stop(interaction)
  if (interaction.commandName === 'skip') await skip(interaction)
  if (interaction.commandName === 'loop') await loop(interaction)
});

client.login(jsonData.token);