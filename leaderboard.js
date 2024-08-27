

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

    async display(data, hasHeader) {
        this.titleElement.textContent = this.config.title;
        this.createHeaders();
        
        if(data instanceof Map || data instanceof Set || data instanceof Array) {
            data = Array.from(data);
        } else {
            data = await CSVUtil.loadCSV(data);
        }
        
        const filteredData = data.slice(hasHeader ? 1 : 0)
        .filter(row => this.config.filterCondition(row))
        .sort(this.config.sortFunction);

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
    constructor(mode, isAdjusted) {
        const accAdjustedIndices = {
            'all': 5,
            'nm': 8, 
            'nmpz': 11
        }
        const roundsPlayedIndices = {
            'all': 4,
            'nm': 7,
            'nmpz': 10
        }

        super({
            rowClass: mode,
            headers: ['Player name', 'Accuracy', 'Games played'],
            title: isAdjusted ? 'Adjusted accuracy leaderboard' : 'Accuracy leaderboard',
            limit: 10,
            filterCondition: row => {
                if (isAdjusted) {
                    console.log(row[1], row[roundsPlayedIndices[mode]] / 5, row[5],PRECOMPUTE['seedCount'][mode] * (1/2));
                    return parseInt(row[roundsPlayedIndices[mode]] / 5) >= PRECOMPUTE['seedCount'][mode] * (2/5) && parseInt(row[5]) == 0
                } else {
                    return parseInt(row[4]) >= PRECOMPUTE['seedCount'][mode] * (1/2) && parseInt(row[5]) == 0;
                }
            },
            sortFunction: (a, b) => {
                if(isAdjusted) {
                    return parseFloat(b[accAdjustedIndices[mode]]) - parseFloat(a[accAdjustedIndices[mode]]);
                } else {
                    return parseFloat(b[5]) - parseFloat(a[5]);
                }
            },
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
                        if(isAdjusted) {
                            td.textContent = `${Number(row[accAdjustedIndices[mode]] * 100).toFixed(2)}%`;
                        } else {
                            td.textContent = `${Number(row[5] * 100).toFixed(2)}%`;
                        }
                    }
                },
                {
                    display: (td, row) => {
                        if(isAdjusted) {
                            td.textContent = Math.round(row[roundsPlayedIndices[mode]] / 5);
                        } else {
                            td.textContent = row[4];
                        }
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

class PlayerSummary {
    constructor(player) {
        this.player = player;
        if (playerLifetime[player]){
            this.playerName = player;
        } else if(playerLifetimeArray.find(row => row['PLAYER_ID'].toLowerCase() === player.toLowerCase())){
            this.playerName = playerLifetimeArray.find(row => row['PLAYER_ID'].toLowerCase() === player.toLowerCase())['PLAYER_NAME'];
        } else {
            return;
        }
        this.playerData = playerLifetime[this.playerName];
        this.sortOrder = 'desc';
    }

    display() {
        if (!this.playerData) {
            this.displayError("Player not found. Please check the name and try again.");
            return;
        }

        tableContainer.innerHTML = '';
        this.testIds = Object.keys(playerTests.get(this.playerName));

        // Set ranks
        const compareFunction = row => 
            row['PLAYER_NAME'] === this.playerName || 
            row['PLAYER_ID'].toLowerCase() === this.playerName.toLowerCase();

        ['ALL', 'NM', 'NMPZ'].forEach(mode => {
            this.playerData[`RANK_${mode}`] = sortedPlayers[mode.toLowerCase()].findIndex(compareFunction) + 1 || 'N/A';
        });

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

    displayPlayerName() {
        const playerNameLink = this.createLink(
            `https://geoguessr.com/user/${this.playerData['PLAYER_ID']}`,
            this.playerData['PLAYER_NAME'],
            { color: 'inherit', textDecoration: 'none', target: '_blank' }
        );
        pageTitle.innerHTML = '';
        pageTitle.classList.remove('russiacord');
        pageTitle.appendChild(playerNameLink);
    }

    createLink(href, text, styles = {}) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        Object.assign(link.style, styles);
        return link;
    }

    
    // Sections
    displaySections() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';

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

            tippy(document.querySelectorAll(".leaderboard-card-total-counted"), {
                content: "Total rank number only includes eligible players",
                placement: 'right',
                followCursor: true
            });
        }
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
            if (card.innerHTML === '') return;
            section.appendChild(card);
            cardCount++;
        });
        if (cardCount === 0) return null;

        return section;
    }

    getSummaryData() {
        return ['ALL', 'NM', 'NMPZ'].map(mode => ({
            type: 'summary',
            name: mode === 'ALL' ? 'ALL-TIME' : mode,
            rank: this.playerData[`RANK_${mode}`],
            mode: mode,
            accuracy: this.playerData[`${mode === 'ALL' ? 'OVERALL' : mode}_ACCURACY`],
            total: playerLifetimeArray.length,
            totalCounted: sortedPlayers[mode.toLowerCase()].length
        }));
    }

    getImprovementData() {
        const testData = Object.entries(playerTests.get(this.playerName))
            .map(([testId, data]) => {
                const testInfo = PRECOMPUTE.tests[testId];
                return {
                    testId,
                    accuracy: parseFloat(data[6]),
                    date: new Date(testInfo.year, this.getMonthNumber(testInfo.month)),
                    mode: data[7],
                    time: data[23]
                };
            })
            .sort((a, b) => b.date - a.date);
    
        if (testData.length === 0) {
            return [];
        }
    
        const getImprovementForMode = (modeData) => {
            if (modeData.length < 2) return 0;
            return modeData[modeData.length - 1].accuracy - modeData[0].accuracy;
        };
    
        const getRecentImprovementForMode = (modeData, count) => {
            const recentTests = modeData.slice(-count);
            return recentTests.length > 1
                ? recentTests[recentTests.length - 1].accuracy - recentTests[0].accuracy
                : 0;
        };
    
        const totalTests = testData.length;
        const firstTest = testData[testData.length - 1];
        const lastTest = testData[0];
    
        const playerMostRecentTest = testData[0];
        const mostRecentMode = playerMostRecentTest.mode === 'NMPZ' && playerMostRecentTest.time === '10' ? 'NMPZ10' : playerMostRecentTest.mode;
    
        const modeData = testData.filter(test =>
            (mostRecentMode === 'NMPZ10' && test.mode === 'NMPZ' && test.time === '10') ||
            (mostRecentMode !== 'NMPZ10' && test.mode === mostRecentMode)
        ).sort((a, b) => a.date - b.date);
    
        const improvements = [
            { type: 'improvement', name: 'TOTAL TESTS', value: totalTests, isPercentage: false },
            { type: 'improvement', name: 'FIRST TEST', value: `${PRECOMPUTE.tests[firstTest.testId].month} ${PRECOMPUTE.tests[firstTest.testId].year}`, isPercentage: false },
            { type: 'improvement', name: 'LATEST TEST', value: `${PRECOMPUTE.tests[lastTest.testId].month} ${PRECOMPUTE.tests[lastTest.testId].year}`, isPercentage: false }
        ];
    
        if (modeData.length > 0) {
            improvements.push(
                { type: 'improvement', name: 'OVERALL IMPROVEMENT', value: getImprovementForMode(modeData), isPercentage: true },
                { type: 'improvement', name: 'RECENT IMPROVEMENT', value: getRecentImprovementForMode(modeData, 3), isPercentage: true },
                { type: 'improvement', name: 'RECENT IMPROVEMENT (5)', value: getRecentImprovementForMode(modeData, 5), isPercentage: true }
            );
        }
    
        return improvements;
    }

    getCardContent(data) {
        if (data.type === 'summary') {
            const { gradeLetter, adjustedPercentage } = this.calculateGrade(data.accuracy, data.mode);
            return `
                <h3>${data.name}</h3>
                <p>RANK: ${data.rank} / <span class='leaderboard-card-total-counted'>${data.totalCounted}</span></p>
                <p>ACCURACY: ${(data.accuracy * 100).toFixed(2)}%</p>
                <div class="grade-container">
                    <div class="grade grade-${gradeLetter.replace('+','-plus')}">${gradeLetter}</div>
                    <div class="adjusted-percentage grade-${gradeLetter.replace('+','-plus')}">${adjustedPercentage.toFixed(2)}%</div>
                </div>
            `;
        } else if (data.type === 'improvement') {
            if (data.value == null || data.value == '') return '';
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

    calculateGrade(number, mode) {
        let max = sortedPlayers[mode.toLowerCase()][0][mode === 'ALL' ? 'OVERALL_ACCURACY' : `${mode}_ACCURACY`];

        const percent = 1 - (max - number);
        const adjustedPercentage = percent * 100;
        const grades = [
            { threshold: 0.98, grade: 'S' },
            { threshold: 0.94, grade: 'A+' },
            { threshold: 0.9, grade: 'A' },
            { threshold: 0.85, grade: 'B+' },
            { threshold: 0.8, grade: 'B' },
            { threshold: 0.75, grade: 'C+' },
            { threshold: 0.7, grade: 'C' },
            { threshold: 0.6, grade: 'D+' },
            { threshold: 0.5, grade: 'D' },
        ];
        const gradeLetter = grades.find(g => percent >= g.threshold)?.grade || 'F';
        return { gradeLetter, adjustedPercentage };
    }

    // Statistics
    displayStatistics() {
        const tableHTML = document.createElement('table');
        tableHTML.id = 'playerSummaryTable';

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

        let tableContent = '';

        sections.forEach((section, sectionIndex) => {
            if (sectionIndex > 0) {
                tableContent += '<tr style="height: 20px;"></tr>';
            }

            tableContent += `
                <tr class="summary-subsection">
                    <th>${section.title}</th>
                    <th>All-time</th>
                    <th>NM</th>
                    <th>NMPZ</th>
                </tr>
            `;

            section.stats.forEach(([statName, allTimeKey, nmKey, nmpzKey]) => {
                const formatValue = (key) => {
                    let value = this.playerData[key];
                    if(!value) return '-';
                    if (key.includes('ACCURACY') || key.includes('RATE')) {
                        return `${(parseFloat(value) * 100).toFixed(2)}%`;
                    } else if (key.includes('SCORE')) {
                        return Math.round(parseFloat(value));
                    }
                    return value;
                };

                tableContent += `
                    <tr>
                        <td>${statName}</td>
                        <td>${formatValue(allTimeKey)}</td>
                        <td>${formatValue(nmKey)}</td>
                        <td>${formatValue(nmpzKey)}</td>
                    </tr>
                `;
            });
        });

        tableHTML.innerHTML = tableContent;
        tableContainer.appendChild(tableHTML);
    }

    // Unplayed seeds
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
    
    populateUnplayedSeedsTable(seeds, tableBody) {
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

    displayTestSearch() {
        const testSearchContainer = document.createElement('div');
        testSearchContainer.className = 'test-search-container';
        testSearchContainer.style.marginTop = '30px';

        const title = document.createElement('h2');
        title.textContent = 'Find test';
        title.className = 'leaderboard-title';

        const dropdownContainer = document.createElement('div');
        dropdownContainer.style.display = 'flex';
        dropdownContainer.style.justifyContent = 'center';
        dropdownContainer.style.marginBottom = '10px';

        const dropdown = document.createElement('select');
        dropdown.addEventListener('wheel', function(event) {
            event.preventDefault();
    
            const direction = event.deltaY > 0 ? 1 : -1;
            const currentIndex = this.selectedIndex;
            const newIndex = Math.max(1, Math.min(currentIndex + direction, this.options.length - 1));
    
            if (newIndex !== currentIndex) {
                this.selectedIndex = newIndex;
                this.dispatchEvent(new Event('change'));
            }
        });
        dropdown.appendChild(new Option('Show none', 'shownone'));

        this.testIds
            .sort((a, b) => PRECOMPUTE['tests'][a].order - PRECOMPUTE['tests'][b].order)
            .forEach(testId => {
                const test = PRECOMPUTE['tests'][testId];
                dropdown.appendChild(new Option(`${test.month} ${test.year}`, testId));
            });

        dropdownContainer.appendChild(dropdown);

        const resultContainer = document.createElement('div');
        resultContainer.id = 'testResultContainer';

        testSearchContainer.appendChild(title);
        testSearchContainer.appendChild(dropdownContainer);
        testSearchContainer.appendChild(resultContainer);

        tableContainer.appendChild(testSearchContainer);
        this.searchTest(dropdown.value);

        dropdown.addEventListener('change', (e) => {
            this.searchTest(dropdown.value);
        });
    }

    async searchTest(testName) {
        const resultContainer = document.getElementById('testResultContainer');
        resultContainer.innerHTML = 'Searching...';
        if (testName === 'shownone') {
            resultContainer.innerHTML = '';
            return;
        } else document.querySelector(".test-search-container select").classList.remove('show-none');

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

    async fetchTestData(testId) {
        const testData = playerTests.get(this.playerName)[testId];
        const testName = PRECOMPUTE.tests[testId].month + ' ' + PRECOMPUTE.tests[testId].year;
        if(!testData) return null;

        const overallTestData = tests.get(testId)[0];

        return {
            testName: testName,
            accuracy: parseFloat(testData[6]),
            averageAccuracy: parseFloat(overallTestData[5]),
            rank: parseInt(testData[11]),
            totalParticipants: parseInt(overallTestData[4]),
            hasAccurateRank: parseInt(testData[4]) >= parseInt(testData[5]) * 0.5,
            gamesPlayed: parseInt(testData[4]),
            totalSeeds: parseInt(testData[5]),
            medianScore: parseFloat(testData[13]),
            stdev: parseFloat(testData[8]),
            overallMedian: parseFloat(overallTestData[8]),
            overallStdev: parseFloat(overallTestData[6])
        };
    }

    displayTestResults(testData) {
        const resultContainer = document.getElementById('testResultContainer');
        resultContainer.innerHTML = '';

        const table = document.createElement('table');
        table.id = 'testResultTable';

        const playerScoreColor = this.getScoreColor(testData.accuracy * 100);
        const playerRankColor = this.getRankColor(testData.rank, testData.totalParticipants);

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Statistic</th>
                    <th>${this.playerData['PLAYER_NAME']}</th>
                    <th>Overall</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Accuracy</td>
                    <td style="color: ${playerScoreColor}">${(testData.accuracy * 100).toFixed(2)}%</td>
                    <td>${(testData.averageAccuracy * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>Rank</td>
                    <td style="color: ${testData.hasAccurateRank ? playerRankColor : 'inherit'}">
                        <span id="playerRank">${testData.hasAccurateRank ? testData.rank : '-'}</span>
                    </td>
                    <td>${testData.totalParticipants}</td>
                </tr>
                <tr>
                    <td>Games played</td>
                    <td>${testData.gamesPlayed}</td>
                    <td>${testData.totalSeeds}</td>
                </tr>
                <tr>
                    <td>Median score</td>
                    <td>${testData.medianScore}</td>
                    <td>${testData.overallMedian}</td>
                </tr>
                <tr>
                    <td>Standard deviation</td>
                    <td>${Math.round(testData.stdev)}</td>
                    <td>${Math.round(testData.overallStdev)}</td>
                </tr>
            </tbody>
        `;

        resultContainer.appendChild(table);

        if (!testData.hasAccurateRank) {
            tippy('#playerRank', {
                content: 'Not enough games played',
                placement: 'right'
            });
        }
    }

    getScoreColor(score) {
        if (score >= 95) return 'gold';
        if (score >= 90) return '#00ff00';
        if (score >= 85) return '#40ff00';
        if (score >= 80) return '#80ff00';
        if (score >= 75) return '#ffff00';
        if (score >= 70) return '#ffc000';
        if (score >= 65) return '#ff8000';
        return '#ff0000';
    }

    getRankColor(rank, total) {
        const percentile = (total - rank + 1) / total * 100;
        if (percentile >= 99) return 'gold';
        if (percentile >= 95) return '#00ff00';
        if (percentile >= 90) return '#40ff00';
        if (percentile >= 80) return '#80ff00';
        if (percentile >= 70) return '#ffff00';
        if (percentile >= 60) return '#ffc000';
        if (percentile >= 50) return '#ff8000';
        return '#ff0000';
    }

    getMonthNumber(monthName) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(monthName);
    }

}

class TestSummary {
    constructor(testId) {
        this.testId = testId;
        this.testData = PRECOMPUTE.tests[testId];
        this.overallTestData = tests.get(testId)[0];
        this.testDetails = this.getTestDetails();
    }

    getTestDetails() {
        const seedData = Array.from(seedsMap.values()).find(seed => seed.TEST_ID === this.testId);
        return {
            map: seedData ? seedData.SEED_MAP : 'N/A',
            mode: seedData ? seedData.SEED_MODE : 'N/A',
            time: seedData ? seedData.SEED_TIME : 'N/A',
            seedCount: this.overallTestData[9]
        };
    }

    displayTitle() {
        pageTitle.innerHTML = this.testData.month + ' ' + this.testData.year;
        
        if (this.testDetails) {
            const detailsBox = document.createElement('div');
            detailsBox.className = 'test-details';
            detailsBox.innerHTML = `
                <span>${this.testDetails.map}</span>
                <span>${this.testDetails.mode}</span>
                <span>${this.testDetails.time}s</span> |
                <span>${this.testDetails.seedCount} seeds</span> |
                <span>#${this.testData.order}</span>
            `;
            pageTitle.appendChild(detailsBox);
        }
    }

    displayOverallStats() {
        const statsTable = document.createElement('table');
        statsTable.classList.add('test-summary-table');
        statsTable.innerHTML = `
            <thead>
                <tr>
                    <th colspan="2">Overall Statistics</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Average accuracy</td>
                    <td>${(parseFloat(this.overallTestData[5]) * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>Median round score</td>
                    <td>${Math.round(parseFloat(this.overallTestData[8]))}</td>
                </tr>
                <tr>
                    <td>Average standard deviation</td>
                    <td>${Math.round(parseFloat(this.overallTestData[6]))}</td>
                </tr>
            </tbody>
        `;
        tableContainer.appendChild(statsTable);
    }

    display() {
        tableContainer.innerHTML = '';
        this.displayTitle();
        this.displayOverallStats();
        this.displayCustomTable('Accuracy', this.getAccuracyConfig());
        this.displayCustomTable('Median round score', this.getMedianScoreConfig());
        this.displayCustomTable('Consistency', this.getConsistencyConfig());
        this.displayCustomTable('Improvement', this.getImprovementConfig());
        this.displayCustomTable('Top finishes', this.getFinishes());
        // this.displayCustomTable('Hedge', this.getHedgeConfig());
    }

    displayCustomTable(title, config) {
        const section = document.createElement('div');
        section.classList.add('top-section');

        const sectionTitle = document.createElement('h2');
        sectionTitle.textContent = title;
        sectionTitle.classList.add('top-section-title');
        section.appendChild(sectionTitle);

        const table = document.createElement('table');
        table.classList.add('test-summary-table');

        const headerRow = table.insertRow();
        config.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.header;
            headerRow.appendChild(th);
        });

        const data = this.getTableData(config);
        if(data.length > 0) {
            data.forEach(rowData => {
                const row = table.insertRow();
                config.columns.forEach(column => {
                    const cell = row.insertCell();
                    cell.innerHTML = column.cellContent(rowData);
                });
            });
 
            section.appendChild(table);
            tableContainer.appendChild(section);
        }
    }

    getTableData(config) {
        const minimumSeedsRequired = Math.floor(this.testDetails.seedCount / 2);
        
        let eligiblePlayers = Array.from(playerTests.entries())
            .filter(([, tests]) => {
                const playerTestData = tests[this.testId];
                return playerTestData && parseInt(playerTestData[4]) >= minimumSeedsRequired;
            })
            .map(([player, tests]) => ({
                player,
                playerId: tests[this.testId][0],
                ...config.dataExtractor(tests[this.testId])
            }))
            .filter(config.dataFilter || (() => true))
            .sort(config.dataSorter);

        return eligiblePlayers.slice(0, config.limit || 10);
    }

    getAccuracyConfig() {
        return {
            columns: [
                { header: 'Player', cellContent: row => `<a href="https://geoguessr.com/user/${row.playerId}" target="_blank">${row.player}</a>` },
                { header: 'Accuracy', cellContent: row => `${(row.accuracy * 100).toFixed(2)}%` },
                { header: 'Seeds Played', cellContent: row => row.seedsPlayed }
            ],
            dataExtractor: (testData) => ({
                accuracy: parseFloat(testData[6]),
                seedsPlayed: parseInt(testData[4])
            }),
            dataSorter: (a, b) => b.accuracy - a.accuracy
        };
    }

    getMedianScoreConfig() {
        return {
            columns: [
                { header: 'Player', cellContent: row => `<a href="https://geoguessr.com/user/${row.playerId}" target="_blank">${row.player}</a>` },
                { header: 'Median Score', cellContent: row => Math.round(row.medianScore) },
                { header: 'Seeds Played', cellContent: row => row.seedsPlayed }
            ],
            dataExtractor: (testData) => ({
                medianScore: parseFloat(testData[13]),
                seedsPlayed: parseInt(testData[4])
            }),
            dataSorter: (a, b) => b.medianScore - a.medianScore
        };
    }

    getConsistencyConfig() {
        return {
            columns: [
                { header: 'Player', cellContent: row => `<a href="https://geoguessr.com/user/${row.playerId}" target="_blank">${row.player}</a>` },
                { header: 'Standard Deviation', cellContent: row => Math.round(row.standardDeviation) },
                { header: 'Seeds Played', cellContent: row => row.seedsPlayed }
            ],
            dataExtractor: (testData) => ({
                standardDeviation: parseFloat(testData[8]),
                seedsPlayed: parseInt(testData[4])
            }),
            dataSorter: (a, b) => a.standardDeviation - b.standardDeviation
        };
    }

    getImprovementConfig() {
        return {
            columns: [
                { header: 'Player', cellContent: row => `<a href="https://geoguessr.com/user/${row.playerId}" target="_blank">${row.player}</a>` },
                { header: 'Improvement', cellContent: row => `${(row.improvement * 100).toFixed(2)}%` },
                { header: 'Comparing to', cellContent: row => `${row.pastSeed}`}
            ],
            dataExtractor: (testData) => {
                const pastTestId = testData[14];
                let pastSeed = 'Unknown';
                
                if (pastTestId && PRECOMPUTE['tests'][pastTestId]) {
                    pastSeed = PRECOMPUTE['tests'][pastTestId]['month'] + ' ' + PRECOMPUTE['tests'][pastTestId]['year'];
                }
    
                return {
                    improvement: parseFloat(testData[16]),
                    seedsPlayed: parseInt(testData[4]),
                    pastSeed: pastSeed
                };
            },
            dataSorter: (a, b) => b.improvement - a.improvement,
            dataFilter: row => row.improvement > 0//TODO: Add green up arrow?
        };
    }

    getFinishes() {
        return {
            columns: [
                { header: 'Player', cellContent: row => `<a href="https://geoguessr.com/user/${row.playerId}" target="_blank">${row.player}</a>` },
                { header: 'Top Finishes', cellContent: row => row.topFinishes },
                { header: 'Top 3 Finishes', cellContent: row => row.top3Finishes },
            ],
            dataExtractor: (testData) => ({
                topFinishes: parseFloat(testData[9]),
                top3Finishes: parseFloat(testData[10]),
                seedsPlayed: parseInt(testData[4])
            }),
            dataSorter: (a, b) => b.topFinishes - a.topFinishes || b.top3Finishes - a.top3Finishes,
            dataFilter: row => row.topFinishes > 0 || row.top3Finishes > 0
        };
    }

    // getHedgeConfig() {
    //     return {
    //         columns: [
    //             { header: 'Player', cellContent: row => `<a href="https://geoguessr.com/user/${row.playerId}" target="_blank">${row.player}</a>` },
    //             { header: 'Rounds Above 4k', cellContent: row => Math.round(row.roundsAbove4k) },
    //             { header: 'Seeds Played', cellContent: row => row.seedsPlayed }
    //         ],
    //         dataExtractor: (testData) => ({
    //             roundsAbove4k: parseFloat(testData[14]),
    //             seedsPlayed: parseInt(testData[4])
    //         }),
    //         dataSorter: (a, b) => b.roundsAbove4k - a.roundsAbove4k
    //     };
    // }
}

class SubdivisionCharts {
    constructor(tableContainer) {
        this.tableContainer = tableContainer;
        this.subdivisionData = [];
        this.sortOrder = 'highest';
        this.displayCount = 10;
        this.chartsConfig = [
            {
                id: 'average-score-chart',
                title: 'Subdivision average round score',
                dataKey: 'averageScore',
                color: '#6699ff',
                max: 4000
            },
            {
                id: 'area-adjusted-score-chart',
                title: 'Area-adjusted subdivision metric',
                dataKey: 'areaAdjustedScore',
                color: '#66cc99',
                calculateValue: (item) => {
                    const area = SUBDIVISIONS.subdivisions[item.id].area || 1;
                    return item.averageScore * Math.pow(area, 1/10);
                }
            }
        ];
        this.charts = new Map();
    }

    async initialize() {
        this.subdivisionData = await this.fetchSubdivisionData();
        this.createLayout();
        this.initializeCharts();
        this.updateCharts();
    }

    createLayout() {
        this.tableContainer.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.height = '100%';

        const controlsContainer = this.createControlsContainer();
        wrapper.appendChild(controlsContainer);

        this.chartsContainer = document.createElement('div');
        this.chartsContainer.style.display = 'flex';
        this.chartsContainer.style.flexDirection = 'column';
        this.chartsContainer.style.height = 'calc(100vh - 200px)';
        this.chartsContainer.style.overflow = 'hidden';

        this.chartsConfig.forEach(config => {
            const chartContainer = this.createChartContainer(config.id);
            this.chartsContainer.appendChild(chartContainer);
        });

        wrapper.appendChild(this.chartsContainer);
        this.tableContainer.appendChild(wrapper);

        this.updateChartHeights();
    }

    createControlsContainer() {
        const container = document.createElement('div');
        container.className = 'chart-controls';
        container.style.marginBottom = '20px';
        const sortButton = document.createElement('button');
        sortButton.textContent = 'Highest';
        sortButton.className = 'sort-button';
        sortButton.addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'highest' ? 'lowest' : 'highest';
            sortButton.textContent = `${this.sortOrder === 'highest' ? 'Highest' : 'Lowest'}`;
            this.updateCharts();
        });
        container.appendChild(sortButton);
        return container;
    }

    createChartContainer(id) {
        const container = document.createElement('div');
        container.id = id;
        container.style.width = '100%';
        container.style.flex = '1';
        return container;
    }

    initializeCharts() {
        this.chartsConfig.forEach(config => {
            const chartContainer = document.getElementById(config.id);
            const chart = echarts.init(chartContainer);
            this.charts.set(config.id, chart);
        });
    }

    updateCharts() {
        this.chartsConfig.forEach(config => {
            const sortedData = this.getSortedData(this.subdivisionData, config);
            this.updateChart(config, sortedData);
        });
    }

    getSortedData(data, config) {
        const processedData = data.map(item => ({
            ...item,
            [config.dataKey]: config.calculateValue ? Math.round(config.calculateValue(item)) : item[config.dataKey]
        }));

        return [...processedData]
            .sort((a, b) => this.sortOrder === 'highest' ? b[config.dataKey] - a[config.dataKey] : a[config.dataKey] - b[config.dataKey])
            .slice(0, this.displayCount)
            .reverse();
    }

    updateChart(config, data) {
        const chart = this.charts.get(config.id);
        const isMobile = window.innerWidth <= 768;

        const option = {
            title: {
                text: config.title,
                left: 'center',
                top: 10,
                textStyle: { 
                    color: '#e0e0e0',
                    fontSize: isMobile ? 18 : 24,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    let dataIndex = params[0].dataIndex;
                    let item = data[dataIndex];
                    return `<strong>${item.name}</strong><br/>${config.title}: ${item[config.dataKey]}`;
                },
                confine: true
            },
            grid: {
                left: '5%',
                right: '10%',
                top: 60,
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                max: config.max ? config.max : Math.round((data.map(item => item[config.dataKey]).reduce((a, b) => Math.max(a, b)) * 1.25) / 3000) * 3000,
                axisLabel: { color: '#e0e0e0' }
            },
            yAxis: {
                type: 'category',
                data: data.map(item => isMobile ? item.iso2 : item.name),
                axisLabel: { color: '#e0e0e0' }
            },
            series: [{
                name: config.title,
                type: 'bar',
                data: data.map(item => item[config.dataKey]),
                itemStyle: { color: config.color },
                animationDuration: 1000,
                animationEasing: 'cubicInOut',
                animationDelay: (idx) => idx * 100
            }],
            backgroundColor: 'rgba(0,0,0,0)'
        };
        chart.setOption(option, true);
    }

    updateChartHeights() {
        const totalHeight = this.chartsContainer.clientHeight;
        const chartHeight = totalHeight / this.chartsConfig.length;

        this.chartsConfig.forEach(config => {
            const chartContainer = document.getElementById(config.id);
            chartContainer.style.height = `${chartHeight}px`;
        });

        this.charts.forEach(chart => {
            chart.resize();

            const option = chart.getOption();
            option.xAxis[0].axisLabel.fontSize = '2.5vw';
            option.xAxis[0].nameTextStyle.fontSize = '3vw';
            option.yAxis[0].axisLabel.fontSize = '2.5vw';
            option.series[0].label.fontSize = '2.5vw';
            chart.setOption(option);
        });
    }

    async fetchSubdivisionData() {
        try {
            const csvResponse = await fetch('./static/csv/views/SUBDIVISION_SUMMARY.csv')
            const csvText = await csvResponse.text();
           
            const rows = csvText.split('\n').slice(1);
            return rows.map(row => {
                const [id, occurrences, rounds, uniquePlayers, averageScore] = row.split(',');
                const subdiv = SUBDIVISIONS['subdivisions'][id];
                if (!subdiv) return;
                return {
                    id,
                    name: subdiv.name,
                    iso2: subdiv.iso2,
                    averageScore: Math.round(parseFloat(averageScore)),
                    rounds: parseInt(rounds)
                };
            }).filter(Boolean);
        } catch (error) {
            console.error('Error fetching subdivision data:', error);
            return [];
        }
    }
}

// Unique pages
function initializePlayerSummary() {
    const mySummaryTab = document.getElementById('my-summary');
    const playerNameInput = document.getElementById('playerNameInput');
    const searchPlayerButton = document.getElementById('searchPlayerButton');

    mySummaryTab.addEventListener('click', (e) => {
        hideContainers(['playerSearchContainer', 'tableContainer']);
        document.querySelectorAll('.tab, .submenu-item').forEach(t => t.classList.remove('active'));
        tableContainer.innerHTML = '';
        pageTitle.innerHTML = '';
        pageTitle.classList.remove('russiacord');
        showContainer('playerSearchContainer')
        showContainer('tableContainer');
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

function initializeTestSummary() {
    const testSummaryTab = document.getElementById('test-summary');
    const testSelect = document.getElementById('testSelect');

    testSummaryTab.addEventListener('click', (e) => {
        hideContainers(['testSelectContainer', 'tableContainer']);
        tableContainer.innerHTML = '';
        pageTitle.innerHTML = '';
        pageTitle.classList.remove('russiacord');
        showContainer('testSelectContainer');
        showContainer('tableContainer');

        testSelect.innerHTML = '<option value="shownone">Select a test</option>';

        Array.from(tests.keys())
            .sort((a, b) => PRECOMPUTE['tests'][b].order - PRECOMPUTE['tests'][a].order)
            .forEach(testId => {
                const test = PRECOMPUTE['tests'][testId];
                testSelect.appendChild(new Option(`${test.month} ${test.year}`, testId));
            });

        e.stopPropagation();
    });

    testSelect.addEventListener('change', (e) => {
        const selectedTestId = e.target.value;
        if (selectedTestId === 'shownone') {
            pageTitle.innerHTML = '';
            tableContainer.innerHTML = '';
            return;
        }
        else if (selectedTestId) {
            const testSummary = new TestSummary(selectedTestId);
            testSummary.display();
        }
    });

    testSelect.addEventListener('wheel', function(event) {
        event.preventDefault();

        const direction = event.deltaY > 0 ? 1 : -1;
        const currentIndex = this.selectedIndex;
        const newIndex = Math.max(1, Math.min(currentIndex + direction, this.options.length - 1));

        if (newIndex !== currentIndex) {
            this.selectedIndex = newIndex;
            this.dispatchEvent(new Event('change'));
        }
    });
}

function initializeMisc() {
    const miscTab = document.getElementById('misc');
    miscTab.addEventListener('click', async (e) => {
        hideContainers('tableContainer');
        tableContainer.innerHTML = '';
        pageTitle.innerHTML = 'Miscellaneous';
        pageTitle.classList.remove('russiacord');
        showContainer('tableContainer');

        const subdivisionCharts = new SubdivisionCharts(tableContainer);
        await subdivisionCharts.initialize();

        window.addEventListener('resize', () => {
            subdivisionCharts.updateChartHeights();
        });

        e.stopPropagation();
    });
}

function initializeAbout() {
    const aboutTab = document.getElementById('about');

    aboutTab.addEventListener('click', (e) => {
        hideContainers('aboutContainer');
        document.querySelectorAll('.tab, .submenu-item').forEach(t => t.classList.remove('active'));
        tableContainer.innerHTML = '';
        pageTitle.innerHTML = 'About';
        pageTitle.classList.remove('russiacord');
        showContainer('aboutContainer');
        
        e.stopPropagation();
    });
}

async function displayLeaderboard(container, activeId, dataFiles) {
    hideContainers('tableContainer')
    tableContainer.innerHTML = '';

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
        let hasHeader = true;

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        pageTitle.classList.add('russiacord');

        switch (activeId) {
            case 'player-nmpz':
            case 'player-nm':
            case 'player-all':
                mode = activeId.split('-')[1];
                pageTitle.textContent = mode === 'all' ? 'All-time' : mode.toUpperCase();
                
                const isAdjusted = file.includes('ADJ');
                leaderboard = new AccuracyLeaderboard(mode, isAdjusted);
                break;
            case 'player-hedge':
                leaderboard = new StreakLeaderboard();
                pageTitle.textContent = 'Hedge';
                break;
            case 'player-games':
            case 'player-rounds':
                mode = activeId.split('-')[1];
                leaderboard = new AggregateLeaderboard(mode);
                pageTitle.textContent = mode === 'rounds' ? 'Rounds' : 'Games';
                break;
            case 'high-scores':
                hasHeader = false;
                leaderboard = new HighScoresLeaderboard();
                pageTitle.textContent = "High scores";
                break;
            case 'tests':
                hasHeader = false;
                mode = file[0][0].split('_')[2] || 'all';
                leaderboard = new TestsLeaderboard(mode);
                pageTitle.textContent = "Tests";
                break;
            default:
                console.error(`Unknown activeId: ${activeId}`);
                return;
        }

        tableWrapper.appendChild(leaderboard.titleElement);
        tableWrapper.appendChild(leaderboard.table);
        container.appendChild(tableWrapper);

        await leaderboard.display(file, hasHeader);

        requestAnimationFrame(() => {
            tableWrapper.classList.add('visible');
        });
    }
}

// Main
document.addEventListener('DOMContentLoaded', async () => {
    await initializeData();
    initializeTabs();
    initializeSubmenuItems();
    initializePlayerSummary();
    initializeTestSummary();
    initializeMisc();
    initializeAbout();

    origMenu = document.querySelector('#player-all');
    await displayLeaderboard(tableContainer, origMenu.id, origMenu.getAttribute('data-file'));
});
