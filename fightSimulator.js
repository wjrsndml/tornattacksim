const PARTIAL_FREQUENCY = 10000;

const MATH_LOG_14_UNDER_50 = 50 / Math.log(14);
const MATH_LOG_32_UNDER_50 = 50 / Math.log(32);

var players={}, a, weapons, armours, m, t, companies;

onmessage = function(e) {
  console.log('Message received from fight management script');
  var hero_id = e.data.fightControl[0];
  var villain_id = e.data.fightControl[1];
  var trials = e.data.fightControl[2];

  players = e.data.players;
  a = e.data.a;
  weapons = e.data.weapons;
  armours = e.data.armours;
  m = e.data.m;
  t = e.data.t;
  companies = e.data.companies;

  h = Object.assign({}, players[hero_id.toString()]);
  console.log(h);
  v = Object.assign({}, players[villain_id.toString()]);
  console.log(v);

  // h= hero, v= villian
  //hWin, vWin, stale, turns,  hLife, vLife, hProcs, vProcs, hLifeStats, vLifeStats
  let results = [0,0,0,0,0,0,0,0, [], []]

  var posted;
  for (let i=0;i<trials;i++) {
    posted = false
    results = fight(h,v,results)
    var doneFights = i+1;
    if ((doneFights % PARTIAL_FREQUENCY) == 0) {
      console.log('Posting partial update back to fight management script');
      postMessage({results: results, trials: doneFights});
      posted = true;
    }
  }

  if (posted) {
    console.log('Posted final results back to fight management script');
  } else {
    console.log('Posting final results back to fight management script');
    postMessage({results, trials});
  }
}

function fight(h,v,results) {
    let hPrim = h['weapons']['primary'], hSec = h['weapons']['secondary'];
    let vPrim = v['weapons']['primary'], vSec = v['weapons']['secondary'];

    let hModsPrim = applyPMbefore(h,hPrim['mods']), hModsSec = applyPMbefore(h,hSec['mods']);
    let vModsPrim = applyPMbefore(v,vPrim['mods']), vModsSec = applyPMbefore(v,vSec['mods']);

    let hCL = Object.assign(h['life']), vCL = Object.assign(v['life']);
    let turns = 0
    let fightLogMessage = [];
    // status effects: demoralize, freeze, wither, slow, weaken, cripple
    // [0]: dealt, [1]: received
    let hSE = [[0,0,0,0,0,0],[0,0,0,0,0,0]], vSE = [[0,0,0,0,0,0],[0,0,0,0,0,0]];
    // DOT effects: Burn, Poison, Lacerate, Severe Burn
    let hDOT = [[0,0],[0,0],[0,0],[0,0]], vDOT = [[0,0],[0,0],[0,0],[0,0]];
    let h_set = JSON.parse(JSON.stringify(h['attacksettings']));
    let v_set = JSON.parse(JSON.stringify(v['defendsettings']));
    let h_temps = [0], v_temps = [0];

    let hWS = {
        "primary": {
            "ammoleft": Math.round(hPrim['clipsize'] * hModsPrim[0]),
            "maxammo": Math.round(hPrim['clipsize'] * hModsPrim[0]),
            "clipsleft": hModsPrim[1],
            "rof": [Math.max(1,hPrim['rateoffire'][0] * hModsPrim[2]),Math.max(1,hPrim['rateoffire'][1] * hModsPrim[2])]
        },
        "secondary": {
            "ammoleft": Math.round(hSec['clipsize'] * hModsSec[0]),
            "maxammo": Math.round(hSec['clipsize'] * hModsSec[0]),
            "clipsleft": hModsSec[1],
            "rof": [Math.max(1,hSec['rateoffire'][0] * hModsSec[2]),Math.max(1,hSec['rateoffire'][1] * hModsSec[2])]
        },
        "melee": {
            "ammoleft": "n/a",
            "storageused": false
        },
        "temporary": {
            "ammoleft": "n/a",
            "initialsetting": Object.assign(h_set['temporary']['setting'])
        }
    }
    let vWS = {
        "primary": {
            "ammoleft": Math.round(vPrim['clipsize'] * vModsPrim[0]),
            "maxammo": Math.round(vPrim['clipsize'] * vModsPrim[0]),
            "clipsleft": vModsPrim[1],
            "rof": [Math.max(1,vPrim['rateoffire'][0] * vModsPrim[2]),Math.max(1, vPrim['rateoffire'][1] * vModsPrim[2])]
        },
        "secondary": {
            "ammoleft": Math.round(vSec['clipsize'] * vModsSec[0]),
            "maxammo": Math.round(vSec['clipsize'] * vModsSec[0]),
            "clipsleft": vModsSec[1],
            "rof": [Math.max(1, vSec['rateoffire'][0] * vModsSec[2]),Math.max(1, vSec['rateoffire'][1] * vModsSec[2])]
        },
        "melee": {
            "ammoleft": "n/a",
            "storageused": false
        },
        "temporary": {
            "ammoleft": "n/a",
            "initialsetting": Object.assign(v_set['temporary']['setting'])
        }
    }

    for (let i=0;i<25;i++) {
        turns += 1

        let turnReturn = takeTurns(h,v,turns,hCL,vCL,hWS,vWS,hSE,vSE,hDOT,vDOT,h_set,v_set,h_temps,v_temps)
        fightLogMessage = fightLogMessage.concat(turnReturn[0]);
        hCL = turnReturn[1], vCL = turnReturn[2];
        hWS = turnReturn[3], vWS = turnReturn[4];
        hSE = turnReturn[5], vSE = turnReturn[6];
        hDOT = turnReturn[7], vDOT = turnReturn[8]
        h_set = turnReturn[9], v_set = turnReturn[10];
        h_temps = turnReturn[11], v_temps = turnReturn[12];

        if (hCL == 0) {
            results[1] += 1
            fightLogMessage.push(v['name'] + " won. ");
            break;
        } else if (vCL == 0) {
            results[0] += 1
            fightLogMessage.push(h['name'] + " won. ");
            break;
        }
    }

    if (turns == 25 && hCL > 0 && vCL > 0) {
        fightLogMessage.push("Stalemate.");
        results[2] += 1;
    }

    results[3] += turns;
    results[4] += hCL;
    results[5] += vCL;
    results[6] = fightLogMessage;
    if(results[8][hCL] === undefined) {
      results[8][hCL] = 1;
    } else {
      results[8][hCL] += 1;
    }
    if(results[9][vCL] === undefined) {
      results[9][vCL] = 1;
    } else {
      results[9][vCL] += 1;
    }
    return results;

}

function takeTurns(h,v,turn,hCL,vCL,hWS,vWS,hSE,vSE,hDOT,vDOT,h_set,v_set,h_temps,v_temps) {

    let log = [];

    let h_action = action([],h,v,hCL,vCL,hWS,vWS,hSE,vSE,hDOT,vDOT,h_set,v_set,h_temps,v_temps,turn)
    log = log.concat(h_action[0]);
    hCL = h_action[1], vCL = h_action[2];
    hWS = h_action[3], vWS = h_action[4];
    hSE = h_action[5], vSE = h_action[6];
    hDOT = h_action[7], vDOT = h_action[8];
    h_set = h_action[9], v_set = h_action[10];
    h_temps = h_action[11], v_temps = h_action[12];

    if (vCL == 0) {
        return [log, hCL, vCL, hWS, vWS, hSE, vSE, hDOT, vDOT, h_set, v_set, h_temps, v_temps];
    }

    let v_action = action([],v,h,vCL,hCL,vWS,hWS,vSE,hSE,vDOT,hDOT,v_set,h_set,v_temps,h_temps,turn)
    log = log.concat(v_action[0]);
    vCL = v_action[1], hCL = v_action[2];
    vWS = v_action[3], hWS = v_action[4];
    vSE = v_action[5], hSE = v_action[6];
    vDOT = v_action[7], hDOT = v_action[8];
    v_set = v_action[9], h_set = v_action[10];
    v_temps = v_action[11], h_temps = v_action[12];

    return [log, hCL, vCL, hWS, vWS, hSE, vSE, hDOT, vDOT, h_set, v_set, h_temps, v_temps];

}

function action(log,x,y,xCL,yCL,xWS,yWS,xSE,ySE,xDOT,yDOT,x_set,y_set,x_temps,y_temps,turn) {
    let xW = Object.assign({}, x['weapons']);
    let yA = JSON.parse(JSON.stringify(y['armour']));

    if (y['perks']['company']['name'] == "Clothing Store" && y['perks']['company']['star'] == 10) {
      for (let i in  yA) {
          yA[i]['armour'] *= 1.2
      }
    } else if (y['perks']['company']['name'] == "Private Security Firm" && y['perks']['company']['star'] >= 7) {
      let set, count = 0;
      for (let i in yA) {
          if (count == 0) {
              set = yA[i]['set'];
              count += 1;
          } else {
              if (yA[i]['set'] == set && set != "n/a") {
                  count += 1;
              }
          }
      }

      if (count == 5) {
          for (let i in yA) {
              yA[i]['armour'] *= 1.25;
          }
      }

    }

    // -------  turn -----------
    // choose weapons;
    let xCW = chooseWeapon(x,x_set)
    let yCW = chooseWeapon(y,y_set)

    // apply perks, mods, temps
    pmt = applyPMT(x,y,xCW,yCW,xWS,yWS,x_set,y_set,x_temps,y_temps,xSE,ySE,turn)

    let xSTR = pmt[0][0], xSPD = pmt[0][1], xDEF = pmt[0][2], xDEX = pmt[0][3];
    let x_acc_bonus = pmt[2][0], x_dmg_bonus = pmt[2][1], x_crit_chance = pmt[2][2];

    let ySTR = pmt[1][0], ySPD = pmt[1][1], yDEF = pmt[1][2], yDEX = pmt[1][3];
    let y_acc_bonus = pmt[3][0], y_dmg_bonus = pmt[3][1], y_crit_chance = pmt[3][2];

    // reduce turns left on temp. Delete from temps if turns run out.
    for (let i=0;i<x_temps.length;) {
        x_temps[i][1] -= 1
        if (x_temps[i][1] == 0) {
            x_temps.splice(i,1)
        } else {
            i++
        }
    }

    // ------- here make actual turn damage ---------------------

    // max life for cauterize and serotonin
    let xML = Object.assign(x['life']), yML = Object.assign(y['life'])

    if (xWS[xCW]['ammoleft'] == 0 && x_set[xCW]['reload'] == true) {

        // add reload to the log fight log
        log.push(x['name'] + " reloaded their " + xW[xCW]['name']);
        xWS[xCW]['ammoleft'] = xWS[xCW]['maxammo'];

        if (y['perks']['company']['name'] == "Gas Station" && y['perks']['company']['star'] >= 5) {
            rng = Math.floor(Math.random() * 10 + 1)
            if (rng == 1) {
                life = parseInt(0.2 * yML)
                if (yCL + life > yML) {
                    life = yML - yCL
                }
                yCL += life
                log.push(y['name'] + " cauterized their wound and recovered " + life + " life");
            }
        }

        for (let dot in xDOT) {

            if (yCL > 1 && xDOT[dot][0] > 0 && xDOT[dot][1] > 0) {

                let dotDMG
                if (dot == 0) {
                    // Burn
                    dotDMG = parseInt(xDOT[dot][0] * (0.15 / 5 * (6 - xDOT[dot][1])))
                    if (y['perks']['company']['name'] == "Gas Station" && y['perks']['company']['star'] >= 7) {
                        dotDMG = parseInt(dotDMG / 1.5)
                    }
                    if (x['perks']['company']['name'] == "Gas Station" && x['perks']['company']['star'] == 10) {
                        dotDMG = parseInt(dotDMG * 1.5)
                    }
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Burning damaged " +  y['name'] + " for " + dotDMG);

                    if (xDOT[dot][1] == 5) {
                        xDOT[dot] = [0,0]
                    }
                } else if (dot == 1) {
                    // Poison
                    dotDMG = parseInt(xDOT[dot][0] * (0.45 / 15 * (16 - xDOT[dot][1])))
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Poison damaged " +  y['name'] + " for " + dotDMG);

                    if (xDOT[dot][1] == 15) {
                        xDOT[dot] = [0,0]
                    }
                } else if (dot == 2) {
                    // Lacerate
                    dotDMG = parseInt(xDOT[dot][0] * (0.90 / 9 * (10 - xDOT[dot][1])))
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Laceration damaged " +  y['name'] + " for " + dotDMG);

                    if (xDOT[dot][1] == 9) {
                        xDOT[dot] = [0,0]
                    }
                } else if (dot == 3) {
                    // Severe Burn
                    dotDMG = parseInt(xDOT[dot][0] * (0.15 / 5 * (10 - xDOT[dot][1])))
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Severe burning damaged " +  y['name'] + " for " + dotDMG);

                    if (xDOT[dot][1] == 9) {
                        xDOT[dot] = [0,0]
                    }
                }

                yCL -= dotDMG;

            }

            xDOT[dot][1] += 1;

        }


    } else {

        // basic hit chance, final hc, max dmg, damage mitigation, weapon damage, armor mitigation, hit or miss, damage variance, final damage
        let xBHC, xFHC, xBP, xMD, yDM, xWDM, yAM, xHOM, xDV, xDMG = 0;
        // armor penetration, ammo dmg multi
        let x_pen = 1, x_ammo_dmg = 1;

        // non-damaging temps will not produce HOM chance nor damage value
        if (xW[xCW]['category'] != "Non-Damaging") {

            if (xW[xCW]['ammo'] == "TR") {
                x_acc_bonus += 10;
            } else if (xW[xCW]['ammo'] == "PI") {
                x_pen = 2;
            } else if (xW[xCW]['ammo'] == "HP") {
                x_pen = 1/1.5;
                x_ammo_dmg = 1.5;
            } else if (xW[xCW]['ammo'] == "IN") {
                x_ammo_dmg = 1.4;
            }

            xBHC = hitChance(xSPD,yDEX)
            xFHC = applyAccuracy(xBHC,xW[xCW]['accuracy'],x_acc_bonus)
            xHOM = hitOrMiss(xFHC);

            if (xHOM == 1) {

                if (xCW == "temporary" && xW[xCW]['name'] != "Ninja Stars" && xW[xCW]['name'] != "Throwing Knife") {
                    xBP = ["chest",1/1.75];
                } else {
                    xBP = selectBodyPart(x,x_crit_chance);
                }
                xMD = maxDamage(xSTR);
                yDM = (100-damageMitigation(yDEF,xSTR))/100;
                xWDM = xW[xCW]['damage'] / 10;
                yAM = (100 - armourMitigation(xBP[0],yA)/x_pen)/100;
                xDV = variance();

                console.log(`xSTR: ${xSTR}, yDEF: ${yDEF}, xCW: ${xCW}, xBP[0]: ${xBP[0]}, yA: ${JSON.stringify(yA)}, x_pen: ${x_pen}`);
                console.log(`${xBP[1]} * ${xMD} * ${yDM} * ${xWDM} * ${yAM} * ${xDV} * (1+${x_dmg_bonus}/100) * ${x_ammo_dmg}`);
                xDMG = Math.round(xBP[1] * xMD * yDM * xWDM * yAM * xDV * (1+x_dmg_bonus/100) * x_ammo_dmg);
                if (isNaN(xDMG)) {
                  xDMG = 0;
                }
            }

        }
        if (xCW == "primary") {

            let xRF;
            if (xW[xCW]['bonus']['name'] == "Spray" && xWS[xCW]['ammoleft'] == xWS[xCW]['maxammo']) {

                let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                if (x_proc == 1) {

                    xDMG *= 2
                    if (xDMG > yCL) {
                        xDMG = yCL;
                    }

                    xRF = xWS[xCW]['maxammo']
                    if (xHOM == 1) {
                        log.push(x['name'] + " sprayed " + xRF + " " + xW[xCW]['ammo'] + " rounds of their "
                                        + xW[xCW]['name'] + " hitting " + y['name'] + " in the "
                                        + xBP[0] + " for " + xDMG);

                    } else {
                        log.push(x['name'] + " sprayed " + xRF + " " + xW[xCW]['ammo'] + " rounds of their "
                                        + xW[xCW]['name'] + " missing " + y['name']);
                    }

                } else {

                    if (xDMG > yCL) {
                        xDMG = yCL;
                    }
                    xRF = roundsFired(xW[xCW],xWS[xCW])
                    if (xHOM == 1) {
                        log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                      + "their " + xW[xCW]['name'] + " hitting "
                                      + y['name'] + " in the " + xBP[0] + " for "
                                      + xDMG);


                    } else {
                        log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                        + "their " + xW[xCW]['name'] + " missing "
                                        + y['name']);
                    }
                }



            } else {

                if (xDMG > yCL) {
                    xDMG = yCL;
                }

                xRF = roundsFired(xW[xCW],xWS[xCW])
                if (xHOM == 1) {

                    log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                    + "their " + xW[xCW]['name'] + " hitting "
                                    + y['name'] + " in the " + xBP[0] + " for "
                                    + xDMG);

                    if (xW[xCW]['bonus']['name'] == "Demoralize") {
                        if (xSE[0][0] < 5) {
                            let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                            if (x_proc == 1) {
                                xSE[0][0] += 1;
                                ySE[1][0] += 1;
                                log.push(y['name'] + " has been Demoralized.");
                            }
                        }
                    } else if (xW[xCW]['bonus']['name'] == "Freeze") {
                        if (xSE[0][1] < 1) {
                            let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                            if (x_proc == 1) {
                                xSE[0][1] += 1;
                                ySE[1][1] += 1;
                                log.push(y['name'] + " has been Frozen.");
                            }
                        }
                    } else if (xW[xCW]['bonus']['name'] == "Blindfire" && xWS[xCW]['ammoleft'] - xRF != 0) {

                        let x_proc = procBonus(xW[xCW]['bonus']['proc']);
                        if (x_proc == 1) {

                            let totalDMG = xDMG,totalRounds = xRF;
                            for (let i = 0;i<15;i++) {

                                x_acc_bonus -= 5;
                                xFHC = applyAccuracy(xBHC,xW[xCW]['accuracy'],x_acc_bonus)
                                xHOM = hitOrMiss(xFHC);

                                if (xHOM == 1) {

                                    xBP = selectBodyPart(x_crit_chance);
                                    yAM = (100 - armourMitigation(xBP[0],yA)/x_pen)/100;
                                    xDV = variance();
                                    xDMG = Math.round(xBP[1] * xMD * yDM * xWDM * yAM * xDV * (1+x_dmg_bonus/100) * x_ammo_dmg);
                                    if (isNaN(xDMG)) {
                                      xDMG = 0;
                                    }
                                }

                                if (totalDMG + xDMG > yCL) {
                                    xDMG = yCL - totalDMG;
                                }

                                xRF = roundsFired(xW[xCW],xWS[xCW])

                                if (totalRounds + xRF > xWS[xCW]['ammoleft']) {
                                    xRF = xWS[xCW]['ammoleft'] - totalRounds;
                                    if (xRF <= 0) {
                                        break;
                                    }
                                }

                                if (xHOM == 1) {

                                    log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                                    + "their " + xW[xCW]['name'] + " hitting "
                                                    + y['name'] + " in the " + xBP[0] + " for "
                                                    + xDMG);
                                } else {
                                    log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                                    + "their " + xW[xCW]['name'] + " missing "
                                                    + y['name']);
                                }

                                totalDMG += xDMG;
                                if (totalDMG == yCL) {
                                    xDMG = totalDMG; // pass total value back to hDMG to subtract it from yCL
                                    xRF = totalRounds;
                                    break;
                                }

                                totalRounds += xRF;
                                if (totalRounds == xWS[xCW]['ammoleft']) {
                                    xDMG = totalDMG; // pass total value back to hDMG to subtract it from yCL
                                    xRF = totalRounds;
                                    break;
                                }

                            }

                        }

                    }

                } else {

                    log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                    + "their " + xW[xCW]['name'] + " missing "
                                    + y['name']);
                }

            }

            xWS[xCW]['ammoleft'] -= xRF;
            if (xWS[xCW]['ammoleft'] == 0) {
                xWS[xCW]['clipsleft'] -= 1;
                if (xWS[xCW]['clipsleft'] == 0 || x_set[xCW]['reload'] != true) {
                    x_set[xCW]['setting'] = 0;
                }
            }

        } else if (xCW == "secondary") {

            if (xDMG > yCL) {
                xDMG = yCL;
            }

            let xRF = roundsFired(xW[xCW],xWS[xCW])

            if (xHOM == 1) {

                log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                + "their " + xW[xCW]['name'] + " hitting "
                                + y['name'] + " in the " + xBP[0] + " for "
                                + xDMG);

                if (xW[xCW]['bonus']['name'] == "Burn") {

                    let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                    if (x_proc == 1) {
                        // does it override?
                        if (xDOT[0][0] > 0) {
                            if (xDMG >= xDOT[0][0] * 0.15 / 5 * (6 - xDOT[0][1])) {
                                xDOT[0] = [xDMG,0]
                                log.push(y['name'] + " is set alight");
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            xDOT[0] = [xDMG,0]
                            log.push(y['name'] + " is set alight");
                        }
                    }
                } else if (xW[xCW]['bonus']['name'] == "Poison") {

                    let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                    if (x_proc == 1) {
                        // does it override?
                        if (xDOT[1][0] > 0) {
                            if (xDMG >= xDOT[1][0] * 0.45 / 15 * (16 - xDOT[1][1])) {
                                xDOT[1] = [xDMG,0]
                                log.push(y['name'] + " is poisoned");
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            xDOT[1] = [xDMG,0]
                            log.push(y['name'] + " is poisoned");
                        }
                    }
                }

            } else {

                log.push(x['name'] + " fired " + xRF + " " + xW[xCW]['ammo'] + " rounds of "
                                + "their " + xW[xCW]['name'] + " missing "
                                + y['name']);
            }

            xWS[xCW]['ammoleft'] -= xRF;
            if (xWS[xCW]['ammoleft'] == 0) {
                xWS[xCW]['clipsleft'] -= 1;
                if (xWS[xCW]['clipsleft'] == 0 || x_set[xCW]['reload'] != true) {
                    x_set[xCW]['setting'] = 0;
                }
            }

        } else if (xCW == "melee") {

            if (xDMG > yCL) {
                xDMG = yCL;
            }

            if (xW[xCW]['bonus']['name'] == "Storage" && xWS[xCW]['storageused'] == false) {

                if (x_set['temporary']['setting'] == 0 && xWS['temporary']['initialsetting'] != 0) {

                    log.push(x['name'] + " withdrew a " + xW['temporary']['name'] + " from their " + xW[xCW]['name']);
                    x_set['temporary']['setting'] = xWS['temporary']['initialsetting'];
                    xWS[xCW]['storageused'] = true;

                }

            } else {

                if (xHOM == 1) {

                    log.push(x['name'] + " hit " + y['name']
                                    + " with their " + xW[xCW]['name'] + " in the "
                                    + xBP[0] + " for " + xDMG);

                    if (xW[xCW]['bonus']['name'] == "Toxin") {

                        let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                        if (x_proc == 1) {

                            // check which effects are left. 3 of each maximum applied.
                            let eL = []
                            for (let i=2;i<6;i++) {
                                if (xSE[0][i] < 3) {
                                    eL.push(i)
                                }
                            }

                            // status effect index
                            let eI = eL[Math.floor(Math.random() * eL.length)]
                            xSE[0][eI] += 1;
                            ySE[1][eI] += 1;

                            if (eI == 2) {
                                // effect = wither
                                log.push(y['name'] + " is withered");

                            } else if (eI == 3) {
                                // effect = slow
                                log.push(y['name'] + " is slowed \n");

                            } else if (eI == 4) {
                                // effect = weaken
                                log.push(y['name'] + " is weakened");

                            } else if (eI == 5) {
                                // effect = cripple
                                log.push(y['name'] + " is crippled");

                            }
                        }
                    } else if (xW[xCW]['bonus']['name'] == "Lacerate") {

                        let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                        if (x_proc == 1) {
                            // does it override?
                            if (xDOT[2][0] > 0) {
                                if (xDMG >= xDOT[2][0] * 0.90 / 9 * (10 - xDOT[2][1])) {
                                    xDOT[2] = [xDMG,0]
                                    log.push(y['name'] + " is lacerated");
                                } else {
                                    // do nothing, does not override
                                }
                            } else {
                                xDOT[2] = [xDMG,0]
                                log.push(y['name'] + " is lacerated");
                            }
                        }
                    }


                } else {
                    log.push(x['name'] + " missed " + y['name']
                                    + " with their " + xW[xCW]['name']);
                }

            }

        } else if (xCW == "temporary") {

            let length = x_temps.length;

            if (xW[xCW]['name'] == "Epinephrine") {

                log.push(x['name'] + " injected " + xW[xCW]['name']);

                let test = 0
                for (let i=0;i<length;i++) {
                    if (x_temps[i][0] == "epi") {
                        // reset "timer"
                        x_temps[i][1] = 25;
                        test = 1

                    } else {
                        continue;
                    }
                }

                if (test == 0) {
                    x_temps.unshift(["epi",25])
                }

            } else if (xW[xCW]['name'] == "Melatonin") {

                log.push(x['name'] + " injected " + xW[xCW]['name']);

                let test = 0
                for (let i=0;i<length;i++) {
                    if (x_temps[i][0] == "mela") {
                        // reset "timer"
                        x_temps[i][1] = 25;
                        test = 1

                    } else {
                        continue;
                    }
                }

                if (test == 0) {
                    x_temps.unshift(["mela",25])
                }

            } else if (xW[xCW]['name'] == "Serotonin") {

                let life = parseInt(xML * 0.25)
                if (xCL + life > xML) {
                    life = xML - xCL
                }

                xCL += life;

                log.push(x['name'] + " injected " + xW[xCW]['name'] + " and gained " + life + " life");

                let test = 0
                for (let i=0;i<length;i++) {
                    if (x_temps[i][0] == "sero") {
                        // reset "timer"
                        x_temps[i][1] = 25;
                        test = 1

                    } else {
                        continue;
                    }
                }

                if (test == 0) {
                    x_temps.unshift(["sero",25])
                }

            } else if (xW[xCW]['name'] == "Tyrosine") {

                log.push(x['name'] + " injected " + xW[xCW]['name']);

                let test = 0
                for (let i=0;i<length;i++) {
                    if (x_temps[i][0] == "tyro") {
                        // reset "timer"
                        x_temps[i][1] = 25;
                        test = 1

                    } else {
                        continue;
                    }
                }

                if (test == 0) {
                    x_temps.unshift(["tyro",25])
                }

            } else if (xW[xCW]['name'] == "Concussion Grenade") {

                if (t["Concussion Grenade"].includes(yA['head']['type'])) {
                    log.push(x['name'] + " used a " + xW[xCW]['name'] + " but it was blocked!");
                } else {
                    log.push(x['name'] + " used a " + xW[xCW]['name']);
                    y_temps.push(["conc",25])
                }

            } else if (xW[xCW]['name'] == "Smoke Grenade") {

                if (t["Smoke Grenade"].includes(yA['head']['type'])) {
                    log.push(x['name'] + " used a " + xW[xCW]['name'] + " but it was blocked!");
                } else {
                    log.push(x['name'] + " used a " + xW[xCW]['name']);
                    y_temps.push(["smoke",25])
                }

            } else if (xW[xCW]['name'] == "Tear Gas") {

                if (t["Tear Gas"].includes(yA['head']['type'])) {
                    log.push(x['name'] + " used a " + xW[xCW]['name'] + " but it was blocked!");
                } else {
                    log.push(x['name'] + " used a " + xW[xCW]['name']);
                    y_temps.push(["tear",25])
                }

            } else if (xW[xCW]['name'] == "Flash Grenade") {

                if (t["Flash Grenade"].includes(yA['head']['type'])) {
                    log.push(x['name'] + " used a " + xW[xCW]['name'] + " but it was blocked!");
                } else {
                    log.push(x['name'] + " used a " + xW[xCW]['name']);
                    rng = Math.floor(Math.random() * 5 + 15)
                    y_temps.push(["flash",rng])
                }

            } else if (xW[xCW]['name'] == "Pepper Spray") {

                if (t["Pepper Spray"].includes(yA['head']['type'])) {
                    log.push(x['name'] + " used a " + xW[xCW]['name'] + " but it was blocked!");
                } else {
                    log.push(x['name'] + " used a " + xW[xCW]['name']);
                    rng = Math.floor(Math.random() * 5 + 15)
                    y_temps.push(["pepper",rng])
                }

            } else if (xW[xCW]['name'] == "Sand") {

                if (t["Sand"].includes(yA['head']['type'])) {
                    log.push(x['name'] + " used a " + xW[xCW]['name'] + " but it was blocked!");
                } else {
                    log.push(x['name'] + " used a " + xW[xCW]['name']);
                    rng = Math.floor(Math.random() * 5 + 15)
                    y_temps.push(["sand",rng])
                }

            } else {

                if (xHOM == 1) {

                    // TO BE DONE: LIMIT SOME ITEMS TO JUST CHEST
                    log.push(x['name'] + " threw a " + xW[xCW]['name'] + " hitting "
                                    + y['name'] + " in the " + xBP[0] + " for "
                                    + xDMG);

                } else {

                    log.push(x['name'] + " threw a " + xW[xCW]['name'] + " missing " + y['name']);

                }

            }

            // stop trying to use temp after one is used. will have to come back to this with storage
            x_set[xCW]['setting'] = 0;

            // to be used at some point

            if (xW[xCW]['bonus']['name'] == "Severe Burn") {

                let x_proc = procBonus(xW[xCW]['bonus']['proc'])
                if (x_proc == 1) {
                    // does it override?
                    if (xDOT[3][0] > 0) {
                        if (xDMG >= xDOT[3][0] * 0.15 / 5 * (6 - xDOT[3][1])) {
                            xDOT[3] = [xDMG,0]
                            log.push(y['name'] + " is set ablaze");
                        } else {
                            // do nothing, does not override
                        }
                    } else {
                        xDOT[3] = [xDMG,0]
                        log.push(y['name'] + " is set ablaze");
                    }
                }
            }


        }

        yCL -= xDMG;

        if (yCL == 0) {
            return [log, xCL, yCL, xWS, yWS, xSE, ySE, xDOT, yDOT, x_set, y_set, x_temps, y_temps];
        }

        if (y['perks']['company']['name'] == "Gas Station" && y['perks']['company']['star'] >= 5) {
            rng = Math.floor(Math.random() * 10 + 1)
            if (rng == 1) {
                life = parseInt(0.2 * yML)
                if (yCL + life > yML) {
                    life = yML - yCL
                }
                yCL += life
                log.push(y['name'] + " cauterized their wound and recovered " + life + " life");
            }
        }

        for (let dot in xDOT) {

            if (yCL > 1 && xDOT[dot][0] > 0 && xDOT[dot][1] > 0) {

                let dotDMG
                if (dot == 0) {
                    // Burn
                    dotDMG = parseInt(xDOT[dot][0] * (0.15 / 5 * (6 - xDOT[dot][1])))
                    if (y['perks']['company']['name'] == "Gas Station" && y['perks']['company']['star'] >= 7) {
                        dotDMG = parseInt(dotDMG / 1.5)
                    }
                    if (x['perks']['company']['name'] == "Gas Station" && x['perks']['company']['star'] == 10) {
                        dotDMG = parseInt(dotDMG * 1.5)
                    }
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Burning damaged " +  y['name'] + " for " + dotDMG);

                    if (xDOT[dot][1] == 5) {
                        xDOT[dot] = [0,0]
                    }
                } else if (dot == 1) {
                    // Poison
                    dotDMG = parseInt(xDOT[dot][0] * (0.45 / 15 * (16 - xDOT[dot][1])))
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Poison damaged " +  y['name'] + " for " + dotDMG);

                    if (xDOT[dot][1] == 15) {
                        xDOT[dot] = [0,0]
                    }
                } else if (dot == 2) {
                    // Lacerate
                    dotDMG = parseInt(xDOT[dot][0] * (0.90 / 9 * (10 - xDOT[dot][1])))
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Laceration damaged " +  y['name'] + " for " + dotDMG);;

                    if (xDOT[dot][1] == 9) {
                        xDOT[dot] = [0,0]
                    }
                } else if (dot == 3) {
                    // Severe Burn
                    dotDMG = parseInt(xDOT[dot][0] * (0.15 / 5 * (10 - xDOT[dot][1])))
                    if (dotDMG > yCL - 1) {
                        dotDMG = yCL - 1;
                    }
                    log.push("Severe burning damaged " +  y['name'] + " for " + dotDMG);;

                    if (xDOT[dot][1] == 9) {
                        xDOT[dot] = [0,0]
                    }
                }

                yCL -= dotDMG;

            }

            xDOT[dot][1] += 1;

        }

    }

    return [log, xCL, yCL, xWS, yWS, xSE, ySE, xDOT, yDOT, x_set, y_set, x_temps, y_temps];

}


// ---- choose weapons ---------------------------
function chooseWeapon(p,weaponSettings) {

    if (p['position'] == "attack") {

        //weaponSettings = weaponSettings['attacksettings']

        let weaponChoice
        let settingInteger = 5;
        for (let weapon in weaponSettings) {
            if (weaponSettings[weapon]['setting'] != 0) {
                if (weaponSettings[weapon]['setting'] < settingInteger) {
                    settingInteger = weaponSettings[weapon]['setting'];
                    weaponChoice = weapon;
                }
            }
        }

        return weaponChoice;

    } else if (p['position'] == "defend") {

        //weaponSettings = weaponSettings['defendsettings']

        let weaponChoice;
        let weaponArray = [];
        let settingSum = 0;
        for (let weapon in weaponSettings) {

            if (isNaN(parseInt(weaponSettings[weapon]['setting']))) {
                // console.log(weapon)
            } else {
                settingSum += weaponSettings[weapon]['setting'];
                if (weaponSettings[weapon]['setting'] != 0) {
                    weaponArray.push(weapon);
                }

            }
        }

        let rng = Math.ceil(Math.random() * settingSum + 1)
        if (rng >= 1 && rng <= 1 + weaponSettings['primary']['setting']) {
            weaponChoice = "primary";
        } else if (rng > 1 + weaponSettings['primary']['setting'] && rng <= 1 + weaponSettings['primary']['setting'] + weaponSettings['secondary']['setting']) {
            weaponChoice = "secondary";
        } else if (rng > 1 + weaponSettings['primary']['setting'] + weaponSettings['secondary']['setting'] && rng <= 1 + weaponSettings['primary']['setting'] + weaponSettings['secondary']['setting'] + weaponSettings['melee']['setting']) {
            weaponChoice = "melee";
        } else {
            weaponChoice = "temporary";
        }

        return weaponChoice;
    }

}


// -----------------------------------------------
function maxDamage(strength) {

    return 7 * (Math.log10(strength/10))**2 + 27 * Math.log10(strength/10) + 30

    // calculate and return maximum damage based on effective strength

}

function damageMitigation(defense, strength) {

    let ratio = defense / strength
    let mitigation;
    if (ratio >= 14) {
        mitigation = 100
    } else if (ratio >= 1 && ratio < 14) {
        mitigation = 50 + MATH_LOG_14_UNDER_50 * Math.log(ratio)
    } else if (ratio > 1/32 && ratio < 1) {
        mitigation = 50 + MATH_LOG_32_UNDER_50 * Math.log(ratio)
    } else {
        mitigation = 0
    }

    return mitigation;
    // calculate and return damage mitigation percentage

}

function weaponDamageMulti(displayDamage, perks) {

    let baseDamage = ((Math.exp((displayDamage+0.005)/19 + 2) - 13) + (Math.exp((displayDamage-0.005)/19 + 2) - 13))/2
    baseDamage = baseDamage * (1 + perks/100)

    let damageMulti = 1 + Math.log((Math.round(baseDamage,0)))

    return damageMulti;

}

function hitChance(speed, dexterity) {

    let ratio = speed / dexterity
    let hitChance;

    if (ratio >= 64) {
        hitChance = 100
    } else if (ratio >= 1 && ratio < 64) {
        hitChance = 100 - 50 / 7 * (8 * Math.sqrt(1/ratio) - 1)
    } else if (ratio > 1/64 && ratio < 1) {
        hitChance = 50 / 7 * (8 * Math.sqrt(ratio) - 1)
    } else {
        hitChance = 0
    }

    return hitChance;

}

function applyAccuracy(hitChance, displayAccuracy, perks) {

    let accuracy = displayAccuracy + perks
    if (accuracy < 0) {
        accuracy = 0;
    }

    if (hitChance > 50) {
        hitChance = hitChance + ((accuracy-50)/50)*(100-hitChance)
    } else {
        hitChance = hitChance + ((accuracy-50)/50)*hitChance
    }

    return hitChance

}

function hitOrMiss(hitChance) {

    let rng = Math.floor(Math.random() * 10000 + 1)
    let hit;
    if (rng >= 1 && rng <= 1 + hitChance * 100) {
        hit = 1;
    } else {
        hit = 0;
    }

    return hit;

}

function selectBodyPart(x,critChance) {

  let bodyPart = "";
  let rng = Math.floor(Math.random() * 1000 + 1)
  if (rng >= 1 && rng <= 1 + critChance * 10) {
      // successful crit
      let rng2 = Math.floor(Math.random() * 100 + 1)
      if (rng2 >= 1 && rng2 <= 11) {
          bodyPart = ["heart",1];
      } else if (rng2 > 11 && rng2 <= 21) {
          bodyPart = ["throat",1];
          if (x['perks']['education']['neckdamage'] == true) {
              bodyPart[1] *= 1.1
          }
      } else if (rng2 > 21 && rng2 <= 101) {
          bodyPart = ["head",1];
      }
  } else {
      // non-crit
      let rng2 = Math.floor(Math.random() * 100 + 1)
      if (rng2 >= 1 && rng2 <= 6) {
          bodyPart = ["groin",1/1.75];
      } else if (rng2 > 6 && rng2 <= 11) {
          bodyPart = ["left arm",1/3.5];
      } else if (rng2 > 11 && rng2 <= 16) {
          bodyPart = ["right arm",1/3.5];
      } else if (rng2 > 16 && rng2 <= 21) {
          bodyPart = ["left hand",1/5];
      } else if (rng2 > 21 && rng2 <= 26) {
          bodyPart = ["right hand",1/5];
      } else if (rng2 > 26 && rng2 <= 31) {
          bodyPart = ["left foot",1/5];
      } else if (rng2 > 31 && rng2 <= 36) {
          bodyPart = ["right foot",1/5];
      } else if (rng2 > 36 && rng2 <= 46) {
          bodyPart = ["left leg",1/3.5];
      } else if (rng2 > 46 && rng2 <= 56) {
          bodyPart = ["right leg",1/3.5];
      } else if (rng2 > 56 && rng2 <= 76) {
          bodyPart = ["stomach",1/1.75];
      } else if (rng2 > 76 && rng2 <= 101) {
          bodyPart = ["chest",1/1.75];
      }
  }

  return bodyPart;

}

function armourMitigation(bodyPart,armour) {

    let mitigation = 0;
    let message = "";
    let coverage = [], dummy = []
    let total = 0;
    let count = 0;
    let rng = Math.floor(Math.random() * 10000 + 1)

    for (let slot in armour) {

        if (!a[bodyPart][armour[slot]['type']]) {
            // do nothing
        } else {
            coverage.push([armour[slot]['armour'],a[bodyPart][armour[slot]['type']]])
            total += a[bodyPart][armour[slot]['type']]
            count += 1;
        }

    }

    dummy = dummy.concat(coverage)

    let high = 0, second = 0, third = 0, low = 0;
    if (total >= 100) {

        if (count == 4) {

            for (i = 0;i < dummy.length;i++) {
                if (dummy[i][0] > coverage[high][0]) {
                    high = i;
                } else if (dummy[i][0] < coverage[low][0]) {
                    low = i;
                }
            }

            delete dummy[high], delete dummy[low];

            for (i = 0;i < dummy.length;i++) {

                if (dummy[i] == undefined) {
                    continue;
                } else if (dummy[i][0] > coverage[second][0]) {
                    second = i;
                } else if (dummy[i][0] < coverage[third][0]) {
                    third = i;
                }

            }

            if (coverage[high][1] >= 100) {
                mitigation = coverage[high][0];
            } else if (coverage[high][1] + coverage[second][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                }
            } else if (coverage[high][1] + coverage[second][1] + coverage[third][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                } else if (rng > (coverage[high][1] + coverage[second][1])*100 && rng <= (coverage[high][1] + coverage[second][1] + coverage[third][1])*100) {
                    mitigation = coverage[third][0];
                }
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                } else if (rng > (coverage[high][1] + coverage[second][1])*100 && rng <= (coverage[high][1] + coverage[second][1] + coverage[third][1])*100) {
                    mitigation = coverage[third][0];
                } else {
                    mitigation = coverage[low][0];
                }
            }


        } else if (count == 3) {

            for (i = 0;i < dummy.length;i++) {
                if (dummy[i][0] > coverage[high][0]) {
                    high = i;
                } else if (dummy[i][0] < coverage[low][0]) {
                    low = i;
                }
            }

            delete dummy[high], delete dummy[low];

            for (i = 0;i < dummy.length;i++) {

                if (dummy[i] == undefined) {
                    continue;
                } else if (dummy[i][0] > coverage[second][0]) {
                    second = i;
                }

            }

            if (coverage[high][1] >= 100) {
                mitigation = coverage[high][0];
            } else if (coverage[high][1] + coverage[second][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else {
                    mitigation = coverage[second][0];
                }
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                } else {
                    mitigation = coverage[low][0];
                }
            }

        } else if (count == 2) {

            for (i = 0;i < dummy.length;i++) {
                if (dummy[i][0] > coverage[high][0]) {
                    high = i;
                } else if (dummy[i][0] < coverage[low][0]) {
                    low = i;
                }
            }

            if (coverage[high][1] >= 100) {
                mitigation = coverage[high][0];
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else {
                    mitigation = coverage[low][0];
                }
            }


        } else if (count == 1) {

            mitigation = coverage[0][0];

        }

    } else {

        if (count == 4) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
            } else if (rng > (coverage[0][1] + coverage[1][1])*100 && rng <= (coverage[0][1] + coverage[1][1] + coverage[2][1])*100) {
                mitigation = coverage[2][0];
            } else if (rng > (coverage[0][1] + coverage[1][1] + coverage[2][1])*100 && (coverage[0][1] + coverage[1][1] + coverage[2][1] + coverage[3][1])*100) {
                mitigation = coverage[3][0];
            } else {
                mitigation = 0;
            }

        } else if (count == 3) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
            } else if (rng > (coverage[0][1] + coverage[1][1])*100 && rng <= (coverage[0][1] + coverage[1][1] + coverage[2][1])*100) {
                mitigation = coverage[2][0];
            } else {
                mitigation = 0;
            }

        } else if (count == 2) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
            } else {
                mitigation = 0;
            }

        } else if (count == 1) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else {
                mitigation = 0;
            }

        }

    }

    return mitigation;

}

function variance() {

    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    //num = num / 10.0 + 0.5; // Translate to 0 -> 1
    num = (20 * (num / 10.0 + 0.5) - 10 + 100)/100; // Translate to 0.95 -> 1.05?
    if (num > 1.05 || num < 0.95) return variance(); // resample
    return num;

}

function sRounding(x) {
    let a  = Math.floor(x)
    let b  = a + 1

    let rng = Math.round(Math.random() * 1000 * (b-a) + a) / 1000
    if (rng <= x){
        return a
    } else if (rng > x) {
        return b
    }

}

function roundsFired(weapon,weaponState) {

    let rof = weaponState['rof'];
    rof = [sRounding(rof[0]),sRounding(rof[1])]

    let rounds
    if (rof[1] - rof[0] == 0) {
        rounds = rof[0]
    } else {
        rounds = Math.round(Math.random() * (rof[1]-rof[0]) + rof[0])
    }

    if (rounds > weaponState['ammoleft']) {
        rounds = weaponState['ammoleft'];
    }

    return rounds;

}

function isJapanese(weapon) {

    let jw = ["Samurai Sword", "Yasukuni Sword", "Kodachi", "Sai", "Kodachi", "Katana", "Dual Samurai Sword"]

    if (jw.includes(weapon)) {
        return true
    } else {
        return false
    }
}

function procBonus(proc) {
    let rng = Math.floor(Math.random() * 100 + 1)

    if (rng > 1 && rng <= proc) {
        return 1;
    } else {
        return 0;
    }

}


// apply perks, mods before fight where possible
function applyPMbefore(p,p_mods) {

    let clipsizemulti = 1, clips = 3, rofmulti = 1;
    let p_comp = p['perks']['company'], p_edu = p['perks']['education'];

    for (let mod in p_mods) {
        if (p_mods[mod] != "n/a") {
          clipsizemulti += m[p_mods[mod]]['clip_size_multi'];
          clips += m[p_mods[mod]]['extra_clips'];
          rofmulti += m[p_mods[mod]]['rate_of_fire_multi'];
        }
    }

    if (p_comp['name'] == "Gun Shop" && p_comp['star'] >= 7) {
        clips += 1;
    }

    if (p_edu['ammocontrol1'] == true) {
        rofmulti -= 0.05;
    }
    if (p_edu['ammocontrol2'] == true) {
        rofmulti -= 0.2;
    }

    return [clipsizemulti,clips,rofmulti]

}

// apply perks, mods, temps
// return xy stats, xy weapon acc/dmg bonus(s)
// arguments: xy, xy weapon (+state, settings), xy temps, turn#
function applyPMT(x,y,xCW,yCW,xWS,yWS,x_set,y_set,x_temps,y_temps,xSE,ySE,turn) {

    let x_acc = 0, x_dmg = 0, x_crit = 12;
    let x_edu = x['perks']['education'], x_fac = x['perks']['faction'];
    let x_comp = x['perks']['company'], x_prop = x['perks']['property'];
    let x_merit = x['perks']['merits'], x_wep = x['weapons'][xCW];

    let y_acc = 0, y_dmg = 0, y_crit = 12;
    let y_edu = y['perks']['education'], y_fac = y['perks']['faction'];
    let y_comp = y['perks']['company'], y_prop = y['perks']['property'];
    let y_merit = y['perks']['merits'], y_wep = y['weapons'][yCW];

    x_acc += 0.02 * x_wep['experience'] + 0.2 * x_fac['accuracy'];
    x_dmg += 0.1 * x_wep['experience'] + x_fac['damage'];
    x_crit += 0.5 * x_merit['critrate'];
    if (x_comp['name'] == "Zoo" && x_comp['star'] == 10) {
        x_acc += 3;
    }
    if (x_edu['damage'] == true) {
        x_dmg += 1;
    }
    if (x_prop['damage'] == true) {
        x_dmg += 2;
    }
    if (x_edu['critchance'] == true) {
        x_crit += 3
    }

    y_acc += 0.02 * y_wep['experience'] + y_fac['accuracy'];
    y_dmg += 0.1 * y_wep['experience'] + y_fac['damage'];
    y_crit += 0.5 * y_merit['critrate'];
    if (y_comp['name'] == "Zoo" && y_comp['star'] == 10) {
        y_acc += 3;
    }
    if (y_edu['damage'] == true) {
        y_dmg += 1
    }
    if (y_prop['damage'] == true) {
        y_dmg += 2;
    }
    if (y_edu['critchance'] == true) {
        y_crit += 3
    }

    // -- weapon types --
    if (xCW == "primary" || xCW == "secondary") {

        if (x_comp['name'] == "Gun Shop" && x_comp['star'] == 10) {
            x_dmg += 10
        }

    } else if (xCW == "melee") {

        if (x_edu['meleedamage'] == true) {
            x_dmg += 2
        }

        if ((x_comp['name'] == "Pub"|| x_comp['name'] == "Restaurant") && x_comp['star'] >= 3) {
            x_dmg += 10
        } else if (x_comp['name'] == "Hair Salon" && x_wep['category'] == "Slashing" && x_comp['star'] == 10) {
            x_dmg += 20
        }

        if (isJapanese(x_wep['name'])) {
            if (x_edu['japanesedamage'] == true) {
                x_dmg += 10;
            }
        }

    } else if (xCW == "temporary") {

        x_acc += 0.2 * x_merit['temporarymastery'];
        x_dmg += x_merit['temporarymastery'];

        if (x_edu['temporaryaccuracy'] == true) {
            x_acc += 1;
        }

        if (x_edu['tempdamage'] == true) {
            x_dmg += 5;
        }

    } else if (xCW == "fists") {

        if (x_edu['fistdamage']) {
            x_dmg += 100
        }

        if (x_comp['name'] == "Furniture Store" && x_comp['star'] == 10) {
            x_dmg += 100
        }

    } else if (xCW == "kick") {

        if (x_comp['name'] == "Furniture Store" && x_comp['star'] == 10) {
            x_dmg += 100
        }

    }

    if (yCW == "primary" || yCW == "secondary") {

        if (y_comp['name'] == "Gun Shop" && y_comp['star'] == 10) {
            y_dmg += 10
        }

    } else if (yCW == "melee") {

        if (y_edu['meleedamage'] == true) {
            y_dmg += 2
        }

        if ((y_comp['name'] == "Pub"|| y_comp['name'] == "Restaurant") && y_comp['star'] >= 3) {
            y_dmg += 10
        } else if (y_comp['name'] == "Hair Salon" && y_wep['category'] == "Slashing") {
            y_dmg += 20
        }

        if (isJapanese(y_wep['name'])) {
            if (y_edu['japanesedamage'] == true) {
                y_dmg += 10;
            }
        }

    } else if (yCW == "temporary") {

        y_acc += 0.2 * y_merit['temporarymastery'];
        y_dmg += y_merit['temporarymastery'];

        if (y_edu['temporaryaccuracy'] == true) {
            y_acc += 1;
        }

        if (y_edu['tempdamage'] == true) {
            y_dmg += 5;
        }

    } else if (yCW == "fists") {

        if (y_edu['fistdamage']) {
            y_dmg += 100
        }

        if (y_comp['name'] == "Furniture Store" && y_comp['star'] == 100) {
            y_dmg += 100
        }

    } else if (yCW == "kick") {

        if (y_comp['name'] == "Furniture Store" && y_comp['star'] == 100) {
            y_dmg += 100
        }

    }

    // -- weapon category --
    if (x_wep['category'] == "Clubbing") {

        x_acc += 0.2 * x_merit['clubbingmastery'];
        x_dmg += x_merit['clubbingmastery'];

    } else if (x_wep['category'] == "Heavy Artillery") {

        x_acc += 0.2 * x_merit['heavyartillerymastery'];
        x_dmg += x_merit['heavyartillerymastery'];

        if (x_edu['heavyartilleryaccuracy'] == true) {
            x_acc += 1;
        }

    } else if (x_wep['category'] == "Machine Gun") {

        x_acc += 0.2 * x_merit['machinegunmastery'];
        x_dmg += x_merit['machinegunmastery'];

        if (x_edu['machinegunaccuracy'] == true) {
            x_acc += 1;
        }

    } else if (x_wep['category'] == "Mechanical") {

        x_acc += 0.2 * x_merit['mechanicalmastery'];
        x_dmg += x_merit['mechanicalmastery'];

    } else if (x_wep['category'] == "Piercing") {

        x_acc += 0.2 * x_merit['piercingmastery'];
        x_dmg += x_merit['piercingmastery'];

    } else if (x_wep['category'] == "Pistol") {

        x_acc += 0.2 * x_merit['pistolmastery'];
        x_dmg += x_merit['pistolmastery'];

        if (x_edu['pistolaccuracy'] == true) {
            x_acc += 1;
        }

    } else if (x_wep['category'] == "Rifle") {

        x_acc += 0.2 * x_merit['riflemastery'];
        x_dmg += x_merit['riflemastery'];

        if (x_edu['rifleaccuracy'] == true) {
            x_acc += 1;
        }

    } else if (x_wep['category'] == "Shotgun") {

        x_acc += 0.2 * x_merit['shotgunmastery'];
        x_dmg += x_merit['shotgunmastery'];

        if (x_edu['shotgunaccuracy'] == true) {
            x_acc += 1;
        }

    } else if (x_wep['category'] == "Slashing") {

        x_acc += 0.2 * x_merit['slashingmastery'];
        x_dmg += x_merit['slashingmastery'];

    } else if (x_wep['category'] == "SMG") {

        x_acc += 0.2 * x_merit['smgmastery'];
        x_dmg += x_merit['smgmastery'];

        if (x_edu['smgaccuracy'] == true) {
            x_acc += 1;
        }

    }

    if (y_wep['category'] == "Clubbing") {

        y_acc += 0.2 * y_merit['clubbingmastery'];
        y_dmg += y_merit['clubbingmastery'];

    } else if (y_wep['category'] == "Heavy Artillery") {

        y_acc += 0.2 * y_merit['heavyartillerymastery'];
        y_dmg += y_merit['heavyartillerymastery'];

        if (y_edu['heavyartilleryaccuracy'] == true) {
            y_acc += 1;
        }

    } else if (y_wep['category'] == "Machine Gun") {

        y_acc += 0.2 * y_merit['machinegunmastery'];
        y_dmg += y_merit['machinegunmastery'];

        if (y_edu['machinegunaccuracy'] == true) {
            y_acc += 1;
        }

    } else if (y_wep['category'] == "Mechanical") {

        y_acc += 0.2 * y_merit['mechanicalmastery'];
        y_dmg += y_merit['mechanicalmastery'];

    } else if (y_wep['category'] == "Piercing") {

        y_acc += 0.2 * y_merit['piercingmastery'];
        y_dmg += y_merit['piercingmastery'];

    } else if (y_wep['category'] == "Pistol") {

        y_acc += 0.2 * y_merit['pistolmastery'];
        y_dmg += y_merit['pistolmastery'];

        if (y_edu['pistolaccuracy'] == true) {
            y_acc += 1;
        }

    } else if (y_wep['category'] == "Rifle") {

        y_acc += 0.2 * y_merit['riflemastery'];
        y_dmg += y_merit['riflemastery'];

        if (y_edu['rifleaccuracy'] == true) {
            y_acc += 1;
        }

    } else if (y_wep['category'] == "Shotgun") {

        y_acc += 0.2 * y_merit['shotgunmastery'];
        y_dmg += y_merit['shotgunmastery'];

        if (y_edu['shotgunaccuracy'] == true) {
            y_acc += 1;
        }

    } else if (y_wep['category'] == "Slashing") {

        y_acc += 0.2 * y_merit['slashingmastery'];
        y_dmg += y_merit['slashingmastery'];

    } else if (y_wep['category'] == "SMG") {

        y_acc += 0.2 * y_merit['smgmastery'];
        y_dmg += y_merit['smgmastery'];

        if (y_edu['smgaccuracy'] == true) {
            y_acc += 1;
        }

    }

    // -- weapon name --
    if (x_comp['name'] == "Firework Stand" && x_comp['star'] >= 5 && x_wep['name'] == "Flamethrower") {
        x_acc += 10;
        x_dmg += 25;
    }
    if (y_comp['name'] == "Firework Stand" && y_comp['star'] >= 5 && y_wep['name'] == "Flamethrower") {
        y_acc += 10;
        y_dmg += 25;
    }

    // -- mods --
    let x_passives = Object.assign({},x['passives']);
    let y_passives = Object.assign({},y['passives']);

    if (xWS[xCW]['ammoleft'] == 0 && x_set[xCW]['reload'] == true) {

        // do nothing

    } else {

        if (xCW == "primary" || xCW == "secondary") {

            for (let mod in x_wep['mods']) {
                if (x_wep['mods'][mod] != "n/a") {
                  x_acc += m[x_wep['mods'][mod]]['acc_bonus'];
                  y_acc += m[x_wep['mods'][mod]]['enemy_acc_bonus'];
                  x_crit += m[x_wep['mods'][mod]]['crit_chance'];
                  x_dmg += m[x_wep['mods'][mod]]['dmg_bonus'];
                  x_passives['dexterity'] += m[x_wep['mods'][mod]]['dex_passive'];
                  if (m[x_wep['mods'][mod]]['turn[1]'] && turn == 1) {
                      x_acc += m[x_wep['mods'][mod]]['turn[1]']['acc_bonus']
                  }
                }
            }

        }

    }

    if (yWS[yCW]['ammoleft'] == 0 && y_set[yCW]['reload'] == true) {

        // do nothing

    } else {

        if (yCW == "primary" || yCW == "secondary") {

            for (let mod in y_wep['mods']) {
                if (y_wep['mods'][mod] != "n/a") {
                  y_acc += m[y_wep['mods'][mod]]['acc_bonus'];
                  x_acc += m[y_wep['mods'][mod]]['enemy_acc_bonus'];
                  y_crit += m[y_wep['mods'][mod]]['crit_chance'];
                  y_dmg += m[y_wep['mods'][mod]]['dmg_bonus'];
                  y_passives['dexterity'] += m[y_wep['mods'][mod]]['dex_passive'];
                  if (m[y_wep['mods'][mod]]['turn[1]'] && turn == 1) {
                      y_acc += m[y_wep['mods'][mod]]['turn[1]']['acc_bonus']
                  }
                }
            }

        }

    }

    // -- temps and final stats --
    x_stats = Object.assign({},x['battlestats'])
    y_stats = Object.assign({},y['battlestats'])

    for (let i=0;i<x_temps.length;i++) {

        if (x_temps[i][0] == "epi") {

            x_passives['strength'] += 500
            if (x_edu['needleeffect'] == true) {
                x_passives['strength'] += 50
            }

        } else if (x_temps[i][0] == "mela") {

            x_passives['speed'] += 500
            if (x_edu['needleeffect'] == true) {
                x_passives['speed'] += 50
            }

        } else if (x_temps[i][0] == "sero") {

            x_passives['defense'] += 300
            if (x_edu['needleeffect'] == true) {
                x_passives['defense'] += 30
            }

        } else if (x_temps[i][0] == "tyro") {

            x_passives['dexterity'] += 500
            if (x_edu['needleeffect'] == true) {
                x_passives['dexterity'] += 50
            }

        }

    }

    for (let i=0;i<y_temps.length;i++) {

        if (y_temps[i][0] == "epi") {

            y_passives['strength'] += 500
            if (y_edu['needleeffect'] == true) {
                y_passives['strength'] += 50
            }

        } else if (y_temps[i][0] == "mela") {

            y_passives['speed'] += 500
            if (y_edu['needleeffect'] == true) {
                y_passives['speed'] += 50
            }

        } else if (y_temps[i][0] == "sero") {

            y_passives['defense'] += 300
            if (y_edu['needleeffect'] == true) {
                y_passives['defense'] += 30
            }

        } else if (y_temps[i][0] == "tyro") {

            y_passives['dexterity'] += 500
            if (y_edu['needleeffect'] == true) {
                y_passives['dexterity'] += 50
            }

        }

    }

    // For player x
    if (x_comp['name'] == "Adult Novelties" && x_comp['star'] >= 7) {
        y_passives['speed'] -= 25
    }
    // And for player y
    if (y_comp['name'] == "Adult Novelties" && y_comp['star'] >= 7) {
        x_passives['speed'] -= 25
    }

    x_passives['strength'] -= (10 * xSE[1][0] + 25 * xSE[1][2])
    x_passives['speed'] -= (10 * xSE[1][0] + 50 * xSE[1][1] + 25 * xSE[1][3])
    x_passives['defense'] -= (10 * xSE[1][0] + 25 * xSE[1][4])
    x_passives['dexterity'] -= (10 * xSE[1][0] + 50 * xSE[1][1] + 25 * xSE[1][5])

    y_passives['strength'] -= (10 * ySE[1][0] + 25 * ySE[1][2])
    y_passives['speed'] -= (10 * ySE[1][0] + 50 * ySE[1][1] + 25 * ySE[1][3])
    y_passives['defense'] -= (10 * ySE[1][0] + 25 * ySE[1][4])
    y_passives['dexterity'] -= (10 * ySE[1][0] + 50 * ySE[1][1] + 25 * ySE[1][5])

    let xSTR = x_stats['strength'] * (1 + x_passives['strength']/100)
    let xSPD = x_stats['speed'] * (1 + x_passives['speed']/100)
    let xDEF = x_stats['defense'] * (1 + x_passives['defense']/100)
    let xDEX = x_stats['dexterity'] * (1 + x_passives['dexterity']/100)

    let ySTR = y_stats['strength'] * (1 + y_passives['strength']/100)
    let ySPD = y_stats['speed'] * (1 + y_passives['speed']/100)
    let yDEF = y_stats['defense'] * (1 + y_passives['defense']/100)
    let yDEX = y_stats['dexterity'] * (1 + y_passives['dexterity']/100)

    // speed multi, dexterity multi
    let sM=1, dM=1;
    let flash=0,sand=0,smoke=0,conc=0,pepper=0,tear=0;

    for (let i=0;i<x_temps.length;i++) {
        if (x_temps[i][0] == "flash") {
            flash += 1;
            if (flash == 1) {
                sM = 1/5
            } else if (flash == 2) {
                sM = 1/5 * 3/5
            }
        } else if (x_temps[i][0] == "sand") {
            sand += 1;
            if (sand == 1) {
                sM = 1/5
            } else if (sand == 2) {
                sM = 1/5 * 3/5
            }
        } else if (x_temps[i][0] == "smoke") {
            smoke += 1;
            if (smoke == 1) {
                sM = 1/3
            } else if (smoke == 2) {
                sM = 1/3 * 2/3
            }
        } else if (x_temps[i][0] == "conc") {
            conc += 1;
            if (conc == 1) {
                dM = 1/5
            } else if (conc == 2) {
                dM = 1/5 * 3/5
            }
        } else if (x_temps[i][0] == "pepper") {
            pepper += 1;
            if (pepper == 1) {
                dM = 1/5
            } else if (pepper == 2) {
                dM = 1/5 * 3/5
            }
        } else if (x_temps[i][0] == "tear") {
            tear += 1;
            if (tear == 1) {
                dM = 1/3
            } else if (tear == 2) {
                dM = 1/3 * 2/3
            }
        }
    }

    xSPD *= sM
    xDEX *= dM

    sM=1, dM=1;
    flash=0,sand=0,smoke=0,conc=0,pepper=0,tear=0;

    for (let i=0;i<y_temps.length;i++) {
        if (y_temps[i][0] == "flash") {
            flash += 1;
            if (flash == 1) {
                sM = 1/5
            } else if (flash == 2) {
                sM = 1/5 * 3/5
            }
        } else if (y_temps[i][0] == "sand") {
            sand += 1;
            if (sand == 1) {
                sM = 1/5
            } else if (sand == 2) {
                sM = 1/5 * 3/5
            }
        } else if (y_temps[i][0] == "smoke") {
            smoke += 1;
            if (smoke == 1) {
                sM = 1/3
            } else if (smoke == 2) {
                sM = 1/3 * 2/3
            }
        } else if (y_temps[i][0] == "conc") {
            conc += 1;
            if (conc == 1) {
                dM = 1/5
            } else if (conc == 2) {
                dM = 1/5 * 3/5
            }
        } else if (y_temps[i][0] == "pepper") {
            pepper += 1;
            if (pepper == 1) {
                dM = 1/5
            } else if (pepper == 2) {
                dM = 1/5 * 3/5
            }
        } else if (y_temps[i][0] == "tear") {
            tear += 1;
            if (tear == 1) {
                dM = 1/3
            } else if (tear == 2) {
                dM = 1/3 * 2/3
            }
        }
    }

    ySPD *= sM
    yDEX *= dM

    return [[xSTR,xSPD,xDEF,xDEX],[ySTR,ySPD,yDEF,yDEX],[x_acc,x_dmg,x_crit],[y_acc,y_dmg,y_crit]]
}

function clone(obj) {
    if (obj === null || typeof (obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

    if (obj instanceof Date)
        var temp = new obj.constructor(); //or new Date(obj);
    else
        var temp = obj.constructor();

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj['isActiveClone'] = null;
            temp[key] = clone(obj[key]);
            delete obj['isActiveClone'];
        }
    }
}
