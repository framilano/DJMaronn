import { useMainPlayer } from 'discord-player';
 
export async function autoCompleteSongs(interaction) {
    const player = useMainPlayer();
    const query = interaction.options.getString('song', true);
    
    //Only check results for strings with size greater than 4 that are not URLs
    if (query.length > 1 && !query.includes("https://")) {
        const results = await player.search(query);

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
 