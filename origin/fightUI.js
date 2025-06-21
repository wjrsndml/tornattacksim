const resultsElementId = "results";

var hlifestats, vlifestats, globalResults;
var displayLife = false;
var hChart = null, vChart = null;

const PLAYERSTAT = {
  position: 0,
  name: 1,
  id: 2,
  battleStats: 3,
  life: 4,
  passives: 5,
  weapons: 6,
  armour: 7,
  attackSettings: 8,
  defendSettings: 9,
  educationPerks: 10,
  factionPerks: 11,
  companyPerks: 12,
  propertyPerks: 13,
  meritPerks: 14
};

function getPlayerObject(prefix, name, id, position) {
  var player = [position, name, id];

  var company = get_company(prefix);
  
  player[PLAYERSTAT.battleStats] = {
      "strength": parseInt(document.getElementById(prefix + "strength").value.replace(/,/g,''), 10),
      "speed": parseInt(document.getElementById(prefix + "speed").value.replace(/,/g,''), 10),
      "defense": parseInt(document.getElementById(prefix + "defense").value.replace(/,/g,''), 10),
      "dexterity": parseInt(document.getElementById(prefix + "dexterity").value.replace(/,/g,''), 10),
  };
  player[PLAYERSTAT.life] = parseInt(document.getElementById(prefix + "life").value.replace(/,/g,''), 10);
  player[PLAYERSTAT.passives] = {
      "strength": 0 + parseInt(document.getElementById(prefix + "strengthmerits").value, 10),
      "speed": 0 + parseInt(document.getElementById(prefix + "speedmerits").value, 10),
      "defense": 0 + parseInt(document.getElementById(prefix + "defensemerits").value, 10),
      "dexterity": 0 + parseInt(document.getElementById(prefix + "dexteritymerits").value, 10)
  };

  player[PLAYERSTAT.weapons] = {
      "primary": get_weapon(prefix,"primary"),
      "secondary": get_weapon(prefix,"secondary"),
      "melee": get_weapon(prefix,"melee"),
      "temporary": get_weapon(prefix,"temporary"),
      "fists": {"damage": 12.14,"accuracy": 50.00,"category": "Unarmed", "experience": 0},
      "kick": {"damage": 37.44,"accuracy": 40.71,"category": "Unarmed", "experience": 0}
  };

  player[PLAYERSTAT.armour] = {
      "head": get_armour(prefix, "head"),
      "body": get_armour(prefix, "body"),
      "hands": get_armour(prefix, "hands"),
      "legs": get_armour(prefix, "legs"),
      "feet": get_armour(prefix, "feet")
  };

  var settings = {
      "primary": {
          "setting": parseInt(document.getElementById(prefix + "primarypriority").value.replace(/,/g,''), 10),
          "reload": document.getElementById(prefix + "primaryreload").checked
      },
      "secondary": {
          "setting": parseInt(document.getElementById(prefix + "secondarypriority").value.replace(/,/g,''), 10),
          "reload": document.getElementById(prefix + "secondaryreload").checked
      },
      "melee": {
          "setting": parseInt(document.getElementById(prefix + "meleepriority").value.replace(/,/g,''), 10),
          "reload": null
      },
      "temporary": {
          "setting": parseInt(document.getElementById(prefix + "temporarypriority").value.replace(/,/g,''), 10),
          "reload": null
      }
  };
  if (position == "attack") {
    player[PLAYERSTAT.attackSettings] = settings;
    player[PLAYERSTAT.defendSettings] = "";
  } else {
    player[PLAYERSTAT.attackSettings] = "";
    player[PLAYERSTAT.defendSettings] = settings;
  }

  player[PLAYERSTAT.educationPerks] = {
        "damage": document.getElementById(prefix + "damage").checked,
        "neckdamage": document.getElementById(prefix + "neck").checked,
        "meleedamage": document.getElementById(prefix + "meleedamage").checked,
        "tempdamage": document.getElementById(prefix + "temporarydamage").checked,
        "needleeffect": document.getElementById(prefix + "temporarybooster").checked,
        "japanesedamage": document.getElementById(prefix + "japanesedamage").checked,
        "fistdamage": document.getElementById(prefix + "fist").checked,
        "critchance": document.getElementById(prefix + "critchance").checked,
        "machinegunaccuracy": document.getElementById(prefix + "machinegunaccuracy").checked,
        "smgaccuracy": document.getElementById(prefix + "smgaccuracy").checked,
        "pistolaccuracy": document.getElementById(prefix + "pistolaccuracy").checked,
        "rifleaccuracy": document.getElementById(prefix + "rifleaccuracy").checked,
        "heavyartilleryaccuracy": document.getElementById(prefix + "heavyartilleryaccuracy").checked,
        "temporaryaccuracy": document.getElementById(prefix + "temporaryaccuracy").checked,
        "shotgunaccuracy": document.getElementById(prefix + "shotgunaccuracy").checked,
        "ammocontrol1": document.getElementById(prefix + "ammo1").checked,
        "ammocontrol2": document.getElementById(prefix + "ammo2").checked,
  };

  player[PLAYERSTAT.factionPerks] = {
      "accuracy": document.getElementById(prefix + "factionaccuracy").value * 1,
      "damage": document.getElementById(prefix + "factiondamage").value * 1
  };

  player[PLAYERSTAT.companyPerks] = company;

  player[PLAYERSTAT.propertyPerks]= {
      "damage": document.getElementById(prefix + "property").checked
  };

  player[PLAYERSTAT.meritPerks]= {
      "critrate": document.getElementById(prefix + "critmerits").value*1,
  };
  
  player[PLAYERSTAT.meritPerks][`${player[PLAYERSTAT.weapons].primary.category.replace(/ /g, "").toLowerCase()}mastery`] = document.getElementById(prefix + "primarymastery").value*1;
  player[PLAYERSTAT.meritPerks][`${player[PLAYERSTAT.weapons].secondary.category.replace(/ /g, "").toLowerCase()}mastery`] = document.getElementById(prefix + "secondarymastery").value*1;
  player[PLAYERSTAT.meritPerks][`${player[PLAYERSTAT.weapons].melee.category.replace(/ /g, "").toLowerCase()}mastery`] = document.getElementById(prefix + "meleemastery").value*1;
  player[PLAYERSTAT.meritPerks]["temporarymastery"] = document.getElementById(prefix + "temporarymastery").value*1;

  return player
}

function get_weapon(prefix, type) {
  var elementId = prefix + type;
  var weapon_id = document.getElementById(elementId).value;  
  var weapon = JSON.parse(JSON.stringify(weapons[type][weapon_id]));
  weapon.id = weapon_id;
  if (type == "temporary") {
    weapon.accuracy = (weapon.accuracy_range[0] + weapon.accuracy_range[1]) / 2;
    weapon.damage = (weapon.damage_range[0] + weapon.damage_range[1]) / 2;
  } else {
    weapon.accuracy = 1*(document.getElementById(elementId + "accrange").nextElementSibling.value);
    weapon.damage = 1*(document.getElementById(elementId + "dmgrange").nextElementSibling.value);
  }
  weapon.experience = document.getElementById(elementId + "experience").value * 1
  if (weapon.bonus.procrange != "n/a") {
    if (type == "temporary") {
      weapon.bonus.proc = 100
    } else {
      weapon.bonus.proc = document.getElementById(elementId + "procrange").value;
    }
  } else {
    weapon.bonus.proc = 0;
  }
  weapon.ammo = "";
  if (type == "primary" || type == "secondary") {
    weapon.mods = {
                    "one": document.getElementById(elementId+"mod1").value,
                    "two": document.getElementById(elementId+"mod2").value
                  };
    weapon.ammo = document.getElementById(elementId + "ammo").value;
  }
  return weapon;
}

function get_armour(prefix, type) {
  var elementId = prefix + type;
  var armour_id = document.getElementById(elementId).value;
  var armour = JSON.parse(JSON.stringify(armours[type][armour_id]));
  armour.id = armour_id;
  armour.armour = 1*(document.getElementById(elementId + "range").nextElementSibling.value);
  return armour;
}

function get_company(prefix) {
  var elementId = prefix + "company";
  var values = document.getElementById(elementId).value.split("|");

  return {name: values[0], star: values[1]};
}

function createChart(ctx, label, data, color) {
  var labels = [...Array(data.length).keys()];
  labels.shift(); // remove '0' label since 0 life data is also removed
  
  return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                borderWidth: 1
            }]
        },
        options: {scales: {y: {beginAtZero: true}}
        }
    });
}

function readyUI(readyFlag) {
  var runButton = document.getElementById("submit");
  runButton.disabled = !readyFlag;
}

function displayResults(results, trials, expectedTrials) {
  var resultInfo = `Fights: ${trials.toLocaleString("en")}/${expectedTrials.toLocaleString("en")}<br>`
    + `Hero Wins: ${results[0].toLocaleString("en")} (${(results[0] / trials * 100).toFixed(2)}%)`
    + `, Stalemates: ${results[2].toLocaleString("en")} (${(results[2] / trials * 100).toFixed(2)}%)`
    + `, Villain Wins ${results[1].toLocaleString("en")} (${(results[1] / trials * 100).toFixed(2)}%)<br>`
    + `Average turns: ${Math.round(results[3] / trials)}, `
    + `Average Hero life: ${Math.round(results[4] / trials)}, Average Villain life: ${Math.round(results[5] / trials)}`;

  resultInfo += '<hr><h4>Sample Attack Log</h4><div id="sampleLog">';
  results[6].forEach(log => {resultInfo += `${log}<br>`});
  resultInfo += `</div><div style="width:900px;height:500px;"><canvas id="hChart" style="display: block; box-sizing: border-box; height: 400px; width: 800px;" width="800" height="400"></canvas></div><br>`
  resultInfo += `<div style="width:900px;height:500px;"><canvas id="vChart" style="display: block; box-sizing: border-box; height: 400px; width: 800px;" width="800" height="400"></canvas></div><br>`

  var resultsElement = document.getElementById(resultsElementId);
  resultsElement.innerHTML = `${resultInfo}`;
  globalResults = [results[0], results[1], results[2], results[3], trials, results[4], results[5]]; //hw, vw, s, turns, trials, hl, vl
  hlifestats = [];
  vlifestats = [];
  document.getElementById("download-life-csv").disabled = false;
  if (displayLife) {
    globalResults = [results[0], results[1], results[2], results[3], trials, results[4], results[5]]; //hw, vw, s, turns, trials, hl, vl
    hlifestats = [...results[8]]; vlifestats = [...results[9]];
    hlifestats.shift(); // Remove loss counter (zero life) as it skews graph scale while it doesn't add new insight
    hlifestats.push(0); // Attempt to fix final value clipping issue.
    vlifestats.shift();
    vlifestats.push(0);

    if (hChart != null) {
      hChart.destroy();
      vChart.destroy();
    }
    var hctx = document.getElementById('hChart').getContext('2d');
    hChart = createChart(hctx, 'Hero Surviving Life', hlifestats, `rgb(255,0,0)`);
    var vctx = document.getElementById('vChart').getContext('2d');
    vChart = createChart(vctx, 'Villain Surviving Life', vlifestats, `rgb(0,0,255)`);
  }
}

function run() {
  readyUI(false); // Gets enabled again via callback sent from runSimulation

  var trials = parseInt(document.getElementById("trials").value.replace(/,/g,''), 10)
  var playerHero = getPlayerObject("h", "Hero", 1, "attack");
  var playerVillain = getPlayerObject("v", "Villain", 2, "defend");

  runSimulation(trials, playerHero, playerVillain);
}

function runSimulation(trials, playerHero, playerVillain) {
  var hero = {
        "position": playerHero[PLAYERSTAT.position],
        "name": playerHero[PLAYERSTAT.name],
        "id": playerHero[PLAYERSTAT.id],
        "battlestats": playerHero[PLAYERSTAT.battleStats],
        "life": playerHero[PLAYERSTAT.life],
        "passives": playerHero[PLAYERSTAT.passives],
        "weapons": playerHero[PLAYERSTAT.weapons],
        "armour": playerHero[PLAYERSTAT.armour],
        "attacksettings": playerHero[PLAYERSTAT.attackSettings],
        "defendsettings": playerHero[PLAYERSTAT.defendSettings],
        "perks": {
            "education": playerHero[PLAYERSTAT.educationPerks],
            "faction": playerHero[PLAYERSTAT.factionPerks],
            "company": playerHero[PLAYERSTAT.companyPerks],
            "property": playerHero[PLAYERSTAT.propertyPerks],
            "merits": playerHero[PLAYERSTAT.meritPerks]
        }
      };
  var villain = {
        "position": playerVillain[PLAYERSTAT.position],
        "name": playerVillain[PLAYERSTAT.name],
        "id": playerVillain[PLAYERSTAT.id],
        "battlestats": playerVillain[PLAYERSTAT.battleStats],
        "life": playerVillain[PLAYERSTAT.life],
        "passives": playerVillain[PLAYERSTAT.passives],
        "weapons": playerVillain[PLAYERSTAT.weapons],
        "armour": playerVillain[PLAYERSTAT.armour],
        "attacksettings": playerVillain[PLAYERSTAT.attackSettings],
        "defendsettings": playerVillain[PLAYERSTAT.defendSettings],
        "perks": {
            "education": playerVillain[PLAYERSTAT.educationPerks],
            "faction": playerVillain[PLAYERSTAT.factionPerks],
            "company": playerVillain[PLAYERSTAT.companyPerks],
            "property": playerVillain[PLAYERSTAT.propertyPerks],
            "merits": playerVillain[PLAYERSTAT.meritPerks]
        }
      };


   fight_simulation(hero, villain, trials, displayResults, readyUI);
}

function create_weapon_settings(prefix, type, legend, has_reload, default_priority) {
  var elementId = prefix + type;
  var element = document.getElementById(elementId + 'settings');
  var overallSettings = document.getElementById(prefix + 'fightsettings');
  var sliderHTML = "", reloadHTML = "", ammoHTML = "";
  if (type != "temporary") {
    sliderHTML = `Damage<br><input id="${elementId}dmgrange" type="range" value="0" min="0" max="100" oninput="this.nextElementSibling.value = (this.value/100).toFixed(2)"><output>0</output><br>`
               + `Accuracy<br><input id="${elementId}accrange" type="range" value="0" min="0" max="100" oninput="this.nextElementSibling.value = (this.value/100).toFixed(2)"><output>0</output><br>`
               + `Bonus<br><input id="${elementId}procrange" type="range" value="0" min="0" max="100" oninput="this.nextElementSibling.value = this.value + '%'" disabled><output>0%</output><br>`;
  }

  if (has_reload) {
    reloadHTML = `Reload <input type="checkbox" id="${elementId}reload" name="${elementId}reload"><br>`
    ammoHTML = `Ammo<br><select id="${elementId}ammo">`
             + `<option value="" selected>Standard Ammo</option>`
             + `<option value="HP">Hollow Point</option>`
             + `<option value="PI">Piercing</option>`
             + `<option value="IN">Incendiary</option>`
             + `<option value="TR">Tracer</option>`
             + `</select><br>`
  }
  element.innerHTML = `<legend>${legend}</legend><select id="${elementId}"></select><br>`
                    + ammoHTML
                    + sliderHTML
                    + `Experience<br>`
                    + `<input id="${elementId}experience" type="range" value="0" min="0" max="100" oninput="this.nextElementSibling.value = this.value + '%'">`
                    + `<output>0%</output><br>`
                    + `Mastery Merits<br>`
                    + `<input id="${elementId}mastery" type="range" value="0" min="0" max="10" oninput="this.nextElementSibling.value = this.value">`
                    + `<output>0</output>`;
  overallSettings.innerHTML += `<strong>${legend}</strong><br>`
                             + `Priority <input type="text" id="${elementId}priority" size=3 value=${default_priority}><br>`
                             + reloadHTML
                             + `<br>`;
}

function updateWeaponSlides(event) {
  var weaponKey = event.target.value;
  var weapon = getWeaponList()[event.target.id.substring(1)][weaponKey];

  var slider = document.getElementById(event.target.id + "dmgrange")
  slider.setAttribute("min", weapon.damage_range[0]*100);
  slider.setAttribute("max", weapon.damage_range[1]*100);
  slider.value = weapon.damage_range[0] * 100;
  slider.nextElementSibling.value = (weapon.damage_range[0]).toFixed(2);

  slider = document.getElementById(event.target.id + "accrange")
  slider.setAttribute("min", weapon.accuracy_range[0]*100);
  slider.setAttribute("max", weapon.accuracy_range[1]*100);
  slider.value = weapon.accuracy_range[0] * 100;
  slider.nextElementSibling.value = (weapon.accuracy_range[0]).toFixed(2);

  slider = document.getElementById(event.target.id + "procrange")

  if (weapon.bonus.procrange != "n/a") {
    slider.setAttribute("min", weapon.bonus.procrange[0]);
    slider.setAttribute("max", weapon.bonus.procrange[1]);
    slider.value = Math.floor((weapon.bonus.procrange[0] + weapon.bonus.procrange[1])/2);
    slider.nextElementSibling.value = slider.value;
    slider.disabled = false;
  } else{
    slider.disabled = true;
  }
}

function populate_weapon_list(prefix, type, weapon_list) {
  var elementId = prefix + type;
  var select = document.getElementById(elementId);
  var option_list = '';
  for (var key in weapon_list) {
    if (weapon_list.hasOwnProperty(key)) {
      option_list += `<option value="${key}" ${weapon_list[key]?.default ? "selected":""}>${weapon_list[key].name}</option>`;
      if (weapon_list[key]?.default) {
        var slider = document.getElementById(elementId + "accrange")
        slider.setAttribute("min", weapon_list[key].accuracy_range[0]*100);
        slider.setAttribute("max", weapon_list[key].accuracy_range[1]*100);
        slider.value = weapon_list[key].accuracy_range[0] * 100;
        slider.nextElementSibling.value = (weapon_list[key].accuracy_range[0]).toFixed(2);

        slider = document.getElementById(elementId + "dmgrange")
        slider.setAttribute("min", weapon_list[key].damage_range[0]*100);
        slider.setAttribute("max", weapon_list[key].damage_range[1]*100);
        slider.value = weapon_list[key].damage_range[0] * 100;
        slider.nextElementSibling.value = (weapon_list[key].damage_range[0]).toFixed(2);

        slider = document.getElementById(elementId + "procrange")
        if (weapon_list[key].bonus.procrange != "n/a") {
          slider.setAttribute("min", weapon_list[key].bonus.procrange[0]);
          slider.setAttribute("max", weapon_list[key].bonus.procrange[1]);
          slider.value = Math.floor((weapon_list[key].bonus.procrange[0] + weapon_list[key].bonus.procrange[1])/2);
          slider.nextElementSibling.value = slider.value;
          slider.disabled = false;
        } else{
          slider.disabled = true;
        }
      }
    }
  }
  select.innerHTML = option_list;

  if (type != "temporary") {
    var element = document.getElementById(elementId);
    element.addEventListener("change", updateWeaponSlides);
  }
}

function create_armour_settings(elementId, legend) {
  var element = document.getElementById(elementId + 'settings');
  element.innerHTML = `<strong>${legend}</strong><br><select id="${elementId}"></select>` +
                      `<input id="${elementId}range" type="range" value="0" min="0" max="100" oninput="this.nextElementSibling.value = (this.value/100).toFixed(2)"><output>0</output>`
}

function updateArmourSlide(event) {
  var armourKey = event.target.value;
  var armour = getArmourList()[event.target.id.substring(1)][armourKey];

  var slider = document.getElementById(event.target.id + "range")
  slider.setAttribute("min", armour.armour_range[0]*100);
  slider.setAttribute("max", armour.armour_range[1]*100);
  var scaledMiddleValue = (armour.armour_range[0] + armour.armour_range[1]) * 50;
  slider.value = scaledMiddleValue;
  slider.nextElementSibling.value = (scaledMiddleValue/100).toFixed(2);
}

function populate_armour_list(elementId, armour_list) {
  var select = document.getElementById(elementId);
  var option_list = '';
  for (var key in armour_list) {
    if (armour_list.hasOwnProperty(key)) {
      option_list += `<option value="${key}" ${armour_list[key]?.default ? "selected":""}>${armour_list[key].type}</option>`;
      if (armour_list[key]?.default) {
        var slider = document.getElementById(elementId + "range")
        slider.setAttribute("min", armour_list[key].armour_range[0]*100);
        slider.setAttribute("max", armour_list[key].armour_range[1]*100);
        var scaledMiddleValue = (armour_list[key].armour_range[0] + armour_list[key].armour_range[1]) * 50;
        slider.value = scaledMiddleValue;
        slider.nextElementSibling.value = (scaledMiddleValue/100).toFixed(2);
      }
    }
  }
  select.innerHTML = option_list;

  var element = document.getElementById(elementId);
  element.addEventListener("change", updateArmourSlide);
}

function create_company_settings(elementId) {

}

function populate_company_list(elementId, company_list) {
  var option_list = '<option value="n/a"></option>';
  for (var key in company_list) {
    if (company_list.hasOwnProperty(key)) {
      var star_levels = company_list[key];
      for (var star of star_levels) {
        option_list += `<option value="${key}|${star}">${key} - ${star} stars</option>`;
      }
    }
  }
  document.getElementById(elementId).innerHTML = option_list;
}

function create_mod_settings(elementId) {
  var element = document.getElementById(elementId + 'settings');
  element.innerHTML += `<br>Mods<br><select id="${elementId}mod1"></select><br><select id="${elementId}mod2"></select>`;
}

function populate_mods_list(elementId, mod_list) {
  var option_list = '<option value="n/a"></option>';
  for (var key in mod_list) {
    if (mod_list.hasOwnProperty(key)) {
      option_list += `<option value="${key}">${key}</option>`;
    }
  }
  document.getElementById(elementId+"mod1").innerHTML = option_list;
  document.getElementById(elementId+"mod2").innerHTML = option_list;
}

function loadhero() {
  var player = document.getElementById("himport").value;
  if (player != "") {
    console.log("Loading Villain from import");
    var playerObject = JSON.parse(player)
    console.log(playerObject);
    playerObject.position = "attack";
    setPlayerUI("h", playerObject);
  }
}

function dumphero() {
  document.getElementById("hexport").value = JSON.stringify(getPlayerObject("h", "Hero", 1, "attack"));
}

function loadvillain() {
  var player = document.getElementById("vimport").value;
  if (player != "") {
    console.log("Loading Villain from import");
    var playerObject = JSON.parse(player)
    console.log(playerObject);
    playerObject.position = "defend";
    setPlayerUI("v", playerObject);
  }
}

function dumpvillain() {
  document.getElementById("vexport").value = JSON.stringify(getPlayerObject("v", "Villain", 2, "defend"));
}

// Doesn't copy priority as that has sematic differences
function copyhero() {
  var player = getPlayerObject("h", "Hero", 1, "attack");
  setPlayerUI("v", player);
}

function copyvillain() {
  var player = getPlayerObject("v", "Villain", 2, "defend");
  setPlayerUI("h", player);
}

function setPlayerWeaponUI(prefix, type, weapon, mastery) {
  var elementId = prefix + type;
  document.getElementById(elementId).value = weapon.id;
  if(type != "temporary") {
    if (type != "melee") {
      document.getElementById(elementId + "ammo").value = weapon.ammo;
      document.getElementById(elementId + "mod1").value = weapon.mods.one;
      document.getElementById(elementId + "mod2").value = weapon.mods.two;
    }
    document.getElementById(elementId + "accrange").min = weapon.accuracy_range[0] * 100;
    document.getElementById(elementId + "accrange").max = weapon.accuracy_range[1] * 100;
    document.getElementById(elementId + "accrange").value = weapon.accuracy*100;
    document.getElementById(elementId + "accrange").nextElementSibling.innerText = weapon.accuracy.toFixed(2);
    document.getElementById(elementId + "dmgrange").min = weapon.damage_range[0] * 100;
    document.getElementById(elementId + "dmgrange").max = weapon.damage_range[1] * 100;
    document.getElementById(elementId + "dmgrange").value = weapon.damage * 100;
    document.getElementById(elementId + "dmgrange").nextElementSibling.innerText = weapon.damage.toFixed(2);
    if (weapon.bonus.procrange != "n/a") {
      document.getElementById(elementId + "procrange").min = weapon.bonus.procrange[0];
      document.getElementById(elementId + "procrange").max = weapon.bonus.procrange[1];
      document.getElementById(elementId + "procrange").value = weapon.bonus.proc;
      document.getElementById(elementId + "procrange").disabled = false;
      document.getElementById(elementId + "procrange").nextElementSibling.innerText = weapon.bonus.proc + "%";
    } else {
      document.getElementById(elementId + "procrange").min = 0;
      document.getElementById(elementId + "procrange").max = 0;
      document.getElementById(elementId + "procrange").value = 0;
      document.getElementById(elementId + "procrange").disabled = true;
      document.getElementById(elementId + "procrange").nextElementSibling.innerText = "0%";
    }
  }
  document.getElementById(elementId + "experience").value = weapon.experience;
  document.getElementById(elementId + "experience").nextElementSibling.innerText = weapon.experience + "%";
  document.getElementById(elementId + "mastery").value = mastery;
  document.getElementById(elementId + "mastery").nextElementSibling.innerText = mastery;
}

function setPlayerArmourUI(prefix, type, armour) {
  var elementId = prefix + type;
  document.getElementById(elementId).value = armour.id;
  document.getElementById(elementId + "range").min = armour.armour_range[0] * 100;
  document.getElementById(elementId + "range").max = armour.armour_range[1] * 100;
  document.getElementById(elementId + "range").value = armour.armour * 100;
  document.getElementById(elementId + "range").nextElementSibling.value = armour.armour.toFixed(2);
}

function setPlayerUI(prefix, player) {
  // stats
  var battleStats = player[PLAYERSTAT.battleStats];  
  document.getElementById(prefix + "strength").value = battleStats.strength.toLocaleString("en");
  document.getElementById(prefix + "speed").value = battleStats.speed.toLocaleString("en");
  document.getElementById(prefix + "defense").value = battleStats.defense.toLocaleString("en");
  document.getElementById(prefix + "dexterity").value = battleStats.dexterity.toLocaleString("en");
  document.getElementById(prefix + "life").value = player[PLAYERSTAT.life].toLocaleString("en");

  // passives
  var passives = player[PLAYERSTAT.passives];
  document.getElementById(prefix + "strengthmerits").value = passives.strength.toLocaleString("en");
  document.getElementById(prefix + "speedmerits").value = passives.speed.toLocaleString("en");
  document.getElementById(prefix + "defensemerits").value = passives.defense.toLocaleString("en");
  document.getElementById(prefix + "dexteritymerits").value = passives.dexterity.toLocaleString("en");

  // armour
  var armour = player[PLAYERSTAT.armour];
  setPlayerArmourUI(prefix, "head", armour.head);
  setPlayerArmourUI(prefix, "body", armour.body);
  setPlayerArmourUI(prefix, "hands", armour.hands);
  setPlayerArmourUI(prefix, "legs", armour.legs);
  setPlayerArmourUI(prefix, "feet", armour.feet);

  // weapons
  var merits = player[PLAYERSTAT.meritPerks];
  var weapons = player[PLAYERSTAT.weapons];
  setPlayerWeaponUI(prefix, "primary", weapons.primary, merits[weapons.primary.category.replace(/ /g, "").toLowerCase() + "mastery"]);
  setPlayerWeaponUI(prefix, "secondary", weapons.secondary, merits[weapons.secondary.category.replace(/ /g, "").toLowerCase() + "mastery"]);
  setPlayerWeaponUI(prefix, "melee", weapons.melee, merits[weapons.melee.category.replace(/ /g, "").toLowerCase() + "mastery"]);
  setPlayerWeaponUI(prefix, "temporary", weapons.temporary, merits["temporarymastery"]);

  // Other merits & perks
  document.getElementById(prefix + "critmerits").value = merits.critrate;
  document.getElementById(prefix + "critmerits").nextElementSibling.innerText = merits.critrate;
  document.getElementById(prefix + "property").checked = player[PLAYERSTAT.propertyPerks].damage;

  // Faction
  var factionPerks = player[PLAYERSTAT.factionPerks];
  document.getElementById(prefix + "factiondamage").value = factionPerks.damage;
  document.getElementById(prefix + "factiondamage").nextElementSibling.innerText = factionPerks.damage + "%";
  document.getElementById(prefix + "factionaccuracy").value = factionPerks.accuracy;
  document.getElementById(prefix + "factionaccuracy").nextElementSibling.innerText = "+" + (factionPerks.accuracy/5).toFixed(1);

  // company
  var companyPerks = player[PLAYERSTAT.companyPerks];
  document.getElementById(prefix + "company").value = companyPerks.name + "|" + companyPerks.star;

  // education
  var educationPerks = player[PLAYERSTAT.educationPerks]
  document.getElementById(prefix + "damage").checked = educationPerks.damage;
  document.getElementById(prefix + "neck").checked = educationPerks.neckdamage;
  document.getElementById(prefix + "meleedamage").checked = educationPerks.meleedamage;
  document.getElementById(prefix + "temporarydamage").checked = educationPerks.tempdamage;
  document.getElementById(prefix + "temporarybooster").checked = educationPerks.needleeffect;
  document.getElementById(prefix + "japanesedamage").checked = educationPerks.japanesedamage;
  document.getElementById(prefix + "fist").checked = educationPerks.fistdamage;
  document.getElementById(prefix + "critchance").checked = educationPerks.critchance;
  document.getElementById(prefix + "machinegunaccuracy").checked = educationPerks.machinegunaccuracy;
  document.getElementById(prefix + "smgaccuracy").checked = educationPerks.smgaccuracy;
  document.getElementById(prefix + "pistolaccuracy").checked = educationPerks.pistolaccuracy;
  document.getElementById(prefix + "rifleaccuracy").checked = educationPerks.rifleaccuracy;
  document.getElementById(prefix + "heavyartilleryaccuracy").checked = educationPerks.heavyartilleryaccuracy;
  document.getElementById(prefix + "temporaryaccuracy").checked = educationPerks.temporaryaccuracy;
  document.getElementById(prefix + "shotgunaccuracy").checked = educationPerks.shotgunaccuracy;
  document.getElementById(prefix + "ammo1").checked = educationPerks.ammocontrol1;
  document.getElementById(prefix + "ammo2").checked = educationPerks.ammocontrol2;

  // attack/defend settings
  
  var settings
  if (prefix == "h") {
    settings = player[PLAYERSTAT.attackSettings];
  } else {
    settings = player[PLAYERSTAT.defendSettings];
  }
  if (settings != "") {
    document.getElementById(prefix + "primarypriority").value = settings.primary.setting;
    document.getElementById(prefix + "primaryreload").checked = settings.primary.reload;
    document.getElementById(prefix + "secondarypriority").value = settings.secondary.setting;
    document.getElementById(prefix + "secondaryreload").checked = settings.secondary.reload;
    document.getElementById(prefix + "meleepriority").value = settings.melee.setting;
    document.getElementById(prefix + "temporarypriority").value = settings.temporary.setting;
  }
}

document.getElementById('heducation').onclick = function() {
    var checkboxes = document.getElementsByName('heducation');
    for (var checkbox of checkboxes) {
        checkbox.checked = this.checked;
    }
}

document.getElementById('veducation').onclick = function() {
    var checkboxes = document.getElementsByName('veducation');
    for (var checkbox of checkboxes) {
        checkbox.checked = this.checked;
    }
}

function controlLife() {
  if(!displayLife) {
    document.getElementById("control-life").value = "Stop Life Histo";
  } else {
    document.getElementById("control-life").value = "Enable Life Histo";
  }
  displayLife = !displayLife
}

const columns = {
   timestamp: 0
   , player: 1
   , life: 2
   , count: 3
};

// JSON to CSV Converter
function convertToCSV(array) {
   var str = '';
   var headerDetails = array[0];
   str += headerDetails.join();
   str += '\r\n';
   for (var i = 1; i < array.length; i++) {
      var details = array[i];
      str += details.join() + '\r\n';
   }

   return str;
}

function playerLifeCSV(timestamp, data, player, lifestats, losses) {
   
   data = data.concat([[timestamp, player, 0, losses]]);
   for (var life=0; life < lifestats.length; life++) {
      var count = lifestats[life];
      data = data.concat([[timestamp, player, life+1, count]]);
   }

   return data;
}

function downloadLife() {
   // globalResults = [results[0], results[1], results[2], results[3], trials, results[4], results[5]]; //hw, vw, s, turns, trials, hl, vl
   var timestamp = (new Date().getTime()/1000|0);
   var allLife = [
      ["Save Timestamp", "Player", "Life", "Count", "Hero Wins", "Stalemates", "Villain Wins", "Turns", "Hero Life", "Villain Life", "Trials"],
      [timestamp, "Stats", "", "", globalResults[0], globalResults[2], globalResults[1], globalResults[3], globalResults[5], globalResults[6], globalResults[4]]
   ];
   var player = "Hero";
   allLife = playerLifeCSV(timestamp, allLife, player, hlifestats, globalResults[1]);
   player = "Villain";
   allLife = playerLifeCSV(timestamp, allLife, player, vlifestats, globalResults[0]);

   var csv = convertToCSV(allLife);
   var uri = "data:text/csv;charset=utf-8," + escape(csv);
   var downloadLink = document.createElement("a");
   downloadLink.href = uri;
   downloadLink.download = `fightsim_${timestamp}.csv`;
   document.body.appendChild(downloadLink);
   downloadLink.click();
   document.body.removeChild(downloadLink);
}

function changeStats(prefix, multiplier) {
  var str = parseInt(document.getElementById(prefix + "strength").value.replace(/,/g,''), 10);
  var spd = parseInt(document.getElementById(prefix + "speed").value.replace(/,/g,''), 10);
  var def = parseInt(document.getElementById(prefix + "defense").value.replace(/,/g,''), 10);
  var dex = parseInt(document.getElementById(prefix + "dexterity").value.replace(/,/g,''), 10);

  document.getElementById(prefix + "strength").value = Math.round(str*multiplier,0).toLocaleString("en");
  document.getElementById(prefix + "speed").value = Math.round(spd*multiplier,0).toLocaleString("en");
  document.getElementById(prefix + "defense").value = Math.round(def*multiplier,0).toLocaleString("en");
  document.getElementById(prefix + "dexterity").value = Math.round(dex*multiplier,0).toLocaleString("en");
}

function increaseStats() {
  changeStats(this.id.charAt(0), 10);
}

function decreaseStats (){
  changeStats(this.id.charAt(0), 0.1);
}

document.getElementById("control-life").addEventListener("click", controlLife);
document.getElementById("download-life-csv").addEventListener("click", downloadLife);

document.getElementById("submit").addEventListener("click", run);
document.getElementById("copyhero").addEventListener("click", copyhero);
document.getElementById("copyvillain").addEventListener("click", copyvillain);

document.getElementById("hload").addEventListener("click", loadhero);
document.getElementById("hdump").addEventListener("click", dumphero);
document.getElementById("vload").addEventListener("click", loadvillain);
document.getElementById("vdump").addEventListener("click", dumpvillain);

document.getElementById("hincrease").addEventListener("click", increaseStats);
document.getElementById("hdecrease").addEventListener("click", decreaseStats);
document.getElementById("vincrease").addEventListener("click", increaseStats);
document.getElementById("vdecrease").addEventListener("click", decreaseStats)

function start() {
  loadArmour(create_armour_settings, populate_armour_list);
  loadWeapons(create_weapon_settings, populate_weapon_list);
  loadMods(create_mod_settings, populate_mods_list);
  loadCompanies(create_company_settings, populate_company_list)
}