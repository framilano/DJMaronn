import { SlashCommandBuilder } from '@discordjs/builders';
import { QueueRepeatMode } from 'discord-player';
export const data = [
  new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song in a voice channel')
  .addStringOption(
    (option) =>
      option
        .setName('song')
        .setDescription('The song to play')
        .setRequired(true),
  ),
  new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop the current song and delete the queue'),
  new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip to the next song')
  .addIntegerOption(option => option.setName('skips')
      .setDescription('How many videos do you want to skip?')
      .setRequired(false)
  ),
  new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Loop the queue in different modes')
  .addNumberOption((option) =>
    option
      .setName('mode')
      .setDescription('The loop mode')
      .setRequired(true)
      .addChoices(
        {
          name: 'Off',
          value: QueueRepeatMode.OFF,
        },
        {
          name: 'Track',
          value: QueueRepeatMode.TRACK,
        },
        {
          name: 'Queue',
          value: QueueRepeatMode.QUEUE,
        },
        {
          name: 'Autoplay',
          value: QueueRepeatMode.AUTOPLAY,
        },
      ),
  )
];