import { log } from "./log.js";


const RULES = {
	"srv": /(buggy)|(drive)|(steer)/i,
	"ui": /(^ui_)|(cycle.*(panel|page))/i,
	"ignore": /(commandercreator)|(^store)/i,
	"fss": /explorationfss/i,
	"dss": /explorationsaa/i,
	"camera": /(camera)|(^cam)|(freecam)/i
}

function cleanupKey(key) { return key.replace("Key_", ""); }

function parseKey(key) {
	let parts = [...key.querySelectorAll("Modifier")].map(mod => mod.getAttribute("Key"));
	parts.push(key.getAttribute("Key"))
	return parts.map(cleanupKey).join("+");
}

function parseCommand(command) {
	let keys = [...command.children].filter(child => child.getAttribute("Key")).map(parseKey);
	return [command.nodeName, keys];
}

export function parse(str) {
	log("parsing", str.length, "bytes")
	let doc = new DOMParser().parseFromString(str, "text/xml");

	if (doc.documentElement.nodeName == "parsererror") {
		log("parsing error", doc.documentElement.textContent);
		return {};
	}

	let boundCommands = [...doc.documentElement.children].filter(command => command.querySelector("[Key]:not([Key=''])"));
	log("found", boundCommands.length, "commands with keyboard bindings");

	return Object.fromEntries(boundCommands.map(parseCommand));
}

export function partition(commands) {
	let results = {};

	function add(key, entry) {
		if (!(key in results)) { results[key] = {}; }
		results[key][entry[0]] = entry[1];
	}

	Object.entries(commands).forEach(entry => {
		for (let key in RULES) {
			let re = RULES[key];
			if (re.test(entry[0])) {
				add(key, entry);
				return;
			}
		}
		add("default", entry);
	});
	return results;
}
