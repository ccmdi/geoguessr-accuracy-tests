let PRECOMPUTE;
const MODES = {
    MIN_THRESHOLD: 1/3,
    LIMIT: 15,
    HEADERS: ['Player name', 'Accuracy', 'Games played']
}
const HEDGE = {
    LIMIT: 10,
    HEADERS: ['Player name', 'Streak length', 'Streak start', 'Streak end']
}
const HIGHEST_SCORING_GAMES = {
    LIMIT: 10,
    HEADERS: ['Player name', 'Score', 'Game']
}

async function global() {
    try {
        PRECOMPUTE = await fetch(`./static/json/precomp.json`)
            .then(response => response.text())
            .then(json => {
                return JSON.parse(json);
            });
        
        loadCSV('PLAYER_LIFETIME.csv');

    } catch (error) {
        console.error('Error fetching SEEDS:', error);
    }
}

function loadCSV(file) {
    fetch(`./static/csv/views/${file}`)
        .then(response => response.text())
        .then(csv => {
            const rows = csv.split('\n').map(row => row.split(','));
            displayCSV(file, rows);
        })
        .catch(error => console.error('Error fetching CSV:', error));
}

function displayCSV(file, data) {
    const table = document.getElementById('csvTable');
    const tableTitle = document.getElementById('csvTitle');
    table.innerHTML = '';
    tableTitle.innerHTML = '';

    switch(file) {
        case 'PLAYER_LIFETIME_NMPZ.csv':
            displayLeaderboard(table, data, 'nmpz');
            break;
        case 'PLAYER_LIFETIME_NM.csv':
            displayLeaderboard(table, data, 'nm');
            break;
        case 'PLAYER_LIFETIME.csv':
            displayLeaderboard(table, data, 'all');
            break;
        case 'GAME_SUM.csv':
            displayGames(table, data);
            break;
        case 'PLAYER_HEDGE.csv':
            displayHedge(table, data);
            break;
        default:
            displayDefault(table, data);
    }
}

function displayLeaderboard(table, data, mode) {
    // Sorts and filters data
    data = data.slice(1)
        .filter(row => parseInt(row[4]) >= PRECOMPUTE['seedCount'][mode] / (1/ MODES.MIN_THRESHOLD))
        .sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));

    switch(mode){
        case 'all':
            document.getElementById('csvTitle').innerHTML = `All-time leaderboard`;
            break;
        case 'nm':
            document.getElementById('csvTitle').innerHTML = `NM all-time leaderboard`;
            break;
        case 'nmpz':
            document.getElementById('csvTitle').innerHTML = `NMPZ all-time leaderboard`;
            break;
    }

    const headers = MODES.HEADERS;
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
            if (cellIndex === 0) {  // Apply styling to player names
                if (index === 0) td.classList.add('top-1');
                else if (index === 1) td.classList.add('top-2');
                else if (index === 2) td.classList.add('top-3');
            }
            tr.appendChild(td);
        });
    });
}

function displayHedge(table, data) {
    data = data.slice(1)
        .sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));
    document.getElementById('csvTitle').innerHTML = `Hedge streak leaderboard`;

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
            if (cellIndex === 0) {  // Apply styling to player names
                if (index === 0) td.classList.add('top-1');
                else if (index === 1) td.classList.add('top-2');
                else if (index === 2) td.classList.add('top-3');
            }
            tr.appendChild(td);
        });
    });
}

function displayGames(table, data) {
    data = data.slice(1)
        .sort((a, b) => parseFloat(b[6]) - parseFloat(a[6]));
    document.getElementById('csvTitle').innerHTML = `Highest scoring games`;

    const headers = HIGHEST_SCORING_GAMES.HEADERS;
    const tr = table.insertRow();
    tr.classList.add('header-row-highest-scoring-games');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.classList.add('header-highest-scoring-games');
        th.textContent = header;
        tr.appendChild(th);
    });

    data.slice(0, HIGHEST_SCORING_GAMES.LIMIT).forEach((row, index) => {
        const tr = table.insertRow();
        [3, 6, 4].forEach((colIndex, cellIndex) => {
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
            if (cellIndex === 0) {  // Apply styling to player names
                if (index === 0) td.classList.add('top-1');
                else if (index === 1) td.classList.add('top-2');
                else if (index === 2) td.classList.add('top-3');
            }
            tr.appendChild(td);
        });
    });
}

function displayDefault(table, data) {
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

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            // Close all other tabs
            tabs.forEach(t => {
                if (t !== tab) {
                    t.classList.remove('active');
                }
            });
            
            // Toggle current tab
            this.classList.toggle('active');
            e.stopPropagation();
        });
    });

    // Close all tabs when clicking outside
    document.addEventListener('click', function() {
        tabs.forEach(tab => tab.classList.remove('active'));
    });
}

function closeAllSubmenus() {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
}

document.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.submenu-item').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        const file = item.getAttribute('data-file');
        loadCSV(file);
        
        // Close the submenu after selection
        setTimeout(() => {
            closeAllSubmenus();
        }, 100);  // Short delay to ensure the selection is registered

        e.stopPropagation(); // Prevent the click from closing the submenu immediately
    });
});

document.addEventListener('DOMContentLoaded', () => {
    global();
    initializeTabs();
});