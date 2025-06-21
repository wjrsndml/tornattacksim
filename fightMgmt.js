var players={}, a, weapons, armours, m, t, companies;

function getArmourList() {
  return armours;
}

function getWeaponList() {
  return weapons;
}

function getCompanyList() {
  return companies;
}

async function loadMods(create_mod_settings, populate_mods_list) {
  create_mod_settings("hprimary");
  create_mod_settings("vprimary");
  create_mod_settings("hsecondary");
  create_mod_settings("vsecondary");

  fetch("mods.json")
    .then(response => response.json())
    .then(json => {
      m = json;

      populate_mods_list("hprimary", m);
      populate_mods_list("vprimary", m);
      populate_mods_list("hsecondary", m);
      populate_mods_list("vsecondary", m);
    }
  );
}      

async function loadWeapons(create_weapon_settings, populate_weapon_list) {
  create_weapon_settings("h", "primary", "Primary Weapon", true, 1);
  create_weapon_settings("v", "primary", "Primary Weapon", true, 100);
  create_weapon_settings("h", "secondary", "Secondary Weapon", true, 0);
  create_weapon_settings("v", "secondary", "Secondary Weapon", true, 0);
  create_weapon_settings("h", "melee", "Melee Weapon", false, 2);
  create_weapon_settings("v", "melee", "Melee Weapon", false, 1);
  create_weapon_settings("h", "temporary", "Temporary Weapon", false, 0);
  create_weapon_settings("v", "temporary", "Temporary Weapon", false, 0);
  //create_weapon_settings("h", "unarmed", "Unarmed", false, 0);
  //create_weapon_settings("v", "unarmed", "Unarmed", false, 0);

  fetch("weapons.json")
    .then(response => response.json())
    .then(json => {
      weapons = json;
      var primary = weapons.primary;
      var secondary = weapons.secondary;
      var melee = weapons.melee;
      var temporary = weapons.temporary
      t = weapons.tempBlock;

      populate_weapon_list("h", "primary", primary);
      populate_weapon_list("v", "primary", primary);
      populate_weapon_list("h", "secondary", secondary);
      populate_weapon_list("v", "secondary", secondary);
      populate_weapon_list("h", "melee", melee);
      populate_weapon_list("v", "melee", melee);
      populate_weapon_list("h", "temporary", temporary);
      populate_weapon_list("v", "temporary", temporary);
    }
  );
}

async function loadArmour(create_armour_settings, populate_armour_list) {
  create_armour_settings("hhead", "Head");
  create_armour_settings("hhands", "Hands");
  create_armour_settings("hbody", "Body");
  create_armour_settings("hlegs", "Legs");
  create_armour_settings("hfeet", "Feet");
  create_armour_settings("vhead", "Head");
  create_armour_settings("vhands", "Hands");
  create_armour_settings("vbody", "Body");
  create_armour_settings("vlegs", "Legs");
  create_armour_settings("vfeet", "Feets");
  
  fetch("armourCoverage.json")
    .then(response => response.json())
    .then(json => a = json);

  fetch("armour.json")
    .then(response => response.json())
    .then(json => {
      armours = json;
      var head = armours.head;
      var hands = armours.hands;
      var body = armours.body;
      var legs = armours.legs;
      var feet = armours.feet;

      populate_armour_list("hhead", head);
      populate_armour_list("hhands", hands);
      populate_armour_list("hbody", body);
      populate_armour_list("hlegs", legs);
      populate_armour_list("hfeet", feet);
      populate_armour_list("vhead", head);
      populate_armour_list("vhands", hands);
      populate_armour_list("vbody", body);
      populate_armour_list("vlegs", legs);
      populate_armour_list("vfeet", feet);     
    }
  );
}

async function loadCompanies(create_company_settings, populate_company_list) {
  create_company_settings("hcompany");
  create_company_settings("vcompany");
  
  fetch("companies.json")
    .then(response => response.json())
    .then(json => {
      companies = json;

      populate_company_list("hcompany", companies);
      populate_company_list("vcompany", companies);
    }
  );
}

var fightWorker = new Worker('fightSimulator.js')

function fight_simulation(hero, villain, trials, displayResults, readyUI) {
  players[hero.id.toString()] = hero;
  players[villain.id.toString()] = villain;
  var workerMsg = {
    fightControl: [hero.id, villain.id, trials],
    players: players,
    a: a,
    weapons: weapons,
    armours: armours,
    m: m,
    t: t,
    companies: companies
  }  
  fightWorker.postMessage(workerMsg);

  fightWorker.onmessage = function(e) {
    displayResults(e.data.results, e.data.trials, trials);
    if(e.data.trials == trials) {
      readyUI(true);
    }
  }
}