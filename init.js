let PRECOMPUTE;
const tableContainer = document.getElementById('tableContainer');
const pageTitle = document.getElementById('pageTitle');
const mySummaryTab = document.getElementById('my-summary');
const playerSearchContainer = document.getElementById('playerSearchContainer');
const playerNameInput = document.getElementById('playerNameInput');
const searchPlayerButton = document.getElementById('searchPlayerButton');

let playerLifetime;
let playerLifetimeArray;
let sortedPlayerLifetime, sortedPlayerNMLifetime, sortedPlayerNMPZLifetime;
let seedsMap = new Map();
let playerGames = new Map();


// Pre-compute
async function global() {
    try {
        PRECOMPUTE = await fetch(`./static/json/precomp.json`)
            .then(response => response.text())
            .then(json => {
                return JSON.parse(json);
            });
    } catch (error) {
        console.error('Error fetching SEEDS:', error);
    }
}

// Tables
function createHeaders(table, headerNames, rowName) {
    const tr = table.insertRow();
    tr.classList.add('header-row-'+rowName);
    headerNames.forEach(header => {
        const th = document.createElement('th');
        th.classList.add('header-'+rowName);
        th.textContent = header;
        tr.appendChild(th);
    });
}

function loadCSV(file) {
    return fetch(`./static/csv/views/${file}`)
        .then(response => response.text())
        .then(csv => {
            return csv.split('\n').map(row => row.split(','));
        })
        .catch(error => console.error('Error fetching CSV:', error));
}

function loadCSVWithHeaders(file, keyColumn) {
    return loadCSV(file)
        .then(data => {
            if (data.length < 2) {
                throw new Error('CSV file must have at least a header row and one data row');
            }

            const headers = data[0];
            const rows = data.slice(1);
            const keyIndex = headers.findIndex(header => header.trim() === keyColumn);

            if (keyIndex === -1) {
                throw new Error(`Key column "${keyColumn}" not found in CSV headers`);
            }

            const result = {};

            rows.forEach(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header.trim()] = row[index] ? row[index].trim() : '';
                });
                const key = row[keyIndex].trim();
                result[key] = obj;
            });

            return result;
        })
        .catch(error => console.error('Error parsing CSV with headers:', error));
}

// Menus
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            tabs.forEach(t => {
                if (t !== tab) {
                    t.classList.remove('active');
                }
            });
            if(!this.classList.contains('page')){
                this.classList.toggle('active');
            }
            e.stopPropagation();
        });
    });

    document.addEventListener('click', function() {
        tabs.forEach(tab => {
            if (!tab.classList.contains('page')) {
                tab.classList.remove('active');
            }
        });
    });
}

function closeAllSubmenus() {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
}

document.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.submenu-item').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
       
        const files = item.getAttribute('data-file').split(',');
        const activeId = item.getAttribute('id');
        
        document.querySelector('#playerSearchContainer').style.display = 'none';
        pageTitle.innerHTML = '';
        tableContainer.innerHTML = '';
        
        files.forEach((file, index) => {
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-wrapper';
            
            const title = document.createElement('h2');
            title.className = 'csv-title';
            tableWrapper.appendChild(title);
            
            const table = document.createElement('table');
            tableWrapper.appendChild(table);
            
            tableContainer.appendChild(tableWrapper);
            
            loadCSV(file).then(csv => displayCSV(csv, table, title, activeId, index));
        });
       
        closeAllSubmenus();
        e.stopPropagation();
    });
});

// My summary initialization
async function mySummary() {
    mySummaryTab.addEventListener('click', (e) => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.submenu-item').forEach(t => t.classList.remove('active'));
        tableContainer.innerHTML = '';
        pageTitle.innerHTML = '';
        pageTitle.classList.remove('russiacord');
        playerSearchContainer.style.display = 'block';
        e.stopPropagation();
    });

    searchPlayerButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            displayPlayerSummary(playerName);
        }
    });

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPlayerButton.click();
        }
    });

    playerLifetime = await loadCSVWithHeaders('PLAYER_CARD.csv', 'PLAYER_NAME');
    playerLifetimeArray = Object.values(playerLifetime);
    
    sortedPlayerLifetime = playerLifetimeArray
        .filter(row => parseInt(row['OVERALL_GAMES_PLAYED']) >= PRECOMPUTE['seedCount']['all'] * 1/4)
        .sort((a, b) => parseFloat(b['OVERALL_ACCURACY']) - parseFloat(a['OVERALL_ACCURACY']));
    
    sortedPlayerNMLifetime = playerLifetimeArray
        .filter(row => parseInt(row['NM_GAMES_PLAYED']) >= PRECOMPUTE['seedCount']['nm'] * 1/4)
        .sort((a, b) => parseFloat(b['NM_ACCURACY']) - parseFloat(a['NM_ACCURACY']));
    
    sortedPlayerNMPZLifetime = playerLifetimeArray
        .filter(row => parseInt(row['NMPZ_GAMES_PLAYED']) >= PRECOMPUTE['seedCount']['nmpz'] * 1/4)
        .sort((a, b) => parseFloat(b['NMPZ_ACCURACY']) - parseFloat(a['NMPZ_ACCURACY']));
}

async function seeds() {
    try {
        const seedsResponse = await fetch(`./static/csv/tables/SEEDS.csv`);
        const seedsCsv = await seedsResponse.text();
        
        seedsCsv.split('\n').slice(1).forEach(row => {
            const [TEST_ID, SEED_NUMBER, SEED_LINK, SEED_MAP, SEED_TIME, SEED_MODE] = row.split(',');
            seedsMap.set(SEED_LINK, {
                TEST_ID,
                SEED_NUMBER,
                SEED_MAP,
                SEED_TIME,
                SEED_MODE
            });
        });

        const gamesResponse = await fetch(`./static/csv/views/GAME_SUM.csv`);
        const gamesCsv = await gamesResponse.text();
        
        gamesCsv.split('\n').slice(1).forEach(row => {
            const [, SEED_LINK, PLAYER_ID, PLAYER_NAME, , , , ,] = row.split(',');
            if (!playerGames.has(PLAYER_NAME)) {
                playerGames.set(PLAYER_NAME, new Set());
            }
            playerGames.get(PLAYER_NAME).add(SEED_LINK);
        });
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    global().then(() => {
        document.querySelector("#player-lifetime").click(); //default menu
        initializeTabs();
        mySummary();
        seeds();
    });
});