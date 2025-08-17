import { useMainPlayer, useQueue, GuildQueueEvent, QueueRepeatMode } from 'discord-player';
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

  player.events.emit(GuildQueueEvent.PlayerFinish, queue, queue.currentTrack);
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
      player.events.emit(GuildQueueEvent.PlayerFinish, queue, queue.currentTrack);
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

/**
 * Applies or resets audio filters on the current music queue.
 *
 * This command allows users to enable up to two audio filters or reset all filters to default.
 * If "default" is specified as the first filter, all filters are removed.
 * Only valid filters are applied. Sends an embedded message to the user with the result.
 *
 * @param {CommandInteraction} interaction - Discord interaction object containing command options and context.
 *
 * @example
 * // Enable "bassboost" and "echo" filters
 * await filters(interaction);
 *
 * @returns {Promise<void>}
 *
 * @see useQueue
 * @see sendEmbedded
 *
 * Command options:
 *   - filter1: {string} Name of the first filter to enable, or "default" to reset all filters.
 *   - filter2: {string} (Optional) Name of the second filter to enable.
 */
export async function filters(interaction) {
  debug(interaction, "[filters START]")
  const queue = useQueue(interaction.guild)
  
  let filters = [];
  let filter_one = interaction.options.getString("filter1").trim();
  //Resetting filters
  if (filter_one == "default") {
      await queue.filters.ffmpeg.toggle(queue.filters.ffmpeg.getFiltersEnabled());
      await sendEmbedded({
        title: `Removed all filters`, 
        msgSource: interaction}
      );
      info(interaction, "[filters STOP] Resetting all filters")
      return;
  }
  if (queue.filters.ffmpeg.isValidFilter(filter_one)) filters.push(filter_one);
  let filter_two = interaction.options.getString("filter2");
  if (queue.filters.ffmpeg.isValidFilter(filter_two)) filters.push(filter_two);

  //Actually enable filters
  await queue.filters.ffmpeg.toggle(filters);
  
  //Building a coherent response
  let enabled_filters = queue.filters.ffmpeg.getFiltersEnabled();
  let string_of_current_filters = enabled_filters.length != 0 ? enabled_filters.toString() : "None";
  await sendEmbedded({
    title: `Currently enabled filters`, 
    description: string_of_current_filters,
    msgSource: interaction}
  );
  info(interaction, "[filters STOP] Added some filters");
}