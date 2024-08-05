let PRECOMPUTE;
const tableContainer = document.getElementById('tableContainer');
const pageTitle = document.getElementById('pageTitle');

const MODES = {
    MIN_THRESHOLD: 1/3,
    LIMIT: 10,
    display(table, data, mode, titleElement) {
            data = data.slice(1)
            .filter(row => parseInt(row[4]) >= PRECOMPUTE['seedCount'][mode] * MODES.MIN_THRESHOLD)
            .sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
        
        
        titleElement.innerHTML = 'Accuracy leaderboard'
        const headers = ['Player name', 'Accuracy', 'Games played'];
        const tr = table.insertRow();
        tr.classList.add('header-row-'+mode);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.classList.add('header-'+mode);
            th.textContent = header;
            tr.appendChild(th);
        });

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
    HEADERS: ['Player name', 'Streak length', 'Streak start', 'Streak end'],
    display(table, data, titleElement) {
        data = data.slice(1)
            .sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));
        pageTitle.innerHTML = `Hedge`;
        titleElement.innerHTML = 'Streak leaderboard';

        const headers = HEDGE.HEADERS;
        const tr = table.insertRow();
        tr.classList.add('header-row-hedge');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.classList.add('header-hedge');
            th.textContent = header;
            tr.appendChild(th);
        });

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
        const tr = table.insertRow();
        tr.classList.add('header-row-aggr'+mode);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.classList.add('header-aggr'+mode);
            th.textContent = header;
            tr.appendChild(th);
        });

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
    HEADERS: ['Player name', 'Score', 'Game'],
    display(table, data) {
        data = data.slice(1)
            .sort((a, b) => parseFloat(b[10]) - parseFloat(a[10]));
        pageTitle.innerHTML = `Highest scoring games`;

        const headers = HIGH_SCORES.HEADERS;
        const tr = table.insertRow();
        tr.classList.add('header-row-high-scores');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.classList.add('header-high-scores');
            th.textContent = header;
            tr.appendChild(th);
        });

        data.slice(0, HIGH_SCORES.LIMIT).forEach((row, index) => {
            const tr = table.insertRow();
            [3, 10, 4].forEach((colIndex, cellIndex) => {
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

function loadCSV(file) {
    return fetch(`./static/csv/views/${file}`)
        .then(response => response.text())
        .then(csv => {
            return csv.split('\n').map(row => row.split(','));
        })
        .catch(error => console.error('Error fetching CSV:', error));
}

function displayCSV(data, table, titleElement, activeId, fileIndex) {
    table.innerHTML = '';
    titleElement.innerHTML = '';

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
        case 'player-hedge':
            HEDGE.display(table, data, titleElement);
            break;
        default:
            DEFAULT.display(table, data, titleElement);
    }
}


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

    // Close all tabs when clicking outside
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
        
        // Create and display each CSV in its own table with a title
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

function mySummary() {
    const mySummaryTab = document.getElementById('my-summary');
    const playerSearchContainer = document.getElementById('playerSearchContainer');
    const playerNameInput = document.getElementById('playerNameInput');
    const searchPlayerButton = document.getElementById('searchPlayerButton');

    mySummaryTab.addEventListener('click', (e) => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.submenu-item').forEach(t => t.classList.remove('active'));
        tableContainer.innerHTML = '';
        pageTitle.innerHTML = '';
        playerSearchContainer.style.display = 'block';
        e.stopPropagation();
    });

    searchPlayerButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            fetchPlayerStats(playerName);
        }
    });

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPlayerButton.click();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    global().then(() => {
        document.querySelector("#player-lifetime").click(); //default menu
    });
    initializeTabs();
    mySummary();
});