import { useMainPlayer, useQueue, QueueRepeatMode } from 'discord-player';
import { CommandInteraction } from 'discord.js';
import { info, debug, error, sendEmbedded } from "./discord-utils.js"

/**
 * Enqueue song
 * @param {CommandInteraction} interaction 
 */
export async function play(interaction) {
  debug(interaction, "[play START]")
  // Get the player instance and song query
  const player = useMainPlayer();
  await interaction.deferReply(); //Telling discord to have patience with this command
  const query = interaction.options.getString('song', true);
  const queue = useQueue(interaction.guild)

  let sanitizedQuery = query.trim()

  info(interaction, `Sanitized query: ${sanitizedQuery}`)

  const searchResult = await player.search(sanitizedQuery, { requestedBy: interaction.user });

  if (!searchResult.hasTracks()) {
    console.warn(interaction, "[STOP] No tracks found for " + sanitizedQuery);
    
    sendEmbedded({title: 'No track has been found for query ' + sanitizedQuery, description: null, msgSource: interaction, editReply: true });
    return;
  }
  
  // Get the voice channel of the user
  const voiceChannel = interaction.member.voice.channel;

  // Play the song in the voice channel
  let result = null;
  try {
    result = await player.play(voiceChannel, searchResult, {
      nodeOptions: {
        metadata: { channel: interaction.channel, requestedBy: interaction.user } // Store text channel as metadata on the queue
      },
    })
  } catch (e) {
    // Handle any errors that occur
    error(interaction.channelId, e.message);
    sendEmbedded({title: 'An error occurred while playing the song! ' + e.code, description: e.message, msgSource: interaction, editReply: true})
    return
  }
  
  if (!queue || queue.size == 0) {
    await sendEmbedded({ title: `Starting new queue with: ${result.track.title}`, msgSource: interaction, url: result.track.url, editReply: true})
  } else {
    sendEmbedded({
      title: `Adding "${result.track.title}" to the queue`, 
      msgSource: interaction, 
      description: `There are ${queue.size} songs in queue`,
      url: result.track.url, 
      editReply: true
    })
  }

  debug(interaction, "[play STOP]")
}

/**
 * Stopping playback and deleting queue
 * @param {CommandInteraction} interaction 
 */
export async function stop(interaction) {
  debug(interaction, "[stop START]")
  const player = useMainPlayer();
  const queue = useQueue(interaction.guild)

  if (!queue) {
    await sendEmbedded({msgSource: interaction, title: "Nothing to stop you fool"})
    return
  }

  queue.delete()
  
  await sendEmbedded({msgSource: interaction, title: "Stopped current song and deleted queue"})
}

/**
 * Skipping N songs
 * @param {CommandInteraction} interaction 
 */
export async function skip(interaction) {
  debug(interaction, "[skip START]")
  // Get the current queue
  const queue = useQueue(interaction.guild);
  const player = useMainPlayer();
 
  if (!queue) {
    await sendEmbedded({title: 'This server does not have an active player session.', msgSource: interaction})
    return
  }
 
  if (!queue.isPlaying()) {
    await sendEmbedded({title: 'There is no track playing.', msgSource: interaction})
    return
  }

  info(interaction, `Queue size: ${queue.size}`)

  let number_of_skips = 1
  let skips = interaction.options.getInteger("skips");
  if (skips) number_of_skips = skips
  if (number_of_skips < 1) number_of_skips = 1

  if (number_of_skips > queue.size) {
    if (queue.repeatMode == 3) {
      await sendEmbedded({title: 'Searching for a new song in autoplay...', msgSource: interaction})
      queue.node.skip();
    } else {
      await sendEmbedded({title: 'You skipped over queue\'s length, stopping playback', msgSource: interaction})
      queue.delete()
    }
    return
  }

  let track_target = queue.tracks.at(number_of_skips-1)
  info(interaction, `Target track is ${track_target}`)
  queue.node.skipTo(track_target) 
 
  // Send a confirmation message
  await sendEmbedded({title: `Skipping ${number_of_skips} song/s`, msgSource: interaction})
}

/**
 * Set loop mode
 * @param {CommandInteraction} interaction 
 */
export async function loop(interaction) {
  // Get the current queue
  const queue = useQueue(interaction.guild);
 
  if (!queue) {
    await sendEmbedded({title: 'This server does not have an active player session.', msgSource: interaction})
    return
  }
 
  // Get the loop mode
  const loopMode = interaction.options.getNumber('mode');
  
  // Set the loop mode
  queue.setRepeatMode(loopMode);
 
  // Send a confirmation message
  await sendEmbedded({title: `Loop mode set to ${Object.keys(QueueRepeatMode).find(key => QueueRepeatMode[key] == loopMode)}`, msgSource: interaction})
}