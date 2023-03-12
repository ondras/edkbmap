import { log } from "./log.js";
import conf from "./conf.js";
import * as popup from "./popup.js";
import { prettifyCommand } from "./format.js";


let parent = document.querySelector("#keyboard");
let kb = parent.querySelector(".keyboard");
let form = parent.querySelector("form");

let keys = [...kb.querySelectorAll("kbd")];
let temporaryKeys = [];
let data = {};


kb.addEventListener("mousemove", e => {
	let trg = e.target;
	if (popup.node.contains(trg)) { return; }

	if (trg.localName != "kbd") {
		popup.hide();
		return;
	}

	fillPopup(trg);
	popup.show(e);
});

kb.append(popup.node);


function fillPopup(key) {
	let value = getKeyValue(key);
	let types = getActiveTypes();

	let ul = document.createElement("ul");
	types.forEach(type => {
		Object.entries(data[type]).forEach(entry => {
			entry[1].forEach(key => {
				if (!key.split("+").includes(value)) { return; }
				let li = document.createElement("li");
				li.style.setProperty("--hue", conf[type].hue);
				li.append(prettifyCommand(entry[0]));
				ul.append(li);
			});
		});
	});

	popup.node.innerHTML = "";

	if (ul.children.length > 0) { popup.node.append(ul); }
}

function getKeyValue(key) {
	return key.dataset.key || key.textContent;
}

function createBackground(hues) {
	function hueToColor(hue) { return `hsl(${hue} 100% 80%)`}
	let colors = hues.map(hueToColor);
	let stops = [];
	colors.forEach((color, i, all) => {
		let stop1 = i/all.length;
		let stop2 = (i+1)/all.length;
		stops.push(`${color} ${100*stop1}%`);
		stops.push(`${color} ${100*stop2}%`);
	});

	return `conic-gradient(${stops.join(",")})`;
}

function applyColorsToKey(key, types) {
	let keyValue = getKeyValue(key);

	let usedTypes = types.filter(type => {
		let commands = data[type];
		return Object.values(commands).some(keys => {
			return keys.some(key => {
				return key.split("+").includes(keyValue);
			});
		});
	});

	if (usedTypes.length == 0) {
		key.style.backgroundImage = "";
		return;
	} else {
		let hues = usedTypes.map(type => conf[type].hue);
		key.style.backgroundImage = createBackground(hues);
	}
}

function getActiveTypes() {
	return [...form.querySelectorAll(":checked")].map(input => input.name);
}

function applyColors() {
	let types = getActiveTypes();
	[...keys, ...temporaryKeys].forEach(key => applyColorsToKey(key, types));
}

function buildCheckbox(type) {
	let label = document.createElement("label");
	label.style.setProperty("--hue", conf[type].hue);

	let cb = document.createElement("input");
	cb.type = "checkbox";
	cb.checked = true;
	cb.name = type;

	label.append(cb, conf[type].label);
	label.addEventListener("click", applyColors);
	return label;
}

function createTemporaryKey(key) {
	let k = document.createElement("kbd");
	k.append(key);
	k.classList.add("temporary");
	temporaryKeys.push(k);
	return k;
}

export function hide() {
	parent.hidden = true;
}

export function validate(commands) {
	while (temporaryKeys.length) { temporaryKeys.pop().remove(); }
	kb.classList.remove("extended");

	let values = new Set();
	keys.forEach(key => values.add(getKeyValue(key)));

	Object.entries(commands).forEach(entry => {
		entry[1].forEach(key => {
			key.split("+").forEach(key => {
				if (values.has(key)) { return; }
				if (key.match(/mouse/i)) { return; }

				log("keyboard does not know the key", key, "for command", entry[0]);
				let k = createTemporaryKey(key);
				kb.append(k);
				kb.classList.add("extended");
				values.add(key);
			});
		});
	});
	log("keyboard validation complete")
}

export function show(partitioned, types) {
	data = partitioned;

	parent.hidden = false;
	form.innerHTML = "";

	let inputs = types.map(buildCheckbox);
	form.append(...inputs);
	applyColors();
}