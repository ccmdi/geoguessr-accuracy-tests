async function fetchPlayerStats(playerName) {
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = '<p>Loading player stats...</p>';
    try {
        const playerLifetime = await loadCSV('PLAYER_LIFETIME_ALL_MODES.csv');
        const sortedPlayerLifetime = playerLifetime.filter(row => parseInt(row[4]) >= PRECOMPUTE['seedCount']['all'] * 1/3).sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
        const sortedPlayerNMLifetime = playerLifetime.filter(row => parseInt(row[10]) >= PRECOMPUTE['seedCount']['nm'] * 1/3).sort((a, b) => parseFloat(b[11]) - parseFloat(a[11]));
        const sortedPlayerNMPZLifetime = playerLifetime.filter(row => parseInt(row[16]) >= PRECOMPUTE['seedCount']['nmpz'] * 1/3).sort((a, b) => parseFloat(b[17]) - parseFloat(a[17]));

        let playerData = playerLifetime.find(row => row[1].toLowerCase() === playerName.toLowerCase());
        if (!playerData) {
            playerData = playerLifetime.find(row => row[0].toLowerCase() === playerName.toLowerCase());
        }
        if (playerData) {
            const playerRankAll = sortedPlayerLifetime.findIndex(row => row[0] === playerData[0]);
            const playerRankNM = sortedPlayerNMLifetime.findIndex(row => row[0] === playerData[0]);
            const playerRankNMPZ = sortedPlayerNMPZLifetime.findIndex(row => row[0] === playerData[0]);
            
            playerData.push(playerRankAll === -1 ? 'N/A' : playerRankAll + 1);
            playerData.push(playerRankNM === -1 ? 'N/A' : playerRankNM + 1);
            playerData.push(playerRankNMPZ === -1 ? 'N/A' : playerRankNMPZ + 1);

            displayPlayerSummary(playerData);
        } else {
            document.getElementById('pageTitle').innerHTML = '';
            tableContainer.innerHTML = '<p>Player not found. Please check the name and try again.</p>';
        }
    } catch (error) {
        console.error('Error fetching player stats:', error);
        tableContainer.innerHTML = '<p>Error fetching player stats. Please try again later.</p>';
    }
}

function displayPlayerSummary(playerData) {
    const tableContainer = document.getElementById('tableContainer');
    const titleElement = document.getElementById('pageTitle');
    
    // Create a link for the player name
    const playerNameLink = document.createElement('a');
    playerNameLink.href = `https://geoguessr.com/user/${playerData[0]}`;
    playerNameLink.textContent = playerData[1];
    playerNameLink.target = '_blank';
    playerNameLink.style.color = 'inherit';  // This keeps the original text color
    playerNameLink.style.textDecoration = 'none';  // This removes the underline
    
    // Clear the title element and append the link
    titleElement.innerHTML = '';
    titleElement.appendChild(playerNameLink);

    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'playerSummaryTable';

    const headers = ['Statistic', 'Value'];
    const headerRow = table.insertRow();
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    const stats = [
        ['Games played', playerData[4]],
        ['Rounds played', playerData[3]],
        ['Accuracy', `${(parseFloat(playerData[5]) * 100).toFixed(2)}%`,],
        ['NM accuracy', `${(parseFloat(playerData[11]) * 100).toFixed(2)}%`,],
        ['NMPZ accuracy', `${(parseFloat(playerData[17]) * 100).toFixed(2)}%`,],
        ['Accuracy rank', playerData[20]],
        ['NM accuracy rank', playerData[21]],
        ['NMPZ accuracy rank', playerData[22]],
        ['Highest hedge streak', playerData[6]],
        ['Average hedge streak', playerData[7]]
    ];

    stats.forEach(([statName, value]) => {
        const row = table.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.textContent = statName;
        cell2.textContent = value;
    });

    tableContainer.appendChild(table);
}