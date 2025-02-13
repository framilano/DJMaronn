import { SlashCommandBuilder } from '@discordjs/builders';

export const data = [
    new SlashCommandBuilder()
        .setName('delete-messages')
        .setDescription('Deletes all bot messages')
];