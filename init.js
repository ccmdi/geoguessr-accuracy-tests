// Global variables
let PRECOMPUTE, SUBDIVISIONS;
let playerLifetime;
let playerLifetimeArray;
let sortedPlayers;
let seedsMap = new Map();
let playerGames = new Map();
let playerTests = new Map();
let tests = new Map();
let records = new Map();
let origMenu;

class CSVUtil {
    static async loadCSV(file, type = 'views') {
        try {
            let response = await fetch(`./static/csv/${type}/${file}`);
            const csv = await response.text();
            return csv.split('\n').map(row => row.split(','));
        } catch (error) {
            console.error('Error fetching CSV:', error);
        }
    }

    static async loadCSVWithHeaders(file, keyColumn) {
        try {
            const data = await this.loadCSV(file);
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
        } catch (error) {
            console.error('Error parsing CSV with headers:', error);
        }
    }
}


// Initialization functions
async function initializeData() {
    try {
        PRECOMPUTE = await fetch(`./static/json/precomp.json`).then(response => response.json());
        SUBDIVISIONS = await fetch(`./static/json/subdivisions.json`).then(response => response.json());
        playerLifetime = await CSVUtil.loadCSVWithHeaders('PLAYER_CARD.csv', 'PLAYER_NAME');
        playerLifetimeArray = Object.values(playerLifetime);
        
        sortedPlayers = {
            "all": playerLifetimeArray
                .filter(row => parseInt(row['OVERALL_GAMES_PLAYED']) >= PRECOMPUTE['seedCount']['all'] * 1/4)
                .sort((a, b) => parseFloat(b['OVERALL_ACCURACY']) - parseFloat(a['OVERALL_ACCURACY'])),
            "nm": playerLifetimeArray
                .filter(row => parseInt(row['NM_GAMES_PLAYED']) >= PRECOMPUTE['seedCount']['nm'] * 1/4)
                .sort((a, b) => parseFloat(b['NM_ACCURACY']) - parseFloat(a['NM_ACCURACY'])),
            "nmpz": playerLifetimeArray
            .filter(row => parseInt(row['NMPZ_GAMES_PLAYED']) >= PRECOMPUTE['seedCount']['nmpz'] * 1/4)
            .sort((a, b) => parseFloat(b['NMPZ_ACCURACY']) - parseFloat(a['NMPZ_ACCURACY']))
        }

        const seedsData = await CSVUtil.loadCSV('SEEDS.csv', 'tables');
        seedsData.slice(1).forEach(row => {
            const [TEST_ID, SEED_NUMBER, SEED_LINK, SEED_MAP, SEED_TIME, SEED_MODE] = row;
            seedsMap.set(SEED_LINK, {
                TEST_ID,
                SEED_NUMBER,
                SEED_MAP,
                SEED_TIME,
                SEED_MODE
            });
        });

        const gamesData = await CSVUtil.loadCSV('GAME_SUM.csv');
        gamesData.slice(1).forEach(row => {
            const SEED_LINK = row[1], PLAYER_ID = row[2], PLAYER_NAME = row[3];
            if (!playerGames.has(PLAYER_NAME)) {
                playerGames.set(PLAYER_NAME, new Set());
            }
            playerGames.get(PLAYER_NAME).add(SEED_LINK);
        });

        const testsData = await CSVUtil.loadCSV('TEST_SUM.csv');
        testsData.slice(1).forEach(row => {
            const testId = row[0];
            if (!tests.has(testId)) {
                tests.set(testId, []);
            }

            tests.get(testId).push(row);
        });


        const playerTestsData = await CSVUtil.loadCSV('PLAYER_TEST_SUM.csv');
        playerTestsData.slice(1).forEach(row => {
            const playerName = row[2];
            if (!playerTests.has(playerName)) {
                playerTests.set(playerName, {});
            }
            
            playerTests.get(playerName)[row[0]] = Array.from(row.slice(1));
            playerTests.get(playerName)[row[0]].push(tests.get(row[0])[0][4]);
        });

        const recordsData = await CSVUtil.loadCSV('RECORDS.csv');
        recordsData.slice(1).forEach(row => {
            const recordType = row[0];
            if (!records.has(recordType)) {
                records.set(recordType, []);
            }
            
            records.get(recordType).push(row);
        });
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            tabs.forEach(t => t !== tab && t.classList.remove('active'));
            if (!this.classList.contains('page')) {
                this.classList.toggle('active');
            }
            e.stopPropagation();
        });
    });

    document.addEventListener('click', () => {
        tabs.forEach(tab => !tab.classList.contains('page') && tab.classList.remove('active'));
    });
}


function initializeSubmenuItems() {
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            const activeId = item.getAttribute('id');
            await displayLeaderboard(tableContainer, activeId, document.querySelector(`#${activeId}`).getAttribute('data-file'));
            closeAllSubmenus();
            showContainer('tableContainer');
            e.stopPropagation();
        });
    });
}

// Useful functions
function closeAllSubmenus() {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
}

function showContainer(containerId) {
    document.getElementById(containerId).style.display = 'block';
}

function hideContainers(exclude = null) {
    document.querySelectorAll('.container').forEach(container => {
        if (!exclude.includes(container.id)) {
            container.style.display = 'none';
        }
    });
}