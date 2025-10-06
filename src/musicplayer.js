import { useMainPlayer, useQueue, GuildQueueEvent, QueueRepeatMode, useTimeline } from 'discord-player';
import { ButtonInteraction, CommandInteraction } from 'discord.js';
import { info, debug, error, sendEmbedded } from "./discord-utils.js"

/**
 * Plays a song in the user's voice channel.
 *
 * Retrieves the song query from the interaction, sanitizes it, and attempts to play it in the user's current voice channel.
 * If the queue is empty or does not exist, a new queue is started. Otherwise, the song is added to the existing queue.
 * Sends an embedded message to the user with the result or any errors encountered.
 *
 * @param {CommandInteraction} interaction - Discord interaction object containing command options and context.
 * @returns {Promise<void>}
 *
 * @example
 * await play(interaction);
 */
export async function play(interaction) {
  debug(interaction, "[play START]")
  // Get the player instance and song query
  const player = useMainPlayer();
  await interaction.deferReply(); //Telling discord to have patience with this command
  const query = interaction.options.getString('song', true);
  
  let sanitizedQuery = query.trim()
  
  info(interaction, `Sanitized query: ${sanitizedQuery}`)
  
  // Get the voice channel of the user
  const voiceChannel = interaction.member.voice.channel;
  
  //Retrieving currentQueue
  let queue = useQueue(interaction.guild);
  
  // Play the song in the voice channel
  let result = null;
  
  //Handle some metadata for the queue
  let queueCreationOptions = {  //These options are set in queue only during its creation with nodeOptions
    metadata: {
      channel: interaction.channel,
      isFirstTrack: true
    }
  }
  // If queue already exists, specify it's not a firstTrack anymore
  if (queue) queue.metadata.isFirstTrack = false
  
  //Actually play the music
  try {
    result = await player.play(voiceChannel, sanitizedQuery, { requestedBy: interaction.user, nodeOptions: queueCreationOptions })
  } catch (e) {
    // Handle any errors that occur
    error(interaction.channelId, e.message);
    sendEmbedded({title: 'An error occurred while playing the song! ' + e.code, description: e.message, msgSource: interaction, editReply: true})
    return
  }
  
  //Queue before this play was empty (or never existed)
  if (!queue || queue.size == 0) await sendEmbedded({ title: `Starting new queue with: ${result.track.title}`, msgSource: interaction, url: result.track.url, editReply: true})
  else {
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
  let skips = interaction.options ? interaction.options.getInteger("skips") : 1;  //interaction.options is null during button interactions
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
  debug(interaction, "[loop START]")
  // Get the current queue
  const queue = useQueue(interaction.guild);
 
  if (!queue) {
    await sendEmbedded({title: 'This server does not have an active player session.', msgSource: interaction})
    info(interaction, "[loop STOP] No queue found")
    return
  }
 
  // Get the loop mode
  const loopMode = interaction.options.getNumber('mode');
  
  // Set the loop mode
  queue.setRepeatMode(loopMode);
 
  // Send a confirmation message
  await sendEmbedded({title: `Loop mode set to ${Object.keys(QueueRepeatMode).find(key => QueueRepeatMode[key] == loopMode)}`, msgSource: interaction})
  info(interaction, "[loop STOP] Changed loop mode")
}

/**
 * Toggles pause/resume for the current music queue.
 *
 * If playback is currently paused, this resumes it; otherwise, it pauses playback.
 * Designed for use with Discord button interactions or slash commands.
 * No reply is sent to the user; the interaction is simply deferred.
 *
 * @param {ButtonInteraction} interaction - Discord interaction object representing the user's action.
 * @returns {Promise<void>}
 *
 * @example
 * await pause(interaction);
 */
export async function pause(interaction) {
  // Get the queue's timeline
  const timeline = useTimeline({node: interaction.guild});
 
  // Invert the pause state
  const wasPaused = timeline.paused;
  wasPaused ? timeline.resume() : timeline.pause();

  //Buttons specific interaction, closes the interaction without a reply, super cool!
  interaction.deferUpdate();
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

  if (!queue) {
    await sendEmbedded({
      title: `There's no track or queue to filter`, 
      msgSource: interaction}
    );
    return
  }
  
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