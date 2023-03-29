(() => {
  // js/log.js
  var pre = document.querySelector("#log pre");
  function log(...args) {
    console.log(...args);
    pre.textContent += args.map((a) => String(a)).join(" ") + "\n";
  }
  function clear() {
    console.clear();
    pre.innerHTML = "";
  }

  // js/parser.js
  var RULES = {
    "srv": /(buggy)|(drive)|(steer)/i,
    "ui": /(^ui_)|(cycle.*(panel|page))/i,
    "ignore": /(commandercreator)|(^store)/i,
    "fss": /explorationfss/i,
    "dss": /explorationsaa/i,
    "camera": /(camera)|(^cam)|(freecam)/i
  };
  function cleanupKey(key) {
    return key.replace("Key_", "");
  }
  function parseKey(key) {
    let parts = [...key.querySelectorAll("Modifier")].map((mod) => mod.getAttribute("Key"));
    parts.push(key.getAttribute("Key"));
    return parts.map(cleanupKey).join("+");
  }
  function parseCommand(command) {
    let keys2 = [...command.children].filter((child) => child.getAttribute("Key")).map(parseKey);
    return [command.nodeName, keys2];
  }
  function parse(str) {
    log("parsing", str.length, "bytes");
    let doc = new DOMParser().parseFromString(str, "text/xml");
    if (doc.documentElement.nodeName == "parsererror") {
      log("parsing error", doc.documentElement.textContent);
      return {};
    }
    let boundCommands = [...doc.documentElement.children].filter((command) => command.querySelector("[Key]:not([Key=''])"));
    log("found", boundCommands.length, "commands with keyboard bindings");
    return Object.fromEntries(boundCommands.map(parseCommand));
  }
  function partition(commands) {
    let results = {};
    function add(key, entry) {
      if (!(key in results)) {
        results[key] = {};
      }
      results[key][entry[0]] = entry[1];
    }
    Object.entries(commands).forEach((entry) => {
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

  // js/conf.js
  var conf_default = {
    default: {
      label: "Ship controls",
      hue: "0deg"
    },
    srv: {
      label: "SRV controls",
      hue: "300deg"
    },
    ui: {
      label: "UI",
      hue: "60deg"
    },
    fss: {
      label: "Full Spectrum Scanner",
      hue: "120deg"
    },
    dss: {
      label: "Detailed Surface Scanner",
      hue: "180deg"
    },
    camera: {
      label: "Camera",
      hue: "240deg"
    }
  };

  // js/format.js
  var REMOVE = /explorationfss|explorationsaa|button|_?buggy/i;
  var KEYS = {
    "Equals": "=",
    "Minus": "\u2212",
    "BackSlash": "\\",
    "Slash": "/",
    "SemiColon": ";",
    "Grave": "`",
    "Comma": ",",
    "Period": ".",
    "LeftArrow": "\u2190",
    "RightArrow": "\u2192",
    "UpArrow": "\u2191",
    "DownArrow": "\u2193",
    "LeftBracket": "[",
    "RightBracket": "]",
    "Apostrophe": "'"
  };
  function splitWords(str) {
    return str.replace(/([a-z])([A-Z0-9])/g, "$1 $2");
  }
  function removeUnderscores(str) {
    return str.replace(/_/g, " ");
  }
  function prettifyCommand(command) {
    return splitWords(
      removeUnderscores(
        command.replace(REMOVE, "")
      )
    );
  }
  function prettifyKey(key) {
    return key.split("+").map((key2) => {
      return KEYS[key2] || splitWords(removeUnderscores(key2));
    }).join(" + ");
  }
  function formatGroup(partitioned, type) {
    let node2 = document.createElement("details");
    node2.classList.add("group");
    let summary = document.createElement("summary");
    summary.append(conf_default[type].label);
    node2.style.setProperty("--hue", conf_default[type].hue);
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
    node2.append(summary, table);
    log("formatted", table.rows.length, "commands in group", type);
    return node2;
  }

  // js/popup.js
  var OFFSET = 8;
  var node = document.createElement("div");
  node.id = "popup";
  function show(event) {
    let rect = node.parentNode.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    node.style.left = "";
    node.style.right = "";
    node.style.top = "";
    node.style.bottom = "";
    if (x < rect.width / 2) {
      node.style.left = `${x + OFFSET}px`;
    } else {
      node.style.right = `${rect.width - x + OFFSET}px`;
    }
    if (y < rect.height / 2) {
      node.style.top = `${y + OFFSET}px`;
    } else {
      node.style.bottom = `${rect.height - y + OFFSET}px`;
    }
    node.hidden = false;
  }
  function hide() {
    node.hidden = true;
  }
  hide();

  // js/keyboard.js
  var parent = document.querySelector("#keyboard");
  var kb = parent.querySelector(".keyboard");
  var form = parent.querySelector("form");
  var keys = [...kb.querySelectorAll("kbd")];
  var temporaryKeys = [];
  var data = {};
  kb.addEventListener("mousemove", (e) => {
    let trg = e.target;
    if (node.contains(trg)) {
      return;
    }
    if (trg.localName != "kbd") {
      hide();
      return;
    }
    fillPopup(trg);
    show(e);
  });
  kb.append(node);
  function fillPopup(key) {
    let value = getKeyValue(key);
    let types = getActiveTypes();
    let ul = document.createElement("ul");
    types.forEach((type) => {
      Object.entries(data[type]).forEach((entry) => {
        entry[1].forEach((key2) => {
          if (!key2.split("+").includes(value)) {
            return;
          }
          let li = document.createElement("li");
          li.style.setProperty("--hue", conf_default[type].hue);
          li.append(prettifyCommand(entry[0]));
          ul.append(li);
        });
      });
    });
    node.innerHTML = "";
    if (ul.children.length > 0) {
      node.append(ul);
    }
  }
  function getKeyValue(key) {
    return key.dataset.key || key.textContent;
  }
  function createBackground(hues) {
    function hueToColor(hue) {
      return `hsl(${hue} 100% 80%)`;
    }
    let colors = hues.map(hueToColor);
    let stops = [];
    colors.forEach((color, i, all) => {
      let stop1 = i / all.length;
      let stop2 = (i + 1) / all.length;
      stops.push(`${color} ${100 * stop1}%`);
      stops.push(`${color} ${100 * stop2}%`);
    });
    return `conic-gradient(${stops.join(",")})`;
  }
  function applyColorsToKey(key, types) {
    let keyValue = getKeyValue(key);
    let usedTypes = types.filter((type) => {
      let commands = data[type];
      return Object.values(commands).some((keys2) => {
        return keys2.some((key2) => {
          return key2.split("+").includes(keyValue);
        });
      });
    });
    if (usedTypes.length == 0) {
      key.style.backgroundImage = "";
      return;
    } else {
      let hues = usedTypes.map((type) => conf_default[type].hue);
      key.style.backgroundImage = createBackground(hues);
    }
  }
  function getActiveTypes() {
    return [...form.querySelectorAll(":checked")].map((input) => input.name);
  }
  function applyColors() {
    let types = getActiveTypes();
    [...keys, ...temporaryKeys].forEach((key) => applyColorsToKey(key, types));
  }
  function buildCheckbox(type) {
    let label = document.createElement("label");
    label.style.setProperty("--hue", conf_default[type].hue);
    let cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.name = type;
    label.append(cb, conf_default[type].label);
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
  function hide2() {
    parent.hidden = true;
  }
  function validate(commands) {
    while (temporaryKeys.length) {
      temporaryKeys.pop().remove();
    }
    kb.classList.remove("extended");
    let values = /* @__PURE__ */ new Set();
    keys.forEach((key) => values.add(getKeyValue(key)));
    Object.entries(commands).forEach((entry) => {
      entry[1].forEach((key) => {
        key.split("+").forEach((key2) => {
          if (values.has(key2)) {
            return;
          }
          if (key2.match(/mouse/i)) {
            return;
          }
          log("keyboard does not know the key", key2, "for command", entry[0]);
          let k = createTemporaryKey(key2);
          kb.append(k);
          kb.classList.add("extended");
          values.add(key2);
        });
      });
    });
    log("keyboard validation complete");
  }
  function show2(partitioned, types) {
    data = partitioned;
    parent.hidden = false;
    form.innerHTML = "";
    let inputs = types.map(buildCheckbox);
    form.append(...inputs);
    applyColors();
  }

  // js/app.js
  var TYPES = ["default", "srv", "camera", "ui", "fss", "dss"];
  async function go(str) {
    clear();
    let commands = parse(str);
    validate(commands);
    let partitioned = partition(commands);
    let parent2 = document.querySelector("#groups");
    parent2.innerHTML = "";
    let groups = TYPES.map((name) => formatGroup(partitioned, name));
    parent2.append(...groups);
    show2(partitioned, TYPES);
  }
  async function onFile(e) {
    let file = e.target.files[0];
    if (!file) {
      return;
    }
    let fr = new FileReader();
    fr.readAsText(file);
    await new Promise((resolve) => fr.addEventListener("load", resolve));
    go(fr.result);
  }
  function init() {
    hide2();
    document.querySelector("[type=file]").addEventListener("change", onFile);
  }
  init();
})();
