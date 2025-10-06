import { EmbedBuilder, PermissionsBitField } from 'discord.js';

const dj_maronn_id = '1332640482097893407'

//Sends embededded messages
export async function sendEmbedded({
    title = null,
    description = null,
    color = null,
    url = null,
    thumbnail = null,
    msgSource = null,
    editReply = false,
    listOfFields = null,
    components = null
} = {}) {
    let msgEmbed = new EmbedBuilder();
    if (color != null) msgEmbed.setColor(color);
    if (title != null) msgEmbed.setTitle(title);
    if (description != null) msgEmbed.setDescription(description);
    if (url != null) msgEmbed.setURL(url);
    if (thumbnail != null) msgEmbed.setThumbnail(thumbnail);
    if (listOfFields != null) {
        let stringFields = listOfFields.map(field => {
            if (field.name == "Audio Filter" && field.value == null) field.value = "Nessuno"
            field.value = String(field.value)
            return field
        })
        let filteredFields = stringFields.filter(field => field.value != "" && field.value != null)

        msgEmbed.addFields(filteredFields)
    }
    msgEmbed.setTimestamp()
    msgEmbed.setFooter({ text: 'Bot by fra98_', iconURL: 'https://i.imgur.com/moqL0rw.png' });
    try {
        //Only CommandInteraction has applicationId as property
        if (msgSource.hasOwnProperty('applicationId')) {
            if (editReply) await msgSource.editReply({ embeds: [msgEmbed] });
            else await msgSource.reply({ embeds: [msgEmbed], components: components });
        } else await msgSource.send({ embeds: [msgEmbed], components: components });
    } catch (errorObject) {
        error(msgSource, "[discord-utils.sendEmbedded ERROR] error = " + errorObject)
    }
}

export function deleteOldBotMessagesCommand(interaction) {
    debug(interaction, "[deleteOldBotMessagesCommand START]")
    let currentTextChannel = interaction.channel
    if (currentTextChannel != null) {
        currentTextChannel.messages.fetch()
            .then(messages => {
                let botMessages = messages.filter(function(msg) { 
                    return msg.author.bot && msg.bulkDeletable && msg.author.id == dj_maronn_id
                });
                if (Array.from(botMessages).length != 0) {
                    currentTextChannel.bulkDelete(botMessages)
                        .then(messages => {
                            debug(interaction, "I deleted " + Array.from(messages).length + " messages")
                            sendEmbedded({ title: "I deleted " + Array.from(messages).length + " messages", msgSource: interaction })
                        })
                        .catch((error_msg) => {
                            error(interaction, "Error while deleting messages:" + error_msg)
                            sendEmbedded({ title: "Couldn't delete messages", description: error_msg.message, msgSource: interaction })
                        });
                } else {
                    debug(interaction, "There's nothing to delete")
                    sendEmbedded({ title: "There's nothing to delete", msgSource: interaction })
                }
            })
    }
}

export function deleteOldBotMessages(channel) {
    debug(null, "[deleteOldBotMessages START]")
    if (channel != null) {
        channel.messages.fetch()
            .then(messages => {
                let botMessages = messages.filter(function(msg) { 
                    return msg.author.bot && msg.bulkDeletable && msg.author.id == dj_maronn_id
                });
                if (Array.from(botMessages).length != 0) {
                    channel.bulkDelete(botMessages)
                        .then(messages => {
                            debug(null, "I deleted " + Array.from(messages).length + " messages")
                        })
                        .catch(() => {
                            info(null, "Error while deleting, maybe a message was being sent while deleted?")
                        });
                } else {
                    debug(null, "There's nothing to delete")
                }
            })
    }
}

export function timedFunction(promise, ms, defaultAnswer) {
    const timeout = new Promise(
        (_, reject) => setTimeout(() => reject(defaultAnswer), ms)
    );
  return Promise.race([promise, timeout]);
}

export function info(interaction, message) {
    if (interaction != null) console.info(`[INFO] [${extractTimestamp()}] [${interaction.channelId}] `, message)
    else console.info(`[${extractTimestamp()}] `, message)
}

export function debug(interaction, message) {
    if (interaction != null) console.debug(`[DEBUG] [${extractTimestamp()}] [${interaction.channelId}] `, message)
    else console.debug(`[${extractTimestamp()}] `, message)
}

export function error(interaction, message) {
    if (interaction != null) console.error(`[ERROR] [${extractTimestamp()}] [${interaction.channelId}] `, message)
    else console.error(`[${extractTimestamp()}] `, message)}

export function checkCommandPermissions(interaction) {

    // Get the voice channel of the user and check permissions
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
        sendEmbedded({ title: 'You need to be in a voice channel to play music!', msgSource: interaction })
        return false
    }

    if (
        interaction.guild.members.me.voice.channel &&
        interaction.guild.members.me.voice.channel !== voiceChannel
    ) {
        sendEmbedded({ title: 'I am already playing in a different voice channel!', msgSource: interaction })
        return false
    }

    if (
        !voiceChannel
            .permissionsFor(interaction.guild.members.me)
            .has(PermissionsBitField.Flags.Connect)
    ) {
        sendEmbedded({ title: 'I do not have permission to join your voice channel!', msgSource: interaction })
        return false

    }

    if (
        !voiceChannel
            .permissionsFor(interaction.guild.members.me)
            .has(PermissionsBitField.Flags.Speak)
    ) {
        sendEmbedded({ title: 'I do not have permission to speak in your voice channel!', msgSource: interaction })
        return false
    }

    return true
}

function extractTimestamp() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}