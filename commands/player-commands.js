import { SlashCommandBuilder } from '@discordjs/builders';
import { QueueRepeatMode } from 'discord-player';

export const data = [
  new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song in a voice channel')
  .addStringOption(option =>
      option.setName('song')
      .setDescription('The song to play')
      .setRequired(true)
      .setAutocomplete(true)
  ),
  new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop the current song and delete the queue'),
  new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip to the next song')
  .addIntegerOption(option => 
    option.setName('skips')
    .setDescription('How many videos do you want to skip?')
    .setRequired(false)
  ),
  new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Loop the queue in different modes')
  .addNumberOption(option =>
    option
    .setName('mode')
    .setDescription('The loop mode')
    .setRequired(true)
    .addChoices(
      {
        name: 'Off',
        description: 'Tracks won\'t loop',
        value: QueueRepeatMode.OFF,
      },
      {
        name: 'Track',
        description: 'Looping only the current track',
        value: QueueRepeatMode.TRACK,
      },
      {
        name: 'Queue',
        description: 'Looping the entire queue',
        value: QueueRepeatMode.QUEUE,
      },
      {
        name: 'Autoplay',
        description: 'Playing similar songs at queue end',
        value: QueueRepeatMode.AUTOPLAY,
      },
    ),
  ),
  //https://github.com/Androz2091/discord-player/blob/master/packages/discord-player/src/utils/AudioFilters.ts#L51
  //List of available filters ^
  new SlashCommandBuilder()
  .setName('filters')
  .setDescription('Set filters')
  .addStringOption(option =>
    option.setName('filter1')
    .setDescription('First filter')
    .setRequired(true)
    .setAutocomplete(true)
  )
  .addStringOption(option =>
    option.setName('filter2')
    .setDescription('Second filter')
    .setRequired(false)
    .setAutocomplete(true)
  ),
];