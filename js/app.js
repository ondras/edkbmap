import { parse, partition } from "./parser.js"
import { formatGroup } from "./format.js"
import { clear } from "./log.js";
import * as keyboard from "./keyboard.js";


const TYPES = ["default", "srv", "camera", "ui", "fss", "dss"];

async function go(str) {
	clear();
	let commands = parse(str);
	keyboard.validate(commands);

	let partitioned = partition(commands);

	let parent = document.querySelector("#groups");
	parent.innerHTML = "";

	let groups = TYPES.map(name => formatGroup(partitioned, name));
	parent.append(...groups);

	keyboard.show(partitioned, TYPES);
}

async function onFile(e) {
	let file = e.target.files[0];
	if (!file) { return; }

	let fr = new FileReader();
	fr.readAsText(file);

	await new Promise(resolve => fr.addEventListener("load", resolve));

	go(fr.result);
}

function init() {
	keyboard.hide();
	document.querySelector("[type=file]").addEventListener("change", onFile);
}

init();
