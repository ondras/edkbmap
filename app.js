import sample from "./sample.js";
import { parse, partition } from "./parser.js"
import { formatGroup } from "./format.js"



async function go() {
	let commands = parse(sample);
	let partitioned = partition(commands);

	let groups = ["default", "srv", "camera", "ui", "fss", "dss"].map(name => formatGroup(partitioned, name));
	document.body.append(...groups);
}

go();