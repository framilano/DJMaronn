import { useMainPlayer } from 'discord-player';
import { timedFunction } from "./discord-utils.js"

const filter_choices = [
    'default',
    'bassboost',  
    'earrape',  
    'bassboost_low',
    'bassboost_high',  
    '8D',  
    'vaporwave',  
    'nightcore',  
    'lofi',  
    'phaser',  
    'tremolo',  
    'vibrato',  
    'reverse',  
    'treble',  
    'normalizer2',  
    'normalizer',  
    'surrounding',  
    'pulsator',  
    'subboost',  
    'karaoke',  
    'flanger',  
    'gate',  
    'haas',  
    'mcompand',  
    'mono',  
    'mstlr',  
    'mstrr',  
    'compressor',  
    'expander',  
    'softlimiter',  
    'chorus',  
    'chorus2d',  
    'chorus3d',  
    'fadein',  
    'dim',  
    'silenceremove'
]

export async function autoCompleteSongs(interaction) {
    const player = useMainPlayer();
    const query = interaction.options.getString('song', true);
    
    //Only check results for strings with size greater than 4 that are not URLs
    if (query.length > 1 && !query.includes("https://")) {
        const results = await timedFunction(player.search(query), 2600, []);

        const tracks = results.tracks.slice(0, 9);
        
        // Returns a list of songs with their title
        return interaction.respond(
            tracks.map(function(t) {
                //Doing some parsing and slicing of results, max length for name and value is 100
                let name_string = t.title + " - " + t.author;
                name_string = name_string.slice(0, 99);
                let url = t.url.split('?')[0]
                let value_string = url.length > 100 ? name_string : url
                return {
                    name: name_string.slice(0, 99),
                    value: value_string, //this is the value that is being passed to the "song" parameter in the slash command eventually
                }
            })
        );
    } else {
        return interaction.respond([])
    }
}

export async function autoCompleteFilters(interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = filter_choices.filter(choice => choice.startsWith(focusedValue));
    await interaction.respond(
        filtered.slice(0, 9).map(choice => ({ name: choice, value: choice })),
    );
}
 