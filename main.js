
const MODES = {
    MIN_THRESHOLD: 1/3,
    LIMIT: 10,
    display(table, data, mode, titleElement) {
            data = data.slice(1)
            .filter(row => parseInt(row[4]) >= PRECOMPUTE['seedCount'][mode] * MODES.MIN_THRESHOLD)
            .sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
        
        
        titleElement.innerHTML = 'Accuracy leaderboard'
        const headers = ['Player name', 'Accuracy', 'Games played'];
        createHeaders(table, headers, mode);

        data.slice(0, MODES.LIMIT).forEach((row, index) => {
            const tr = table.insertRow();
            [1, 5, 4].forEach((colIndex, cellIndex) => {
                const td = document.createElement('td');
                switch (colIndex) {
                    case 1:
                        link = document.createElement('a');
                        link.href = "https://geoguessr.com/user/" + row[0];
                        link.textContent = row[1];
                        td.appendChild(link);
                        break;
                    case 5:
                        td.textContent = `${Number(row[colIndex] * 100).toFixed(2)}%`;
                        break;
                    default:
                        td.textContent = row[colIndex];
                }
                tr.appendChild(td);
            });
        });
    },
    displayAdjusted(table, data, mode, titleElement) {
        data = data.slice(1)
                .filter(row => parseInt(row[2]/5) >= PRECOMPUTE['seedCount'][mode] * MODES.MIN_THRESHOLD)
                .sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
    
        let offset = 0;
        if(mode === 'nm') {
            offset = 1;
        } else if (mode === 'nmpz') {
            offset = 2;
        }
    
        titleElement.innerHTML = 'Adjusted accuracy leaderboard'
        
        const headers = ['Player name', 'Adjusted accuracy', 'Adjusted games played'];
        const headerRow = table.insertRow();
        headerRow.classList.add('header-row-adjusted-'+mode);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.classList.add('header-adjusted-'+mode);
            headerRow.appendChild(th);
        });
    
        data.slice(0, MODES.LIMIT).forEach((row, index) => {
            const tr = table.insertRow();
            [1, 5 + (offset * 3), 4 + (offset * 3)].forEach((colIndex, cellIndex) => {
                const td = document.createElement('td');
                switch (colIndex) {
                    case 1:
                        link = document.createElement('a');
                        link.href = "https://geoguessr.com/user/" + row[0];
                        link.textContent = row[1];
                        td.appendChild(link);
                        break;
                    case 4 + (offset * 3):
                        td.textContent = Math.round(row[colIndex]/5);
                        break;
                    case 5 + (offset * 3):
                        td.textContent = `${Number(row[colIndex] * 100).toFixed(2)}%`;
                        break;
                    default:
                        td.textContent = row[colIndex];
                }
                tr.appendChild(td);
            });
        });
    }
}
const HEDGE = {
    LIMIT: 10,
    display(table, data, titleElement) {
        data = data.slice(1)
            .sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));
        pageTitle.innerHTML = `Hedge`;
        titleElement.innerHTML = 'Streak leaderboard';

        createHeaders(table, ['Player name', 'Streak length', 'Streak start', 'Streak end'], 'hedge');

        data.slice(0, HEDGE.LIMIT).forEach((row, index) => {
            const tr = table.insertRow();
            [1, 2, 5, 7].forEach((colIndex, cellIndex) => {
                const td = document.createElement('td');
                let link;

                switch (colIndex) {
                    case 1:
                        link = document.createElement('a');
                        link.href = "https://geoguessr.com/user/" + row[0];
                        link.textContent = row[1];
                        td.appendChild(link);
                        break;
                    case 5:
                    case 7:
                        const dateStr = PRECOMPUTE['tests'][row[colIndex]].month + ' ' + PRECOMPUTE['tests'][row[colIndex]].year;
                        const roundStr = " - "+row[colIndex + 1];
                        link = document.createElement('a');
                        link.href = colIndex == 5 ? row[3] : row[4];
                        link.textContent = dateStr + roundStr;
                        td.appendChild(link);
                        break;
                    default:
                        td.textContent = row[colIndex];
                        break;
                }
                tr.appendChild(td);
            });
        });
    }
}
const AGGR = {
    MIN_THRESHOLD: 1/4,
    LIMIT: 10,
    display(table, data, mode, titleElement) {
        switch(mode){
            case 'rounds':
                pageTitle.innerHTML = `Rounds`;
                titleElement.innerHTML = 'Aggregate leaderboard';
                break;
            case 'games':
                pageTitle.innerHTML = `Games`;
                titleElement.innerHTML = 'Aggregate leaderboard';
                break;
        }
        data = data.slice(1)
            .filter(row => parseInt(row[2]) >= PRECOMPUTE['seedCount']['all'] * AGGR.MIN_THRESHOLD)
            .sort((a, b) => parseFloat(b[4]) - parseFloat(a[4]));

        const headers = mode === 'rounds' ? ['Player name', 'Median round score', 'Rounds played'] : ['Player name', 'Median game score', 'Games played'];
        createHeaders(table, headers, 'aggr'+mode);

        data.slice(0, AGGR.LIMIT).forEach((row, index) => {
            const tr = table.insertRow();
            [1, 4, 2].forEach((colIndex, cellIndex) => {
                const td = document.createElement('td');
                let link;

                switch (colIndex) {
                    case 1:
                        link = document.createElement('a');
                        link.href = "https://geoguessr.com/user/" + row[0];
                        link.textContent = row[1];
                        td.appendChild(link);
                        break;
                    case 4:
                        td.textContent = Math.round(row[colIndex]);
                        break;
                    default:
                        td.textContent = row[colIndex];
                        break;
                }
                tr.appendChild(td);
            });
        });
    }
}
const HIGH_SCORES = {
    LIMIT: 10,
    display(table, data) {
        data = data.slice(1)
            .sort((a, b) => parseFloat(b[9]) - parseFloat(a[9]));
        pageTitle.innerHTML = `High scores`;

        createHeaders(table, ['Player name', 'Score', 'Game'], 'high-scores');
        data.slice(0, HIGH_SCORES.LIMIT).forEach((row, index) => {
            const tr = table.insertRow();
            [3, 9, 4].forEach((colIndex, cellIndex) => {
                const td = document.createElement('td');
                let link;

                switch (colIndex) {
                    case 3:
                        link = document.createElement('a');
                        link.href = "https://geoguessr.com/user/" + row[2];
                        link.textContent = row[3];
                        td.appendChild(link);
                        break;
                    case 4:
                        const dateStr = PRECOMPUTE['tests'][row[colIndex]].month + ' ' + PRECOMPUTE['tests'][row[colIndex]].year;
                        const roundStr = " - "+row[colIndex + 1];
                        link = document.createElement('a');
                        link.href = row[1];
                        link.textContent = dateStr + roundStr;
                        td.appendChild(link);
                        break;
                    default:
                        td.textContent = row[colIndex];
                        break;
                }
                tr.appendChild(td);
            });
        });
    }
}
const TESTS = {
    LIMIT: 10,
    display(table, data) {
        data = data.slice(1)
            .filter((row) => parseInt(row[4]) >= parseInt(row[5]) * 1/2)
            .sort((a, b) => parseFloat(b[6]) - parseFloat(a[6]));
        pageTitle.innerHTML = `Tests`;

        createHeaders(table, ['Player name', 'Accuracy', 'Test date', 'Test games played'], 'test');
        data.slice(0, TESTS.LIMIT).forEach((row, index) => {
            const tr = table.insertRow();
            [2, 6, 0, 4].forEach((colIndex, cellIndex) => {
                const td = document.createElement('td');
                let link;

                switch (colIndex) {
                    case 0:
                        const dateStr = PRECOMPUTE['tests'][row[colIndex]].month + ' ' + PRECOMPUTE['tests'][row[colIndex]].year;
                        td.textContent = dateStr;
                        break;
                    case 2:
                        link = document.createElement('a');
                        link.href = "https://geoguessr.com/user/" + row[1];
                        link.textContent = row[2];
                        td.appendChild(link);
                        break;
                    case 6:
                        td.textContent = `${Number(row[colIndex] * 100).toFixed(2)}%`;
                        break;
                    default:
                        td.textContent = row[colIndex];
                        break;
                }
                tr.appendChild(td);
            });
        });
    }
}
const DEFAULT = {
    LIMIT: 10,
    display(table, data) {
        const tr = table.insertRow();
        data[0].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            tr.appendChild(th);
        });

        data.slice(1).forEach(row => {
            const tr = table.insertRow();
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
        });
    }
}


function displayCSV(data, table, titleElement, activeId, fileIndex) {
    table.innerHTML = '';
    titleElement.innerHTML = '';
    pageTitle.classList.add('russiacord');

    switch(activeId) {
        case 'player-nmpz':
            pageTitle.innerHTML = `NMPZ`;
            if (fileIndex === 0) {
                MODES.display(table, data, 'nmpz', titleElement);
            } else if (fileIndex === 1) {
                MODES.displayAdjusted(table, data, 'nmpz', titleElement);
            }
            break;
        case 'player-nm':
            pageTitle.innerHTML = `NM`;
            if (fileIndex === 0) {
                MODES.display(table, data, 'nm', titleElement);
            } else if (fileIndex === 1) {
                MODES.displayAdjusted(table, data, 'nm', titleElement);
            }
            break;
        case 'player-lifetime':
            pageTitle.innerHTML = `All-time`;
            if (fileIndex === 0) {
                MODES.display(table, data, 'all', titleElement);
            } else if (fileIndex === 1) {
                MODES.displayAdjusted(table, data, 'all', titleElement);
            }
            break;
        case 'high-scores':
            HIGH_SCORES.display(table, data, titleElement);
            break;
        case 'player-games':
            AGGR.display(table, data, 'games', titleElement);
            break;
        case 'player-rounds':
            AGGR.display(table, data, 'rounds', titleElement);
            break;
        case 'tests':
            TESTS.display(table, data, titleElement);
            break;
        case 'player-hedge':
            HEDGE.display(table, data, titleElement);
            break;
        default:
            DEFAULT.display(table, data, titleElement);
    }
}


function displayPlayerSummary(playerName) {
    let playerData = playerLifetime[playerName];
    let compareFunction;
    if (!playerData) {
        playerData = playerLifetimeArray.find(row => row['PLAYER_ID'].toLowerCase() === playerName.toLowerCase());
        if (playerData) {
            compareFunction = row => row['PLAYER_ID'].toLowerCase() === playerName.toLowerCase();
        }
    } else {
        compareFunction = row => row['PLAYER_NAME'] === playerName;
    }
    if (playerData) {
        playerData['RANK_ALL'] = sortedPlayerLifetime.findIndex(compareFunction) + 1 || 'N/A';
        playerData['RANK_NM'] = sortedPlayerNMLifetime.findIndex(compareFunction) + 1 || 'N/A';
        playerData['RANK_NMPZ'] = sortedPlayerNMPZLifetime.findIndex(compareFunction) + 1 || 'N/A';
    } else {
        pageTitle.innerHTML = '';
        tableContainer.innerHTML = '<p>Player not found. Please check the name and try again.</p>';
        return;
    }
    
    const playerNameLink = document.createElement('a');
    playerNameLink.href = `https://geoguessr.com/user/${playerData['PLAYER_ID']}`;
    playerNameLink.textContent = playerData['PLAYER_NAME'];
    playerNameLink.target = '_blank';
    playerNameLink.style.color = 'inherit';
    playerNameLink.style.textDecoration = 'none';
   
    pageTitle.innerHTML = '';
    pageTitle.appendChild(playerNameLink);
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'playerSummaryTable';

    if(playerData['RANK_ALL'] !== 'N/A') {
        const leaderboard = createLeaderboard(playerData, playerLifetimeArray.length);
        tableContainer.appendChild(leaderboard);
    }

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
            // Add a gap between sections
            const gapRow = table.insertRow();
            gapRow.style.height = '20px';
        }

        const sectionHeader = table.insertRow();
        sectionHeader.classList.add('summary-subsection');
        ['', 'All-time', 'NM', 'NMPZ'].forEach((header, index) => {
            const th = document.createElement('th');
            if (index === 0) {
                th.textContent = section.title;
            } else {
                th.textContent = header;
            }
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
                let value = playerData[key];
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

    // Add a gap between tables
    const gap = document.createElement('div');
    gap.style.height = '30px';
    tableContainer.appendChild(gap);

    // Create a new table for unplayed seeds
    const unplayedSeedsTable = document.createElement('table');
    unplayedSeedsTable.id = 'unplayedSeedsTable';
    unplayedSeedsTable.style.width = '100%';

    // Add header for unplayed seeds table
    const headerRow = unplayedSeedsTable.insertRow();
    const headerCell = headerRow.insertCell();
    headerCell.classList.add('unplayed-seeds-header');
    headerCell.colSpan = 3;
    headerCell.style.cursor = 'pointer';
    
    const headerText = document.createElement('span');
    headerText.textContent = 'Unplayed Seeds ';
    
    const toggleIcon = document.createElement('span');
    toggleIcon.textContent = '▼';  // Start with down arrow (collapsed)
    toggleIcon.style.float = 'right';
    
    headerCell.appendChild(headerText);
    headerCell.appendChild(toggleIcon);

    const unplayedSeedsBody = document.createElement('tbody');
    unplayedSeedsBody.style.display = 'none';

    const playedSeeds = playerGames.get(playerName) || new Set();

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

    // Add click event to toggle visibility
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


function createLeaderboard(playerData, totalPlayers) {
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.className = 'leaderboard';

    const title = document.createElement('h2');
    title.textContent = 'SUMMARY';
    title.className = 'leaderboard-title';
    leaderboardContainer.appendChild(title);

    const modes = [
        { name: 'ALL-TIME', rank: playerData.RANK_ALL, accuracy: playerData.OVERALL_ACCURACY, total: totalPlayers },
        { name: 'NM', rank: playerData.RANK_NM, accuracy: playerData.NM_ACCURACY, total: totalPlayers },
        { name: 'NMPZ', rank: playerData.RANK_NMPZ, accuracy: playerData.NMPZ_ACCURACY, total: totalPlayers }
    ];

    modes.forEach((mode, index) => {
        if (mode.rank === 'N/A') return;
        const card = document.createElement('div');
        card.className = 'leaderboard-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const gradeLetter = calculateGrade(mode.rank, mode.total);

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

function calculateGrade(rank, total) {
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
