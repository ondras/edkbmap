import { log } from "./log.js";
import conf from "./conf.js";


let node = document.querySelector("#keyboard");
let keys = [...node.querySelectorAll("kbd")];
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
		stops.push(`${color} ${}`);
		stops.push(`${color} ${}`);
	});

	return `linear-gradient(45deg, ${stops.join(",")})`;
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
	keys.forEach(key => applyColorsToKey(key, types));
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

export function hide() {
	node.hidden = true;
}

export function validate(commands) {
	let values = new Set();
	keys.forEach(key => values.add(getKeyValue(key)));

	Object.entries(commands).forEach(entry => {
		entry[1].forEach(key => {
			key.split("+").forEach(key => {
				if (values.has(key)) { return; }
				if (key.match(/mouse/i)) { return; }
				log("keyboard does not know the key", key, "for command", entry[0]);
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