// ==UserScript==
// @name         Torn Battle Stat Builds
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Display current stats and target percentages based on build selection in Torn, with custom builds, storage, and conditional highlighting.
// @author       kernel_panic [3572165]
// @match        https://www.torn.com/gym.php
// @icon         https://www.torn.com/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==
 
GM_addStyle(`
  .torn-stats-container {
    background: #333;
    color: #f0f0f0;
    padding: 20px 10px;
    margin: 10px auto;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 800px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }
  .torn-stats-container span {
    font-weight: bold;
  }
  .build-dropdown {
    margin-bottom: 10px;
  }
  .stat-row {
    padding: 5px 0;
    color: #94d82d;
  }
  .stat-row.low {
    color: #cc7032;
  }
  .stat-row.high {
    color: #cccc32;
  }
  .stat-message {
    font-size: 12px;
    color: #ddd;
    margin-top: 5px;
  }
  .add-build-form {
    display: none;
    margin: 10px 0;
  }
  .add-build-form input {
    width: 100%;
    padding: 8px 12px;
    margin: 5px 0;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    border-color: #555;
    background-color: #111;
    color: #f0f0f0;
    box-sizing: border-box;
  }
  .add-build-form input:focus {
      outline: none;
      border-color: #fff;
      box-shadow: 0 0 3px #fff;
  }
 
  .add-build-form.visible {
    display: block;
  }
  .form-row {
    margin: 5px 0;
  }
  .add-build-button,
  .form-button {
    background: linear-gradient(to bottom, #000000 0%, #111111 5%, #333333 25%, #444444 50%, #333333 75%, #111111 95%, #000000 100%);
    color: #fff;
    padding: 10px 20px;
    font-size: 10px;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    border: 1px solid #000;
    border-radius: 5px;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    display: inline-block;
    text-align: center;
    min-width: 120px;
    transition: all 0.2s ease-in-out;
    margin: 10px 0 0 0;
  }
  .add-build-button:hover,
  .form-button:hover {
    background: linear-gradient(to bottom, #444444 0%, #333333 25%, #222222 50%, #333333 75%, #444444 100%);
    border-color: #111;
    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.7);
  }
  .add-build-btn:active,
  .form-button:active {
    background: linear-gradient(to bottom, #333333 0%, #111111 100%);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
    transform: translateY(1px);
  }
  .add-build-btn:disabled,
  .form-button:disabled {
    background: linear-gradient(to bottom, #888888 0%, #666666 100%);
    color: #ccc;
    cursor: not-allowed;
    box-shadow: none;
  }
 
  #buildSelector {
      width: 100%;
      padding: 8px 0;
      margin: 5px 0;
      font-size: 14px;
      text-align: center;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #111;
      color: #f0f0f0;
      box-sizing: border-box;
      appearance: none;
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px;
      cursor: pointer;
      overflow: hidden;
      z-index: 11;
      position: relative;
  }
 
  #buildSelector option {
      background-color: #222;
      color: #f0f0f0;
      text-align: center;
      overflow-x: hidden;
      width: 100%;
  }
  select {
      max-height: 200px;
      overflow-y: auto;
  }
 
  #buildSelector option:hover {
      background-color: #a5d8ff;
      color: white;
  }
 
  #buildSelector:focus {
      outline: none;
      border-color: #a5d8ff;
      box-shadow: 0 0 3px #a5d8ff;
      max-height: 250px;
      overflow-y: auto;
  }
 
  .torn-stats-container .build-dropdown {
      position: relative;
      z-index: 10;
      width: 100%;
  }
 
  body {
      overflow-x: hidden;
  }
`);
 
(function () {
  "use strict";
 
  const tolerance = 0.1;
  const localStorageKey = "tornCustomBuilds";
  const selectedBuildKey = "selectedBuild";
 
  const defaultBuilds = {
    Balanced: { strength: 25.0, defense: 25.0, speed: 25.0, dexterity: 25.0 },
    "Hank's Ratio (High Defense/Low Dexterity)": {
      strength: 27.78,
      defense: 34.72,
      speed: 27.78,
      dexterity: 9.72,
    },
    "Hank's Ratio (High Defense/Low Dexterity)": {
      strength: 27.78,
      defense: 34.72,
      speed: 27.78,
      dexterity: 9.72,
    },
    "Hank's Ratio (Low Defense/High Dexterity)": {
      strength: 27.78,
      defense: 9.72,
      speed: 27.78,
      dexterity: 34.72,
    },
    "Baldr's Ratio (Strength/Speed)": {
      strength: 30.86,
      defense: 22.22,
      speed: 24.68,
      dexterity: 22.22,
    },
    "Baldr's Ratio (Speed/Strength)": {
      strength: 24.68,
      defense: 22.22,
      speed: 30.86,
      dexterity: 22.22,
    },
    "Baldr's Ratio (Defense/Dexterity)": {
      strength: 22.22,
      defense: 30.86,
      speed: 22.22,
      dexterity: 24.68,
    },
    "Baldr's Ratio (Dexterity/Defense)": {
      strength: 22.22,
      defense: 24.68,
      speed: 22.22,
      dexterity: 30.86,
    },
  };
 
  function observeGymStats() {
    const gymRoot = document.getElementById("gymroot");
    if (!gymRoot) {
      console.error("Gym root element not found.");
      return;
    }
 
    const observer = new MutationObserver(() => {
      const listItems = gymRoot.querySelectorAll("ul li");
      if (listItems.length === 4) {
        const stats = calculateStats(listItems);
        displayStats(stats);
      }
    });
 
    observer.observe(gymRoot, { childList: true, subtree: true });
  }
 
  function calculateStats(listItems) {
    const strength = extractStatValue(listItems[0].textContent, "Strength");
    const defense = extractStatValue(listItems[1].textContent, "Defense");
    const speed = extractStatValue(listItems[2].textContent, "Speed");
    const dexterity = extractStatValue(listItems[3].textContent, "Dexterity");
 
    const total = strength + defense + speed + dexterity;
    return {
      strength: formatNumber(strength),
      defense: formatNumber(defense),
      speed: formatNumber(speed),
      dexterity: formatNumber(dexterity),
      strengthPercentage: ((strength / total) * 100).toFixed(2),
      defensePercentage: ((defense / total) * 100).toFixed(2),
      speedPercentage: ((speed / total) * 100).toFixed(2),
      dexterityPercentage: ((dexterity / total) * 100).toFixed(2),
      total: formatNumber(total),
    };
  }
 
  function extractStatValue(text, statName) {
    const regex = new RegExp(`${statName}\\s*([\\d,\\.]+)`);
    const match = text.match(regex);
    return match ? parseFloat(match[1].replace(/,/g, "")) : NaN;
  }
 
  function formatNumber(value) {
    return parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
 
  function loadBuilds() {
    const storedBuilds =
      JSON.parse(localStorage.getItem(localStorageKey)) || {};
    return { ...defaultBuilds, ...storedBuilds };
  }
 
  function saveBuilds(builds) {
    const customBuilds = Object.fromEntries(
      Object.entries(builds).filter(([key]) => !(key in defaultBuilds))
    );
    localStorage.setItem(localStorageKey, JSON.stringify(customBuilds));
  }
 
  function loadSelectedBuild() {
    return localStorage.getItem(selectedBuildKey) || "Balanced";
  }
 
  function saveSelectedBuild(build) {
    localStorage.setItem(selectedBuildKey, build);
  }
 
  function displayStats(stats) {
    const userData = document.getElementById("torn-user")?.value;
    if (!userData) {
      console.warn("User data not found.");
      return;
    }
    const gymRoot = document.getElementById("gymroot");
    if (!gymRoot) {
      console.error("Gym root element not found.");
      return;
    }
 
    let container = document.getElementById("statsContainer");
    const builds = loadBuilds();
 
    if (!container) {
      const user = JSON.parse(userData);
 
      container = document.createElement("div");
      container.className = "torn-stats-container";
      container.id = "statsContainer";
 
      const buildOptions = Object.keys(builds)
        .map((build) => `<option value="${build}">${build}</option>`)
        .join("");
 
      container.innerHTML = `
            <hr class="page-head-delimiter">
            <div class="build-dropdown">
                <select id="buildSelector">${buildOptions}</select>
            </div>
            <div id="statsDisplay"></div>
            <button class="add-build-button" id="showAddBuildForm">ADD BUILD</button>
            <form class="add-build-form" id="addBuildForm">
                <div class="form-row"><input type="text" id="buildName" placeholder="Build Name" required /></div>
                <div class="form-row"><input type="number" id="strengthInput" placeholder="Strength %" step="0.01" required /></div>
                <div class="form-row"><input type="number" id="defenseInput" placeholder="Defense %" step="0.01" required /></div>
                <div class="form-row"><input type="number" id="speedInput" placeholder="Speed %" step="0.01" required /></div>
                <div class="form-row"><input type="number" id="dexterityInput" placeholder="Dexterity %" step="0.01" required /></div>
                <button type="button" class="form-button" id="createBuild">CREATE</button>
                <button type="button" class="form-button discard" id="discardBuild">DISCARD</button>
            </form>
        `;
 
      gymRoot.parentElement.insertBefore(container, gymRoot.nextSibling);
 
      setupEventListeners(stats, builds);
    }
 
    const buildSelector = document.getElementById("buildSelector");
    buildSelector.value = loadSelectedBuild();
 
    updateStatsDisplay(stats, buildSelector.value, builds);
  }
  function setupEventListeners(stats, builds) {
    const buildSelector = document.getElementById("buildSelector");
 
    buildSelector.addEventListener("change", (e) => {
      saveSelectedBuild(e.target.value);
      updateStatsDisplay(stats, e.target.value, builds);
    });
 
    document
      .getElementById("showAddBuildForm")
      .addEventListener("click", () => {
        document.getElementById("addBuildForm").classList.add("visible");
      });
 
    document.getElementById("createBuild").addEventListener("click", () => {
      const newBuild = {
        strength: parseFloat(document.getElementById("strengthInput").value),
        defense: parseFloat(document.getElementById("defenseInput").value),
        speed: parseFloat(document.getElementById("speedInput").value),
        dexterity: parseFloat(document.getElementById("dexterityInput").value),
      };
 
      const buildName = document.getElementById("buildName").value.trim();
      const totalPercentage = Object.values(newBuild).reduce(
        (sum, val) => sum + val,
        0
      );
 
      if (!buildName) {
        alert("Your new build must have a name");
        return;
      }
 
      if (totalPercentage !== 100) {
        alert("The total percentage of all stats must equal 100%.");
        return;
      }
 
      builds[buildName] = newBuild;
      saveBuilds(builds);
      updateBuildDropdown(buildSelector, builds);
      resetAndHideForm();
    });
 
    document
      .getElementById("discardBuild")
      .addEventListener("click", resetAndHideForm);
 
    function resetAndHideForm() {
      document.getElementById("addBuildForm").reset();
      document.getElementById("addBuildForm").classList.remove("visible");
    }
  }
 
  function updateBuildDropdown(selector, builds) {
    selector.innerHTML = Object.keys(builds)
      .map((build) => `<option value="${build}">${build}</option>`)
      .join("");
  }
 
  function updateStatsDisplay(stats, build, builds) {
    const targetStats = builds[build];
    const statsDisplay = document.getElementById("statsDisplay");
 
    const rows = [
      createStatRow(
        "Strength",
        stats.strength,
        stats.strengthPercentage,
        targetStats.strength
      ),
      createStatRow(
        "Defense",
        stats.defense,
        stats.defensePercentage,
        targetStats.defense
      ),
      createStatRow(
        "Speed",
        stats.speed,
        stats.speedPercentage,
        targetStats.speed
      ),
      createStatRow(
        "Dexterity",
        stats.dexterity,
        stats.dexterityPercentage,
        targetStats.dexterity
      ),
    ];
 
    statsDisplay.innerHTML = rows.join("");
    statsDisplay.innerHTML += `<p>Total: <span>${stats.total}</span></p>`;
  }
 
  function createStatRow(
    statName,
    statValue,
    currentPercentage,
    targetPercentage
  ) {
    const current = parseFloat(currentPercentage);
    let rowClass = "";
    //let message = "";
 
    if (current < targetPercentage - tolerance) {
      rowClass = "low";
      //message = "Increase this stat to meet the target.";
    } else if (current > targetPercentage + tolerance) {
      rowClass = "high";
      //message = "This stat is above the target. Focus on other stats.";
    }
 
    return `
      <div class="stat-row ${rowClass}">
        <p>${statName}: <span>${statValue} (${currentPercentage}%)</span> | Target: <span>${targetPercentage}% ± ${tolerance}</span></p>
      </div>
    `;
  }
 
  window.addEventListener("load", observeGymStats);
})();
