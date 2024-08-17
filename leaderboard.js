// Global variables
let PRECOMPUTE;
let playerLifetime;
let playerLifetimeArray;
let sortedPlayers;
let seedsMap = new Map();
let playerGames = new Map();
let playerTests = new Map();
let tests = new Map();
let records = new Map();

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
        
        if(data instanceof Map || data instanceof Set || data instanceof Array) {
            data = Array.from(data);
        } else {
            data = await CSVUtil.loadCSV(data);
        }
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
            sortFunction: (a, b) => parseFloat(b[3]) - parseFloat(a[3]),
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
                        td.textContent = row[3];
                    }
                },
                {
                    display: (td, row) => {
                        const dateStr = PRECOMPUTE['tests'][row[6]].month + ' ' + PRECOMPUTE['tests'][row[6]].year;
                        const roundStr = ` - ${row[8]}`;
                        const link = document.createElement('a');
                        link.href = row[4];
                        link.textContent = dateStr + roundStr;
                        td.appendChild(link);
                    }
                }
            ]
        });
    }
}

class TestsLeaderboard extends Leaderboard {
    constructor(mode) {
        super({
            rowClass: 'test',
            headers: ['Player name', 'Accuracy', 'Test date', 'Test games played'],
            title: mode === 'all' ? 'All-time' : mode.toUpperCase(),
            limit: 10,
            filterCondition: () => true,
            sortFunction: (a, b) => parseFloat(b[3]) - parseFloat(a[3]),
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
                        td.textContent = `${Number(row[3] * 100).toFixed(2)}%`;
                    }
                },
                {
                    display: (td, row) => {
                        const dateStr = PRECOMPUTE['tests'][row[6]].month + ' ' + PRECOMPUTE['tests'][row[6]].year;
                        td.textContent = dateStr;
                    }
                },
                {
                    display: (td, row) => {
                        td.textContent = row[8];
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
                return new TestsLeaderboard(mode);
            default:
                throw new Error(`Unknown leaderboard type: ${type}`);
        }
    }
}

class PlayerSummary {
    constructor(playerName) {
        this.playerName = playerName;
        this.playerData = playerLifetime[playerName] || playerLifetimeArray.find(row => row['PLAYER_ID'].toLowerCase() === playerName.toLowerCase());
        this.sortOrder = 'desc';
    }

    display() {
        if (!this.playerData) {
            this.displayError("Player not found. Please check the name and try again.");
            return;
        }

        tableContainer.innerHTML = '';
        this.setRanks();
        this.displayPlayerName();
        this.displaySections();
        this.displayStatistics();
        this.displayTestSearch();
        this.displayUnplayedSeeds();
    }

    displayError(message) {
        pageTitle.innerHTML = '';
        tableContainer.innerHTML = `<p>${message}</p>`;
    }

    setRanks() {
        const compareFunction = row => 
            row['PLAYER_NAME'] === this.playerName || 
            row['PLAYER_ID'].toLowerCase() === this.playerName.toLowerCase();

        ['ALL', 'NM', 'NMPZ'].forEach(mode => {
            this.playerData[`RANK_${mode}`] = sortedPlayers[mode.toLowerCase()].findIndex(compareFunction) + 1 || 'N/A';
        });
    }

    displayPlayerName() {
        const playerNameLink = this.createLink(
            `https://geoguessr.com/user/${this.playerData['PLAYER_ID']}`,
            this.playerData['PLAYER_NAME'],
            { color: 'inherit', textDecoration: 'none', target: '_blank' }
        );
        pageTitle.innerHTML = '';
        pageTitle.appendChild(playerNameLink);
    }

    createLink(href, text, styles = {}) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        Object.assign(link.style, styles);
        return link;
    }

    displaySections() {
        const container = this.createFlexContainer();
        const sections = [
            { title: 'SUMMARY', data: this.getSummaryData() },
            { title: 'TESTS', data: this.getImprovementData() }
        ];

        let hasContent = false;

        sections.forEach(({ title, data }) => {
            const section = this.createSection(title, data);
            if (section) {
                container.appendChild(section);
                hasContent = true;
            }
        });

        if (hasContent) {
            tableContainer.appendChild(container);
        }
    }

    createFlexContainer() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        return container;
    }

    createSection(title, data) {
        const section = document.createElement('div');
        section.className = 'leaderboard';
        section.style.flex = '1';
        section.style.margin = '10px';
        section.style.flexDirection = 'column'

        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        titleElement.className = 'leaderboard-title';
        section.appendChild(titleElement);

        let cardCount = 0;
        data.forEach((item, index) => {
            if (this.playerData["RANK_"+(item.name === 'ALL-TIME' ? 'all' : item.name).toUpperCase()] === 'N/A') return;
            const card = document.createElement('div');
            card.className = 'leaderboard-card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = this.getCardContent(item);
            section.appendChild(card);
            cardCount++;
        });
        
        if (cardCount === 0) return null;
        return section;
    }

    getCardContent(data) {
        if (data.type === 'summary') {
            const gradeLetter = this.calculateGrade(data.rank, data.total);
            return `
                <h3>${data.name}</h3>
                <p>RANK: ${data.rank} / ${data.total}</p>
                <p>ACCURACY: ${(data.accuracy * 100).toFixed(2)}%</p>
                <div class="grade grade-${gradeLetter.replace('+','-plus')}">${gradeLetter}</div>
            `;
        } else if (data.type === 'improvement') {
            if (data.isPercentage) {
                const value = parseFloat(data.value) * 100;
                const formattedValue = value.toFixed(2);
                const arrow = value >= 0 ? '↑' : '↓';
                const color = value >= 0 ? 'green' : 'red';
                return `
                    <h3>${data.name}</h3>
                    <p>ACCURACY CHANGE:</p>
                    <p style="color: ${color}; font-size: 24px; font-weight: bold;">
                        ${arrow} ${Math.abs(formattedValue)}%
                    </p>
                `;
            } else {
                return `
                    <h3>${data.name}</h3>
                    <p>${data.value}</p>
                `;
            }
        }
    }

    calculateGrade(rank, total) {
        const percentile = (total - rank + 1) / total;
        const grades = [
            { threshold: 0.98, grade: 'S' },
            { threshold: 0.94, grade: 'A+' },
            { threshold: 0.9, grade: 'A' },
            { threshold: 0.85, grade: 'B+' },
            { threshold: 0.8, grade: 'B' },
            { threshold: 0.75, grade: 'C+' },
            { threshold: 0.7, grade: 'C' },
            { threshold: 0.65, grade: 'D+' },
            { threshold: 0.6, grade: 'D' },
        ];
        return grades.find(g => percentile >= g.threshold)?.grade || 'F';
    }

    getSummaryData() {
        return ['ALL', 'NM', 'NMPZ'].map(mode => ({
            type: 'summary',
            name: mode === 'ALL' ? 'ALL-TIME' : mode,
            rank: this.playerData[`RANK_${mode}`],
            accuracy: this.playerData[`${mode === 'ALL' ? 'OVERALL' : mode}_ACCURACY`],
            total: playerLifetimeArray.length
        }));
    }

    getImprovementData() {
        return [
            { name: 'TOTAL TESTS', key: 'TOTAL_TESTS', isPercentage: false },
            { name: 'OVERALL IMPROVEMENT', key: 'OVERALL_IMPROVEMENT', isPercentage: true },
            { name: 'RECENT IMPROVEMENT', key: 'RECENT_IMPROVEMENT', isPercentage: true },
            { name: 'RECENT IMPROVEMENT (5)', key: 'RECENT_5_IMPROVEMENT', isPercentage: true },
            { name: 'FIRST TEST', key: 'FIRST_TEST_NAME', isPercentage: false },
            { name: 'LATEST TEST', key: 'LAST_TEST_NAME', isPercentage: false }
        ].map(item => ({
            type: 'improvement',
            name: item.name,
            value: this.playerData[item.key],
            isPercentage: item.isPercentage
        }));
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
                    ['Top finishes', 'TOP_FINISHES', 'NM_TOP_FINISHES', 'NMPZ_TOP_FINISHES'],
                    ['Top 3 finishes', 'TOP3_FINISHES', 'NM_TOP3_FINISHES', 'NMPZ_TOP3_FINISHES'],
                    ['Top finish rate', 'TOP_FINISH_RATE', 'NM_TOP_FINISH_RATE', 'NMPZ_TOP_FINISH_RATE'],
                    ['Top 3 finish rate', 'TOP3_FINISH_RATE', 'NM_TOP3_FINISH_RATE', 'NMPZ_TOP3_FINISH_RATE']
                ]
            },
            {
                title: 'Accuracy',
                stats: [
                    ['Accuracy', 'OVERALL_ACCURACY', 'NM_ACCURACY', 'NMPZ_ACCURACY'],
                    ['Adjusted accuracy', 'OVERALL_ADJ_ACCURACY', 'NM_ADJ_ACCURACY', 'NMPZ_ADJ_ACCURACY'],
                    ['Accuracy rank', 'RANK_ALL', 'RANK_NM', 'RANK_NMPZ']
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
                    if (key.includes('ACCURACY') || key.includes('RATE')) {
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
            const headerCount = document.createElement('span');
            headerCount.textContent = `(${unplayedSeeds.length})`;
            headerCount.classList.add('unplayed-seeds-count');
            headerText.appendChild(headerCount);

            const subheaderRow = unplayedSeedsBody.insertRow();
            ['Seed', 'Test date', 'Seed #'].forEach((text, index) => {
                const th = document.createElement('th');
                th.textContent = text;
                if (index === 1) { // Only add sort button to 'Test date' column
                    const sortButton = document.createElement('button');
                    sortButton.textContent = '↓'; // Initially descending
                    sortButton.className = 'sort-button';
                    sortButton.addEventListener('click', () => {
                        this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
                        sortButton.textContent = this.sortOrder === 'desc' ? '↓' : '↑';
                        this.sortUnplayedSeeds(unplayedSeeds, unplayedSeedsBody);
                    });
                    th.appendChild(sortButton);
                }
                subheaderRow.appendChild(th);
            });

            this.sortUnplayedSeeds(unplayedSeeds, unplayedSeedsBody);
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

    sortUnplayedSeeds(seeds, tableBody) {
        seeds.sort((a, b) => {
            const dateA = new Date(PRECOMPUTE.tests[a.TEST_ID].year, this.getMonthNumber(PRECOMPUTE.tests[a.TEST_ID].month));
            const dateB = new Date(PRECOMPUTE.tests[b.TEST_ID].year, this.getMonthNumber(PRECOMPUTE.tests[b.TEST_ID].month));
            
            if (dateA.getTime() !== dateB.getTime()) {
                return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
            
            const seedNumberA = parseInt(a.SEED_NUMBER);
            const seedNumberB = parseInt(b.SEED_NUMBER);
            return this.sortOrder === 'desc' ? seedNumberB - seedNumberA : seedNumberA - seedNumberB;
        });

        this.populateUnplayedSeedsTable(seeds, tableBody);
    }

    displayTestSearch() {
        const testSearchContainer = document.createElement('div');
        testSearchContainer.className = 'test-search-container';
        testSearchContainer.style.marginTop = '30px';

        const title = document.createElement('h2');
        title.textContent = 'Search by test';
        title.className = 'leaderboard-title';

        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.justifyContent = 'center';
        inputContainer.style.marginBottom = '20px';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'testNameInput';
        input.placeholder = 'Enter test name';
        input.style.marginRight = '10px';
        input.style.padding = '8px';
        input.style.width = '250px';

        const button = document.createElement('button');
        button.textContent = 'Search';
        button.id = 'searchTestButton';
        button.style.padding = '8px 16px';

        inputContainer.appendChild(input);
        inputContainer.appendChild(button);

        const resultContainer = document.createElement('div');
        resultContainer.id = 'testResultContainer';

        testSearchContainer.appendChild(title);
        testSearchContainer.appendChild(inputContainer);
        testSearchContainer.appendChild(resultContainer);

        tableContainer.appendChild(testSearchContainer);

        button.addEventListener('click', () => this.searchTest(input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchTest(input.value);
            }
        });
    }

    async searchTest(testName) {
        const resultContainer = document.getElementById('testResultContainer');
        resultContainer.innerHTML = 'Searching...';

        try {
            const testData = await this.fetchTestData(testName);
            if (testData) {
                this.displayTestResults(testData);
            } else {
                resultContainer.innerHTML = 'Test not found or player did not participate.';
            }
        } catch (error) {
            console.error('Error searching for test:', error);
            resultContainer.innerHTML = 'An error occurred while searching for the test.';
        }
    }

    async fetchTestData(testName) {
        const testId = Object.keys(PRECOMPUTE.tests).find(key => 
            `${PRECOMPUTE.tests[key].month} ${PRECOMPUTE.tests[key].year}` === testName
        );
        if (!testId) return null;

        const testData = playerTests.get(this.playerName)[testId];
        console.log(testData[12]);
        return {
            testName: testName,
            accuracy: testData[6],
            rank: testData[11],
            totalParticipants: testData[12],
            gamesPlayed: testData[4],
            totalSeeds: testData[5]
        };
    }

    displayTestResults(testData) {
        const resultContainer = document.getElementById('testResultContainer');
        resultContainer.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'leaderboard-card';
        card.style.width = '100%';
        card.style.maxWidth = '500px';
        card.style.margin = '0 auto';

        card.innerHTML = `
            <h3>${testData.testName}</h3>
            <p>${(testData.accuracy * 100).toFixed(2)}%</p>
            <p>${testData.rank} / ${testData.totalParticipants}</p>
            <p>${testData.gamesPlayed}/${testData.totalSeeds} games played</p>
        `;

        resultContainer.appendChild(card);
    }

    getMonthNumber(monthName) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(monthName);
    }

    populateUnplayedSeedsTable(seeds, tableBody) {
        // Clear existing rows
        while (tableBody.rows.length > 1) {
            tableBody.deleteRow(1);
        }

        seeds.forEach(seed => {
            const row = tableBody.insertRow();
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
    }
}

// Main functions
async function initializeData() {
    try {
        PRECOMPUTE = await fetch(`./static/json/precomp.json`).then(response => response.json());
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
            const [, SEED_LINK, PLAYER_ID, PLAYER_NAME, , , ,] = row;
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
    // File assignment
    let files = dataFiles && dataFiles.includes('.csv') ? dataFiles.split(',').map(file => file.trim()) : null;
    if (!files && document.querySelector("#records-submenu #"+activeId)) {
        switch(activeId) {
            case 'high-scores':
                files = [records.get('GAME_SCORE')];
                break;
            case 'tests':
                files = [records.get('TEST_ACCURACY'), records.get('TEST_ACCURACY_NM'), records.get('TEST_ACCURACY_NMPZ')];
                break;
        }
    }

    for (let file of files) {
        let leaderboard;
        let mode;
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';

        switch (activeId) {
            case 'player-nmpz':
            case 'player-nm':
            case 'player-all':
                mode = activeId.split('-')[1];
                leaderboard = LeaderboardFactory.create('accuracy', mode);
                pageTitle.textContent = mode === 'all' ? 'All-time' : mode.toUpperCase();
                break;
            case 'player-hedge':
                leaderboard = LeaderboardFactory.create('streak');
                pageTitle.textContent = 'Hedge';
                break;
            case 'player-games':
            case 'player-rounds':
                mode = activeId.split('-')[1];
                leaderboard = LeaderboardFactory.create('aggregate', mode);
                pageTitle.textContent = mode === 'rounds' ? 'Rounds' : 'Games';
                break;
            case 'high-scores':
                leaderboard = LeaderboardFactory.create('highScores');
                pageTitle.textContent = "High scores";
                break;
            case 'tests':
                mode = file[0][0].split('_')[2] || 'all';
                leaderboard = LeaderboardFactory.create('tests', mode);
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

    await loadAndDisplayLeaderboard('player-all'); //default page
});
