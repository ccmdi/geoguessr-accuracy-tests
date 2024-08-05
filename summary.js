async function fetchPlayerStats(playerName) {
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = '<p>Loading player stats...</p>';

    try {
        const response = await fetch(`./static/csv/views/PLAYER_LIFETIME.csv`);
        const csvText = await response.text();
        const csvData = csvText.split('\n').map(row => row.split(','));

        let playerData = csvData.find(row => row[1].toLowerCase() === playerName.toLowerCase());

        if (!playerData) {
            playerData = csvData.find(row => row[0].toLowerCase() === playerName.toLowerCase());
        }

        if (playerData) {
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
        ['Rounds played', playerData[2]],
        ['Accuracy', `${(parseFloat(playerData[5]) * 100).toFixed(2)}%`],
    ];

    stats.forEach(([statName, value]) => {
        const row = table.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.textContent = statName;
        cell2.textContent = value;
    });

    tableContainer.appendChild(table);

    // Remove the separate profile link since the name is now clickable
}