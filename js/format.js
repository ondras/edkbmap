import conf from "./conf.js";
import { log } from "./log.js";


const REMOVE = /explorationfss|explorationsaa|button|_?buggy/i
const KEYS = {
	"Equals": "=",
	"Minus": "−",
	"BackSlash": "\\",
	"Comma": ",",
	"Period": ".",
	"LeftArrow": "←",
	"RightArrow": "→",
	"UpArrow": "↑",
	"DownArrow": "↓",
	"LeftBracket": "[",
	"RightBracket": "]",
	"Apostrophe": "'"
}

function splitWords(str) { return str.replace(/([a-z])([A-Z0-9])/g, "$1 $2"); }

function removeUnderscores(str) { return str.replace(/_/g, " "); }

function prettifyCommand(command) {
	return splitWords(
		removeUnderscores(
			command.replace(REMOVE, "")
		)
	);

}
function prettifyKey(key) {
	return key.split("+").map(key => {
		return KEYS[key] || splitWords(removeUnderscores(key));
	}).join(" + ");
}

export function formatGroup(partitioned, type) {
	let node = document.createElement("details");
	node.classList.add("group");

	let summary = document.createElement("summary");

	summary.append(conf[type].label);
	node.style.setProperty("--hue", conf[type].hue);

	let commands = partitioned[type];

	let table = document.createElement("table");
	for (let c in commands) {
		let row = table.insertRow();

		let cell1 = row.insertCell();
		cell1.textContent = prettifyCommand(c);
		cell1.title = c;

		let cell2 = row.insertCell();
		cell2.textContent = commands[c].map(prettifyKey).join(" or ");
		cell2.title = commands[c].join(", ");
	}

	node.append(summary, table);

	log("formatted", table.rows.length, "commands in group", type)
	return node;
}
