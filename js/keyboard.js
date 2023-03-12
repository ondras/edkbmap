import { log } from "./log.js";
import conf from "./conf.js";


let node = document.querySelector("#keyboard");
let keys = [...node.querySelectorAll("kbd")];
let temporaryKeys = [];
let form = node.querySelector("form");
let data = {};


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

function applyColors() {
	let types = [...form.querySelectorAll(":checked")].map(input => input.name);
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
	node.hidden = true;
}

export function validate(commands) {
	while (temporaryKeys.length) { temporaryKeys.pop().remove(); }
	let kb = node.querySelector(".keyboard");
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

	node.hidden = false;
	form.innerHTML = "";

	let inputs = types.map(buildCheckbox);
	form.append(...inputs);
	applyColors();
}