const OFFSET = 8;

export const node = document.createElement("div");
node.id = "popup";

export function show(event) {
	let rect = node.parentNode.getBoundingClientRect();
	let x = event.clientX - rect.left;
	let y = event.clientY - rect.top;

	node.style.left = "";
	node.style.right = "";
	node.style.top = "";
	node.style.bottom = "";

	if (x < rect.width/2) {
		node.style.left = `${x + OFFSET}px`;
	} else {
		node.style.right = `${rect.width - x + OFFSET}px`;
	}

	if (y < rect.height/2) {
		node.style.top = `${y + OFFSET}px`;
	} else {
		node.style.bottom = `${rect.height - y + OFFSET}px`;
	}

	node.hidden = false;
}

export function hide() {
	node.hidden = true;
}

hide();
