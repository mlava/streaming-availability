// copied and adapted from https://github.com/dvargas92495/roamjs-components/blob/main/src/components/FormDialog.tsx
const FormDialog = ({
    onSubmit,
    title,
    options,
    question,
    onClose,
}) => {
    const [data, setData] = window.React.useState(options[0].id);
    const onClick = window.React.useCallback(
        () => {
            onSubmit(data);
            onClose();
        },
        [data, onClose]
    );
    const onCancel = window.React.useCallback(
        () => {
            onSubmit("");
            onClose();
        },
        [onClose]
    )
    return window.React.createElement(
        window.Blueprint.Core.Dialog,
        { isOpen: true, onClose: onCancel, title, },
        window.React.createElement(
            "div",
            { className: window.Blueprint.Core.Classes.DIALOG_BODY },
            question,
            window.React.createElement(
                window.Blueprint.Core.Label,
                {},
                "Movies:",
                window.React.createElement(
                    window.Blueprint.Select.Select,
                    {
                        activeItem: data,
                        onItemSelect: (id) => setData(id),
                        items: options.map(opt => opt.id),
                        itemRenderer: (item, { modifiers, handleClick }) => window.React.createElement(
                            window.Blueprint.Core.MenuItem,
                            {
                                key: item,
                                text: options.find(opt => opt.id === item).label,
                                active: modifiers.active,
                                onClick: handleClick,
                            }
                        ),
                        filterable: false,
                        popoverProps: {
                            minimal: true,
                            captureDismiss: true,
                        }
                    },
                    window.React.createElement(
                        window.Blueprint.Core.Button,
                        {
                            text: options.find(opt => opt.id === data).label,
                            rightIcon: "double-caret-vertical"
                        }
                    )
                )
            )
        ),
        window.React.createElement(
            "div",
            { className: window.Blueprint.Core.Classes.DIALOG_FOOTER },
            window.React.createElement(
                "div",
                { className: window.Blueprint.Core.Classes.DIALOG_FOOTER_ACTIONS },
                window.React.createElement(
                    window.Blueprint.Core.Button,
                    { text: "Cancel", onClick: onCancel, }
                ),
                window.React.createElement(
                    window.Blueprint.Core.Button,
                    { text: "Submit", intent: "primary", onClick }
                )
            )
        )
    );
}

const prompt = ({
    options,
    question,
    title,
}) =>
    new Promise((resolve) => {
        const app = document.getElementById("app");
        const parent = document.createElement("div");
        parent.id = 'imdb-prompt-root';
        app.parentElement.appendChild(parent);

        window.ReactDOM.render(
            window.React.createElement(
                FormDialog,
                {
                    onSubmit: resolve,
                    title,
                    options,
                    question,
                    onClose: () => {
                        window.ReactDOM.unmountComponentAtNode(parent);
                        parent.remove();
                    }
                }
            ),
            parent
        )
    });

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
            label: "Get Streaming Availability (Current block)",
            callback: () => getAvailability({ extensionAPI }, true)
        });

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Get Streaming Availability (All Child blocks)",
            callback: () => getAvailability({ extensionAPI }, false)
        });
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Get Streaming Availability (Current block)'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Get Streaming Availability (All Child blocks)'
        });
    }
}

async function getAvailability({ extensionAPI }, parentOnly) {
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

        if (parentOnly) { // get data for one film only
            searchBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
            if (searchBlock == undefined) {
                key = "focus";
                sendConfigAlert(key);
                break breakme;
            }
            let q = `[:find (pull ?page [:block/string :block/uid {:block/children ...}]) :where [?page :block/uid "${searchBlock}"]  ]`;
            var searchBlockInfo = await window.roamAlphaAPI.q(q);
            var searchString = searchBlockInfo[0][0].string;
            var finalSearchString = searchString.split("(");
            if (finalSearchString != null) {
                searchString = finalSearchString[0];
            }

            var url = "https://www.omdbapi.com/?apiKey=" + omdbKey + "&t=" + searchString + "";
            var url1 = "https://www.omdbapi.com/?apiKey=" + omdbKey + "&s=" + searchString + "";
            var imdbID = await fetch(url).then((response) => response.json()).then(async (data) => {
                if (data.hasOwnProperty("Response") && data.Response == "False") {
                    return null;
                } else {
                    var newString = "**" + data.Title + "** (" + data.Year + ")";
                    window.roamAlphaAPI.updateBlock({ block: { uid: searchBlock, string: newString, open: true } });
                    var ratingsString = "";
                    if (data.hasOwnProperty("Ratings") && data.Ratings.length > 0) {
                        for (var i = 0; i < data.Ratings.length; i++) {
                            ratingsString += "" + data.Ratings[i].Source + ": " + data.Ratings[i].Value + "";
                            if (i < data.Ratings.length - 1) {
                                ratingsString += "\n";
                            }
                        }
                        createLink(searchBlock, ratingsString, 1);
                    }
                    return data.imdbID;
                }
            });
            if (imdbID == null) {
                imdbID = await fetch(url1).then(r => r.json()).then((movies) => {
                    const options = movies.Search
                        .filter(m => m.Type === "movie" || m.Type === "series")
                        .map(m => ({ label: "" + m.Title + " (" + m.Year + ")", id: m.imdbID }));
                    return prompt({
                        title: "IMDB",
                        question: "Which movie do you mean?",
                        options,
                    });
                })
                var url = "https://www.omdbapi.com/?apiKey=" + omdbKey + "&i=" + imdbID + "&plot=full";
                await fetch(url).then((response) => response.json()).then(async (data) => {
                    var newString = "**" + data.Title + "** (" + data.Year + ")";
                    window.roamAlphaAPI.updateBlock({ block: { uid: searchBlock, string: newString, open: true } });
                    var ratingsString = "";
                    if (data.hasOwnProperty("Ratings") && data.Ratings.length > 0) {
                        for (var i = 0; i < data.Ratings.length; i++) {
                            ratingsString += "" + data.Ratings[i].Source + ": " + data.Ratings[i].Value + "";
                            if (i < data.Ratings.length - 1) {
                                ratingsString += "\n";
                            }
                        }
                        createLink(searchBlock, ratingsString, 1);
                    }
                })
            };

            if (searchBlockInfo[0][0].hasOwnProperty("children")) {
                for (var i = 0; i < searchBlockInfo[0][0].children.length; i++) {
                    await window.roamAlphaAPI.deleteBlock({ "block": { "uid": searchBlockInfo[0][0].children[i].uid } })
                }
            }
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
                    console.info(response);
                    if (Object.keys(response.streamingInfo).length > 0) {
                        for (var i = 0; i < Object.keys(response.streamingInfo).length; i++) {
                            var obj = response.streamingInfo;
                            var name = Object.keys(obj)[i];
                            var link = Object.entries(obj[name][rAPIcc])[0][1];
                            var linkString = "[" + name[0].toUpperCase() + name.substring(1) + "](" + link + ")";
                            createLink(searchBlock, linkString, i + 1);
                        }
                    } else {
                        alert("No streaming services available!");
                    }
                })
                .catch(err => console.error(err));
        } else {  // search for all films under heading
            var parentBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
            if (parentBlock == undefined) {
                key = "focus";
                sendConfigAlert(key);
                break breakme;
            }
            let q = `[:find (pull ?page [:block/string :block/uid {:block/children ...}]) :where [?page :block/uid "${parentBlock}"]  ]`;
            var parentBlockInfo = await window.roamAlphaAPI.q(q);
            if (parentBlockInfo[0][0].hasOwnProperty("children")) {
                for (var i = 0; i < parentBlockInfo[0][0].children.length; i++) {
                    if (parentBlockInfo[0][0].children[i].hasOwnProperty("children")) {
                        for (var j = 0; j < parentBlockInfo[0][0].children[i].children.length; j++) {
                            await window.roamAlphaAPI.deleteBlock({ "block": { "uid": parentBlockInfo[0][0].children[i].children[j].uid } })
                        }
                    }
                }
            }
            parentBlockInfo = await window.roamAlphaAPI.q(q);
            
            if (parentBlockInfo[0][0].hasOwnProperty("children")) {
                for (var i = 0; i < parentBlockInfo[0][0].children.length; i++) {
                    var searchString = parentBlockInfo[0][0].children[i].string;
                    var finalSearchString = searchString.split("(");
                    if (finalSearchString != null) {
                        searchString = finalSearchString[0].trim();
                        searchString = searchString.replaceAll('**','');
                    }
                    searchBlock = parentBlockInfo[0][0].children[i].uid;
                    let q = `[:find (pull ?page [:block/string :block/uid {:block/children ...}]) :where [?page :block/uid "${searchBlock}"]  ]`;
                    var searchBlockInfo = await window.roamAlphaAPI.q(q);
                    
                    var url = "https://www.omdbapi.com/?apiKey=" + omdbKey + "&t=" + searchString + "";
                    var url1 = "https://www.omdbapi.com/?apiKey=" + omdbKey + "&s=" + searchString + "";
                    var imdbID = await fetch(url).then((response) => response.json()).then(async (data) => {
                        if (data.hasOwnProperty("Response") && data.Response == "False") {
                            return null;
                        } else {
                            var newString = "**" + data.Title + "** (" + data.Year + ")";
                            window.roamAlphaAPI.updateBlock({ block: { uid: searchBlock, string: newString, open: true } });
                            var ratingsString = "";
                            if (data.hasOwnProperty("Ratings") && data.Ratings.length > 0) {
                                for (var i = 0; i < data.Ratings.length; i++) {
                                    ratingsString += "" + data.Ratings[i].Source + ": " + data.Ratings[i].Value + "";
                                    if (i < data.Ratings.length - 1) {
                                        ratingsString += "\n";
                                    }
                                }
                                createLink(searchBlock, ratingsString, 1);
                            }
                            return data.imdbID;
                        }
                    });
                    if (imdbID == null) {
                        imdbID = await fetch(url1).then(r => r.json()).then((movies) => {
                            const options = movies.Search
                                .filter(m => m.Type === "movie" || m.Type === "series")
                                .map(m => ({ label: "" + m.Title + " (" + m.Year + ")", id: m.imdbID }));
                            return prompt({
                                title: "IMDB",
                                question: "Which movie do you mean?",
                                options,
                            });
                        })
                        var url = "https://www.omdbapi.com/?apiKey=" + omdbKey + "&i=" + imdbID + "&plot=full";
                        await fetch(url).then((response) => response.json()).then(async (data) => {
                            var newString = "**" + data.Title + "** (" + data.Year + ")";
                            window.roamAlphaAPI.updateBlock({ block: { uid: searchBlock, string: newString, open: true } });
                            var ratingsString = "";
                            if (data.hasOwnProperty("Ratings") && data.Ratings.length > 0) {
                                for (var i = 0; i < data.Ratings.length; i++) {
                                    ratingsString += "" + data.Ratings[i].Source + ": " + data.Ratings[i].Value + "";
                                    if (i < data.Ratings.length - 1) {
                                        ratingsString += "\n";
                                    }
                                }
                                createLink(searchBlock, ratingsString, 1);
                            }
                        })
                    };

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
                            ;
                            if (Object.keys(response.streamingInfo).length > 0) {
                                for (var i = 0; i < Object.keys(response.streamingInfo).length; i++) {
                                    var obj = response.streamingInfo;
                                    var name = Object.keys(obj)[i];
                                    var link = Object.entries(obj[name][rAPIcc])[0][1];
                                    var linkString = "[" + name[0].toUpperCase() + name.substring(1) + "](" + link + ")";
                                    createLink(searchBlock, linkString, i + 1);
                                }
                            } else {
                                var linkString = "No streaming services available for this title";
                                createLink(searchBlock, linkString, i + 1);
                            }
                        })
                        .catch(err => console.error(err));
                }
            }
        }
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

async function createLink(searchBlock, linkString, order) {
    var childBlock = window.roamAlphaAPI.util.generateUID();
    window.roamAlphaAPI.createBlock({
        location: { "parent-uid": searchBlock, order: order },
        block: { string: linkString, uid: childBlock }
    });
}