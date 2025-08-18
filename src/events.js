import { Player, GuildQueueEvent, QueueRepeatMode } from "discord-player";
import { Client, ActivityType, Events } from "discord.js";
import { sendEmbedded, error, deleteOldBotMessages } from "./discord-utils.js";

const funny_things_to_do = [
  "Sta superando il round 34 su Kino 🧟", 
  "Sta raggiungendo GranMaster su Paladins 💎",
  "Sta salvando la Super Terra dagli Automaton 🤖",
  "Sta aspettando Paladins 2 😔",
  "Sta facendo una tripla con Lux 🎥",
  "Sta sparando dall'altra macchina 🚗",
  "Sta facendo un Easter Egg 🐣"
]

/**
 * Enqueue song
 * @param {Player} player 
 * @param {Client} client 
 */
export function handle_events (player, client) {
    player.events.on('error', (queue, errorObj) => {
        // Emitted when the player queue encounters error
        error(null, `General player error event: ${errorObj.message}`);
        error(null, errorObj);
    });
    
    player.events.on('playerError', (queue, errorObj) => {
        // Emitted when the audio player errors while streaming audio track
        error(null, `Player error event: ${error.errorObj}`);
        error(null, errorObj);
    });
    
    player.events.on(GuildQueueEvent.PlayerStart, async (queue, track) => {    
        client.user.setPresence({
            activities: [{
                name: `Sta ascoltando ${track.cleanTitle}`,
                type: ActivityType.Custom,
                url: track.url
            }],
            status: 'online'
        });
    
        await sendEmbedded({
            title: `Now playing: ${track.title}`,
            msgSource: queue.metadata.channel,
            url: track.url,
            thumbnail: track.thumbnail ? track.thumbnail : null,    //Checking if thumbnail is something first...
            description: `There are still ${queue.size} songs in queue`,
            color: "#181818",
            listOfFields: [
                { name: "Duration", value: track.duration, inline: true },
                { name: "Views", value: track.views, inline: true },
                { name: "Author", value: track.author, inline: true },
                { name: "LoopMode", value: Object.keys(QueueRepeatMode).find(key => QueueRepeatMode[key] == queue.repeatMode), inline: true },
                { name: "IsLive", value: track.live, inline: true },
                { name: "RequestedBy", value: queue.metadata.requestedBy, inline: true }
            ]
        })
    
    });
    
    player.events.on(GuildQueueEvent.PlayerFinish, async (queue, track) => {
        const { channel } = queue.metadata;
        client.user.setPresence({
            activities: [{
                name: funny_things_to_do[Math.floor(Math.random() * funny_things_to_do.length)],
                type: ActivityType.Custom,
            }],
            status: 'online'
        });
        deleteOldBotMessages(channel)
    });

    player.events.on(GuildQueueEvent.EmptyChannel, async (queue, track) => {
        const { channel } = queue.metadata;
        client.user.setPresence({
            activities: [{
                name: funny_things_to_do[Math.floor(Math.random() * funny_things_to_do.length)],
                type: ActivityType.Custom,
            }],
            status: 'online'
        });
        deleteOldBotMessages(channel)
    });

    client.once(Events.ClientReady, readyClient => {
        client.user.setPresence({
            activities: [{
                name: funny_things_to_do[Math.floor(Math.random() * funny_things_to_do.length)],
                type: ActivityType.Custom,
            }],
            status: 'online'
        });
        console.log(`Insert coin 🪙  to start ${readyClient.user.tag}`);
    });
}
