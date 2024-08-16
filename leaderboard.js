// Global variables
let PRECOMPUTE;
let playerLifetime;
let playerLifetimeArray;
let sortedPlayerLifetime, sortedPlayerNMLifetime, sortedPlayerNMPZLifetime;
let seedsMap = new Map();
let playerGames = new Map();

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


// Base Leaderboard class
class Leaderboard {
    constructor(config) {
        this.config = config;
        this.table = document.createElement('table');
        this.titleElement = document.createElement('h2');
    }

    createHeaders() {
        const headerRow = this.table.insertRow();
        headerRow.classList.add(`header-row-${this.config.rowClass}`);
        this.config.headers.forEach(header => {
            const th = document.createElement('th');
            th.classList.add(`header-${this.config.rowClass}`);
            th.textContent = header;
            headerRow.appendChild(th);
        });
    }

    filterAndSortData(data) {
        return data.slice(1)
            .filter(row => this.config.filterCondition(row))
            .sort(this.config.sortFunction);
    }

    async display(data) {
        this.titleElement.textContent = this.config.title;
        this.createHeaders();
        
        if(data instanceof Map || data instanceof Set) {
            data = Array.from(data);
        } else {
            data = await CSVUtil.loadCSV(data);
        }
        console.log("JOE", data);
        const filteredData = this.filterAndSortData(data);
        filteredData.slice(0, this.config.limit).forEach(row => this.createRow(row));
    }

    createRow(rowData) {
        const tr = this.table.insertRow();
        this.config.cellConfigs.forEach(cellConfig => {
            const td = tr.insertCell();
            cellConfig.display(td, rowData);
        });
    }
}

class AccuracyLeaderboard extends Leaderboard {
    constructor(mode) {
        super({
            rowClass: mode,
            headers: ['Player name', 'Accuracy', 'Games played'],
            title: 'Accuracy leaderboard',
            limit: 10,
            filterCondition: row => parseInt(row[4]) >= PRECOMPUTE['seedCount'][mode] * (1/3),
            sortFunction: (a, b) => parseFloat(b[5]) - parseFloat(a[5]),
            cellConfigs: [
                {
                    display: (td, row) => {
                        const link = document.createElement('a');
                        link.href = `https://geoguessr.com/user/${row[0]}`;
                        link.textContent = row[1];
                        td.appendChild(link);
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = `${Number(row[5] * 100).toFixed(2)}%`;
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = row[4];
                    }
                }
            ]
        });
    }
}

class StreakLeaderboard extends Leaderboard {
    constructor() {
        super({
            rowClass: 'hedge',
            headers: ['Player name', 'Streak length', 'Streak start', 'Streak end'],
            title: 'Streak leaderboard',
            limit: 10,
            filterCondition: () => true,
            sortFunction: (a, b) => parseFloat(b[2]) - parseFloat(a[2]),
            cellConfigs: [
                {
                    display: (td, row) => {
                        const link = document.createElement('a');
                        link.href = `https://geoguessr.com/user/${row[0]}`;
                        link.textContent = row[1];
                        td.appendChild(link);
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = row[2];
                    }
                },
                {
                    display: (td, row) => {
                        this.displayDateLink(td, row, 5, 3);
                    }
                },
                {
                    display: (td, row) => {
                        this.displayDateLink(td, row, 7, 4);
                    }
                }
            ]
        });
    }

    displayDateLink(td, row, dateIndex, linkIndex) {
        const dateStr = PRECOMPUTE['tests'][row[dateIndex]].month + ' ' + PRECOMPUTE['tests'][row[dateIndex]].year;
        const roundStr = ` - ${row[dateIndex + 1]}`;
        const link = document.createElement('a');
        link.href = row[linkIndex];
        link.textContent = dateStr + roundStr;
        td.appendChild(link);
    }
}

class AggregateLeaderboard extends Leaderboard {
    constructor(mode) {
        super({
            rowClass: 'aggr' + mode,
            headers: mode === 'rounds' ? 
                ['Player name', 'Median round score', 'Rounds played'] : 
                ['Player name', 'Median game score', 'Games played'],
            title: 'Aggregate leaderboard',
            limit: 10,
            filterCondition: row => parseInt(row[2]) >= PRECOMPUTE['seedCount']['all'] * (1/4),
            sortFunction: (a, b) => parseFloat(b[4]) - parseFloat(a[4]),
            cellConfigs: [
                {
                    display: (td, row) => {
                        const link = document.createElement('a');
                        link.href = `https://geoguessr.com/user/${row[0]}`;
                        link.textContent = row[1];
                        td.appendChild(link);
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = Math.round(parseFloat(row[4]));
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = row[2];
                    }
                }
            ]
        });
    }
}

class HighScoresLeaderboard extends Leaderboard {
    constructor() {
        super({
            rowClass: 'high-scores',
            headers: ['Player name', 'Score', 'Game'],
            title: 'High scores',
            limit: 10,
            filterCondition: () => true,
            sortFunction: (a, b) => parseFloat(b[9]) - parseFloat(a[9]),
            cellConfigs: [
                {
                    display: (td, row) => {
                        const link = document.createElement('a');
                        link.href = `https://geoguessr.com/user/${row[2]}`;
                        link.textContent = row[3];
                        td.appendChild(link);
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = row[9];
                    }
                },
                {
                    display: (td, row) => {
                        const dateStr = PRECOMPUTE['tests'][row[4]].month + ' ' + PRECOMPUTE['tests'][row[4]].year;
                        const roundStr = ` - ${row[5]}`;
                        const link = document.createElement('a');
                        link.href = row[1];
                        link.textContent = dateStr + roundStr;
                        td.appendChild(link);
                    }
                }
            ]
        });
    }
}

class TestsLeaderboard extends Leaderboard {
    constructor() {
        super({
            rowClass: 'test',
            headers: ['Player name', 'Accuracy', 'Test date', 'Test games played'],
            title: 'Tests',
            limit: 10,
            filterCondition: row => parseInt(row[4]) >= parseInt(row[5]) * (1/2),
            sortFunction: (a, b) => parseFloat(b[6]) - parseFloat(a[6]),
            cellConfigs: [
                {
                    display: (td, row) => {
                        const link = document.createElement('a');
                        link.href = `https://geoguessr.com/user/${row[1]}`;
                        link.textContent = row[2];
                        td.appendChild(link);
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = `${Number(row[6] * 100).toFixed(2)}%`;
                    }
                },
                {
                    display: (td, row) => {
                        const dateStr = PRECOMPUTE['tests'][row[0]].month + ' ' + PRECOMPUTE['tests'][row[0]].year;
                        td.textContent = dateStr;
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = row[4];
                    }
                }
            ]
        });
    }
}

class LeaderboardFactory {
    static create(type, mode = '') {
        switch (type) {
            case 'accuracy':
                return new AccuracyLeaderboard(mode);
            case 'streak':
                return new StreakLeaderboard();
            case 'aggregate':
                return new AggregateLeaderboard(mode);
            case 'highScores':
                return new HighScoresLeaderboard();
            case 'tests':
                return new TestsLeaderboard();
            default:
                throw new Error(`Unknown leaderboard type: ${type}`);
        }
    }
}

class PlayerSummary {
    constructor(playerName) {
        this.playerName = playerName;
        this.playerData = playerLifetime[playerName];
        if (!this.playerData) {
            this.playerData = playerLifetimeArray.find(row => row['PLAYER_ID'].toLowerCase() === playerName.toLowerCase());
        }
    }

    display() {
        if (!this.playerData) {
            pageTitle.innerHTML = '';
            tableContainer.innerHTML = '<p>Player not found. Please check the name and try again.</p>';
            return;
        }

        this.setRanks();
        this.displayPlayerName();
        this.displayLeaderboard();
        this.displayStatistics();
        this.displayUnplayedSeeds();
    }

    setRanks() {
        const compareFunction = row => 
            row['PLAYER_NAME'] === this.playerName || 
            row['PLAYER_ID'].toLowerCase() === this.playerName.toLowerCase();

        this.playerData['RANK_ALL'] = sortedPlayerLifetime.findIndex(compareFunction) + 1 || 'N/A';
        this.playerData['RANK_NM'] = sortedPlayerNMLifetime.findIndex(compareFunction) + 1 || 'N/A';
        this.playerData['RANK_NMPZ'] = sortedPlayerNMPZLifetime.findIndex(compareFunction) + 1 || 'N/A';
    }

    displayPlayerName() {
        const playerNameLink = document.createElement('a');
        playerNameLink.href = `https://geoguessr.com/user/${this.playerData['PLAYER_ID']}`;
        playerNameLink.textContent = this.playerData['PLAYER_NAME'];
        playerNameLink.target = '_blank';
        playerNameLink.style.color = 'inherit';
        playerNameLink.style.textDecoration = 'none';
        pageTitle.innerHTML = '';
        pageTitle.appendChild(playerNameLink);
    }

    displayLeaderboard() {
        if (this.playerData['RANK_ALL'] !== 'N/A') {
            const leaderboard = this.createLeaderboard();
            tableContainer.appendChild(leaderboard);
        }
    }

    createLeaderboard() {
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.className = 'leaderboard';

        const title = document.createElement('h2');
        title.textContent = 'SUMMARY';
        title.className = 'leaderboard-title';
        leaderboardContainer.appendChild(title);

        const modes = [
            { name: 'ALL-TIME', rank: this.playerData.RANK_ALL, accuracy: this.playerData.OVERALL_ACCURACY, total: playerLifetimeArray.length },
            { name: 'NM', rank: this.playerData.RANK_NM, accuracy: this.playerData.NM_ACCURACY, total: playerLifetimeArray.length },
            { name: 'NMPZ', rank: this.playerData.RANK_NMPZ, accuracy: this.playerData.NMPZ_ACCURACY, total: playerLifetimeArray.length }
        ];

        modes.forEach((mode, index) => {
            if (mode.rank === 'N/A') return;
            const card = document.createElement('div');
            card.className = 'leaderboard-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            const gradeLetter = this.calculateGrade(mode.rank, mode.total);

            const content = `
                <h3>${mode.name}</h3>
                <p>RANK: ${mode.rank} / ${mode.total}</p>
                <p>ACCURACY: ${(mode.accuracy * 100).toFixed(2)}%</p>
                <div class="grade grade-${gradeLetter.replace('+','-plus')}">${gradeLetter}</div>
            `;

            card.innerHTML = content;
            leaderboardContainer.appendChild(card);
        });

        return leaderboardContainer;
    }

    calculateGrade(rank, total) {
        const percentile = (total - rank + 1) / total;
        if (percentile >= 0.98) return 'S';
        if (percentile >= 0.94) return 'A+';
        if (percentile >= 0.9) return 'A';
        if (percentile >= 0.85) return 'B+';
        if (percentile >= 0.8) return 'B';
        if (percentile >= 0.75) return 'C+';
        if (percentile >= 0.7) return 'C';
        if (percentile >= 0.65) return 'D+';
        if (percentile >= 0.6) return 'D';
        return 'F';
    }

    displayStatistics() {
        const table = document.createElement('table');
        table.id = 'playerSummaryTable';

        const sections = [
            {
                title: 'General',
                stats: [
                    ['Games played', 'OVERALL_GAMES_PLAYED', 'NM_GAMES_PLAYED', 'NMPZ_GAMES_PLAYED'],
                    ['Rounds played', 'OVERALL_ROUNDS_PLAYED', 'NM_ROUNDS_PLAYED', 'NMPZ_ROUNDS_PLAYED'],
                    ['Accuracy rank', 'RANK_ALL', 'RANK_NM', 'RANK_NMPZ']
                ]
            },
            {
                title: 'Accuracy',
                stats: [
                    ['Accuracy', 'OVERALL_ACCURACY', 'NM_ACCURACY', 'NMPZ_ACCURACY']
                ]
            },
            {
                title: 'Hedge',
                stats: [
                    ['Highest hedge streak', 'OVERALL_HIGHEST_HEDGE_STREAK', 'NM_HIGHEST_HEDGE_STREAK', 'NMPZ_HIGHEST_HEDGE_STREAK'],
                    ['Average hedge streak', 'OVERALL_AVERAGE_HEDGE_STREAK', 'NM_AVERAGE_HEDGE_STREAK', 'NMPZ_AVERAGE_HEDGE_STREAK']
                ]
            },
            {
                title: 'Games',
                stats: [
                    ['Average game score', 'OVERALL_AVERAGE_GAME_SCORE', 'NM_AVG_GAME_SCORE', 'NMPZ_AVG_GAME_SCORE'],
                    ['Median game score', 'OVERALL_MEDIAN_GAME_SCORE', 'NM_MEDIAN_GAME_SCORE', 'NMPZ_MEDIAN_GAME_SCORE'],
                    ['Game score standard deviation', 'OVERALL_GAME_SCORE_STD_DEV', 'NM_GAME_SCORE_STD_DEV', 'NMPZ_GAME_SCORE_STD_DEV'],
                    ['Lowest game score', 'OVERALL_LOWEST_GAME_SCORE', 'NM_LOWEST_GAME_SCORE', 'NMPZ_LOWEST_GAME_SCORE'],
                    ['Highest game score', 'OVERALL_HIGHEST_GAME_SCORE', 'NM_HIGHEST_GAME_SCORE', 'NMPZ_HIGHEST_GAME_SCORE']
                ]
            },
            {
                title: 'Rounds',
                stats: [
                    ['Average round score', 'OVERALL_AVG_ROUND_SCORE', 'NM_AVG_ROUND_SCORE', 'NMPZ_AVG_ROUND_SCORE'],
                    ['Median round score', 'OVERALL_MED_ROUND_SCORE', 'NM_MED_ROUND_SCORE', 'NMPZ_MED_ROUND_SCORE'],
                    ['Round score standard deviation', 'OVERALL_ROUND_SCORE_STD_DEV', 'NM_ROUNDS_SCORE_STD_DEV', 'NMPZ_ROUNDS_SCORE_STD_DEV'],
                    ['Lowest round score', 'OVERALL_LOWEST_ROUND_SCORE', 'NM_LOWEST_ROUND_SCORE', 'NMPZ_LOWEST_ROUND_SCORE'],
                    ['Highest round score', 'OVERALL_HIGHEST_ROUND_SCORE', 'NM_HIGHEST_ROUND_SCORE', 'NMPZ_HIGHEST_ROUND_SCORE']
                ]
            }
        ];

        sections.forEach((section, sectionIndex) => {
            if (sectionIndex > 0) {
                const gapRow = table.insertRow();
                gapRow.style.height = '20px';
            }

            const sectionHeader = table.insertRow();
            sectionHeader.classList.add('summary-subsection');
            ['', 'All-time', 'NM', 'NMPZ'].forEach((header, index) => {
                const th = document.createElement('th');
                th.textContent = index === 0 ? section.title : header;
                sectionHeader.appendChild(th);
            });

            section.stats.forEach(([statName, allTimeKey, nmKey, nmpzKey]) => {
                const row = table.insertRow();
                const cell1 = row.insertCell(0);
                const cell2 = row.insertCell(1);
                const cell3 = row.insertCell(2);
                const cell4 = row.insertCell(3);

                cell1.textContent = statName;
                
                const formatValue = (key) => {
                    let value = this.playerData[key];
                    if (key.includes('ACCURACY')) {
                        return `${(parseFloat(value) * 100).toFixed(2)}%`;
                    } else if (key.includes('SCORE')) {
                        return Math.round(parseFloat(value));
                    }
                    return value;
                };

                cell2.textContent = formatValue(allTimeKey);
                cell3.textContent = formatValue(nmKey);
                cell4.textContent = formatValue(nmpzKey);
            });
        });

        tableContainer.appendChild(table);
    }

    displayUnplayedSeeds() {
        const gap = document.createElement('div');
        gap.style.height = '30px';
        tableContainer.appendChild(gap);

        const unplayedSeedsTable = document.createElement('table');
        unplayedSeedsTable.id = 'unplayedSeedsTable';
        unplayedSeedsTable.style.width = '100%';

        const headerRow = unplayedSeedsTable.insertRow();
        const headerCell = headerRow.insertCell();
        headerCell.classList.add('unplayed-seeds-header');
        headerCell.colSpan = 3;
        headerCell.style.cursor = 'pointer';
        
        const headerText = document.createElement('span');
        headerText.textContent = 'Unplayed Seeds ';
        
        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = '▼';
        toggleIcon.style.float = 'right';
        
        headerCell.appendChild(headerText);
        headerCell.appendChild(toggleIcon);

        const unplayedSeedsBody = document.createElement('tbody');
        unplayedSeedsBody.style.display = 'none';

        const playedSeeds = playerGames.get(this.playerName) || new Set();

        const unplayedSeeds = Array.from(seedsMap.entries())
            .filter(([seedLink, ]) => !playedSeeds.has(seedLink))
            .map(([seedLink, seedData]) => ({
                seedLink,
                ...seedData
            }));

        if (unplayedSeeds.length > 0) {
            const subheaderRow = unplayedSeedsBody.insertRow();
            ['Seed', 'Test date', 'Seed #'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                subheaderRow.appendChild(th);
            });

            unplayedSeeds.forEach(seed => {
                const row = unplayedSeedsBody.insertRow();
                const seedDetailsCell = row.insertCell();
                const link = document.createElement('a');
                link.href = seed.seedLink;
                link.target = '_blank';
                link.textContent = `${seed.SEED_MAP} ${seed.SEED_MODE} ${seed.SEED_TIME}s`;
                seedDetailsCell.appendChild(link);

                const testNameCell = row.insertCell();
                const testName = PRECOMPUTE.tests[seed.TEST_ID]['month'] + ' ' + PRECOMPUTE.tests[seed.TEST_ID]['year'] || seed.TEST_ID;
                testNameCell.textContent = testName;

                const seedNumberCell = row.insertCell();
                seedNumberCell.textContent = seed.SEED_NUMBER;
            });
        } else {
            const row = unplayedSeedsBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.textContent = 'Player is up to date.';
        }

        unplayedSeedsTable.appendChild(unplayedSeedsBody);

        headerCell.addEventListener('click', () => {
            if (unplayedSeedsBody.style.display === 'none') {
                unplayedSeedsBody.style.display = '';
                toggleIcon.textContent = '▲';
            } else {
                unplayedSeedsBody.style.display = 'none';
                toggleIcon.textContent = '▼';
            }
        });

        tableContainer.appendChild(unplayedSeedsTable);
    }
}

// Main functions
async function initializeData() {
    try {
        PRECOMPUTE = await fetch(`./static/json/precomp.json`).then(response => response.json());
        playerLifetime = await CSVUtil.loadCSVWithHeaders('PLAYER_CARD.csv', 'PLAYER_NAME');
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
            const [, SEED_LINK, PLAYER_ID, PLAYER_NAME, , , ,] = row;
            if (!playerGames.has(PLAYER_NAME)) {
                playerGames.set(PLAYER_NAME, new Set());
            }
            playerGames.get(PLAYER_NAME).add(SEED_LINK);
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

function initializePlayerSearch() {
    const mySummaryTab = document.getElementById('my-summary');
    const playerSearchContainer = document.getElementById('playerSearchContainer');
    const playerNameInput = document.getElementById('playerNameInput');
    const searchPlayerButton = document.getElementById('searchPlayerButton');

    mySummaryTab.addEventListener('click', (e) => {
        document.querySelectorAll('.tab, .submenu-item').forEach(t => t.classList.remove('active'));
        tableContainer.innerHTML = '';
        pageTitle.innerHTML = '';
        pageTitle.classList.remove('russiacord');
        playerSearchContainer.style.display = 'block';
        e.stopPropagation();
    });

    searchPlayerButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            const playerSummary = new PlayerSummary(playerName);
            playerSummary.display();
        }
    });

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPlayerButton.click();
        }
    });
}

async function displayLeaderboard(container, activeId, dataFiles) {
    const files = dataFiles ? dataFiles.split(',').map(file => file.trim()) : [];
    if (files.length === 0) {
        switch(activeId) {
            case 'high-scores':
                files.push(playerGames);
                break;
        }
    }

    for (const file of files) {
        let leaderboard;
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';

        switch (activeId) {
            case 'player-nmpz':
            case 'player-nm':
            case 'player-all':
                const mode = activeId.split('-')[1];
                leaderboard = LeaderboardFactory.create('accuracy', mode);
                pageTitle.textContent = mode === 'all' ? 'All-time' : mode.toUpperCase();
                break;
            case 'player-hedge':
                leaderboard = LeaderboardFactory.create('streak');
                pageTitle.textContent = 'Hedge';
                break;
            case 'player-games':
            case 'player-rounds':
                const aggregateMode = activeId.split('-')[1];
                leaderboard = LeaderboardFactory.create('aggregate', aggregateMode);
                pageTitle.textContent = aggregateMode === 'rounds' ? 'Rounds' : 'Games';
                break;
            case 'high-scores':
                leaderboard = LeaderboardFactory.create('highScores');
                pageTitle.textContent = "High scores";
                break;
            case 'tests':
                leaderboard = LeaderboardFactory.create('tests');
                pageTitle.textContent = "Tests";
                break;
            default:
                console.error(`Unknown activeId: ${activeId}`);
                return;
        }

        tableWrapper.appendChild(leaderboard.titleElement);
        tableWrapper.appendChild(leaderboard.table);
        container.appendChild(tableWrapper);

        await leaderboard.display(file);

        requestAnimationFrame(() => {
            tableWrapper.classList.add('visible');
        });
    }
}

async function loadAndDisplayLeaderboard(activeId) {
    const item = document.querySelector(`#${activeId}`);
    if (!item) {
        console.error(`Element with id ${activeId} not found`);
        return;
    }

    const dataFiles = item.getAttribute('data-file');
    const container = document.getElementById('tableContainer');
    
    document.querySelector('#playerSearchContainer').style.display = 'none';
    container.innerHTML = '';
    
    await displayLeaderboard(container, activeId, dataFiles);
    
    document.querySelectorAll('.submenu-item').forEach(t => t.classList.remove('active'));
    item.classList.add('active');
}

function initializeSubmenuItems() {
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            const activeId = item.getAttribute('id');
            await loadAndDisplayLeaderboard(activeId);
            closeAllSubmenus();
            e.stopPropagation();
        });
    });
}

function closeAllSubmenus() {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    await initializeData();
    initializeTabs();
    initializeSubmenuItems();
    initializePlayerSearch();

    // Set default view
    await loadAndDisplayLeaderboard('player-all');
});

// Add any additional utility functions or classes here as needed

// Example of how to add a new leaderboard type:
/*
class NewLeaderboardType extends Leaderboard {
    constructor(specificParameter) {
        super({
            rowClass: 'new-type',
            headers: ['Header1', 'Header2', 'Header3'],
            title: 'New Leaderboard Type',
            limit: 10,
            filterCondition: row => true, // Adjust as needed
            sortFunction: (a, b) => parseFloat(b[1]) - parseFloat(a[1]), // Adjust as needed
            cellConfigs: [
                {
                    display: (td, row) => {
                        // Custom display logic for each cell
                    }
                },
                // Add more cell configs as needed
            ]
        });
        this.specificParameter = specificParameter;
    }

    // Add any specific methods for this leaderboard type
}

// Then add it to the LeaderboardFactory:
case 'newType':
    return new NewLeaderboardType(mode);
*/

// You can also add more global variables, utility functions, or modify existing classes as needed to accommodate new features or data structures.

// Remember to update the initializeData function if you need to load additional data for new features.

// If you need to add new event listeners or initialize new components, you can do so in the DOMContentLoaded event listener or create separate initialization functions.

// This structure allows for easy expansion and modification of the leaderboard system while maintaining a clean and organized codebase.