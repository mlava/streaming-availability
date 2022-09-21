const config = {
    tabTitle: "Streaming Availability",
    settings: [
        {
            id: "sa-rAPI-key",
            name: "RapidAPI Key",
            description: "Your API Key for RapidAPI from https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability",
            action: { type: "input", placeholder: "Add RapidAPI API key here" },
        },
        {
            id: "sa-omdb",
            name: "OMDb API key",
            description: "Your API Key from http://www.omdbapi.com/apikey.aspx",
            action: { type: "input", placeholder: "Add OMDb API key here" },
        },
        {
            id: "sa-country",
            name: "Country Code",
            description: "Two-letter Country Code",
            action: { type: "select", items: ["ae", "ar", "at", "au", "az", "be", "bg", "br", "ca", "ch", "cl", "co", "cy", "cz", "de", "dk", "ec", "ee", "es", "fi", "fr", "gb", "gr", "hk", "hr", "hu", "id", "ie", "il", "in", "is", "it", "jp", "kr", "lt", "md", "mk", "mx", "my", "nl", "no", "nz", "pa", "pe", "ph", "pl", "pt", "ro", "rs", "ru", "se", "sg", "th", "tr", "ua", "us", "vn", "za"] },
        },
    ]
};

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Get Streaming Availability",
            callback: () => getAvailability({ extensionAPI })
        });

    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Get Streaming Availability'
        });
    }
}

async function getAvailability({ extensionAPI }) {
    var rAPIkey, rAPIcc, omdbKey, key;
    var searchBlock = undefined;
    breakme: {
        if (!extensionAPI.settings.get("sa-rAPI-key")) {
            key = "rAPI";
            sendConfigAlert(key);
            break breakme;
        } else if (!extensionAPI.settings.get("sa-omdb")) {
            key = "iAPI";
            sendConfigAlert(key);
            break breakme;
        } else {
            rAPIkey = extensionAPI.settings.get("sa-rAPI-key");
            omdbKey = extensionAPI.settings.get("sa-omdb");
            rAPIcc = extensionAPI.settings.get("sa-country");
        }

        searchBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        if (searchBlock == undefined) {
            key = "focus";
            sendConfigAlert(key);
            break breakme;
        }
        let q = `[:find (pull ?page [:block/string]) :where [?page :block/uid "${searchBlock}"]  ]`;
        var searchBlockInfo = await window.roamAlphaAPI.q(q);
        var searchString = searchBlockInfo[0][0].string;

        var url = "https://www.omdbapi.com/?apiKey=" + omdbKey + "&t=" + searchString + "";
        var imdbID = await fetch(url).then((response) => response.json()).then((data) => { return data.imdbID });

        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': rAPIkey,
                'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
            }
        };
        await fetch('https://streaming-availability.p.rapidapi.com/get/basic?country=' + rAPIcc + '&imdb_id=' + imdbID, options)
            .then(response => response.json())
            .then(response => {
                if (Object.keys(response.streamingInfo).length > 0) {
                    for (var i = 0; i < Object.keys(response.streamingInfo).length; i++) {
                        var obj = response.streamingInfo;
                        var name = Object.keys(obj)[i];
                        var link = Object.entries(obj[name][rAPIcc])[0][1];
                        var linkString = "[" + name[0].toUpperCase() + name.substring(1) + "](" + link + ")";
                        createLink(searchBlock, linkString)
                    }
                } else {
                    alert("No streaming services available!");
                }
            })
            .catch(err => console.error(err));
    }
}

function sendConfigAlert(key) {
    if (key == "rAPI") {
        alert("Please set your RapidAPI Key in the configuration settings via the Roam Depot tab.");
    } else if (key == "iAPI") {
        alert("Please set your OMDb API Key in the configuration settings via the Roam Depot tab.");
    } else if (key == "focus") {
        alert("Please make sure to focus your cursor in the block containing the name of the film or series you want to search for.");
    }
}

async function createLink(searchBlock, linkString) {
    var childBlock = window.roamAlphaAPI.util.generateUID();
    window.roamAlphaAPI.createBlock({
        location: { "parent-uid": searchBlock, order: 1 },
        block: { string: linkString, uid: childBlock }
    });
}