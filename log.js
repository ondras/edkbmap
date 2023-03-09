let pre = document.querySelector("#log pre");

export function log(...args) {
	console.log(...args);
	pre.textContent += args.map(a => String(a)).join(" ") + "\n";
}

export function clear() {
	console.clear();
	pre.innerHTML = "";
}