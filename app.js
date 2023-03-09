import sample from "./sample.js";
import { parse, partition } from "./parser.js"
import { formatGroup } from "./format.js"
import { clear } from "./log.js";


async function go() {
	clear();
	let commands = parse(sample);
	let partitioned = partition(commands);

	let parent = document.querySelector("#groups");
	parent.innerHTML = "";

	let groups = ["default", "srv", "camera", "ui", "fss", "dss"].map(name => formatGroup(partitioned, name));
	parent.append(...groups);
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
	document.querySelector("[type=file]").addEventListener("change", onFile);
}

init();
