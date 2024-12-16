
const createTournamentButton = document.getElementById('createTournament');
const scheduleSection = document.getElementById('scheduleSection');
const resultsSection = document.getElementById('resultsSection');
const roundsContainer = document.getElementById('roundsContainer');
const leagueStandings = document.getElementById('leagueStandings').querySelector('tbody');
const topScorersTable = document.getElementById('topScorersTable').querySelector('tbody');

let teams = [];
let rounds = [];
let scorers = {};

createTournamentButton.addEventListener('click', () => {
    const tournamentName = document.getElementById('tournamentName').value;
    const teamCount = parseInt(document.getElementById('teamCount').value);

    if (!tournamentName || isNaN(teamCount) || teamCount < 2) {
        alert('Please provide a valid tournament name and number of teams (minimum 2).');
        return;
    }

    // Generate teams
    teams = Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`);

    // Generate rounds (ensuring each team plays once per round)
    rounds = [];
    const totalRounds = teams.length - 1;
    const half = Math.floor(teams.length / 2);
    const rotatedTeams = [...teams];

    for (let r = 0; r < totalRounds; r++) {
        const roundMatches = [];
        for (let i = 0; i < half; i++) {
            roundMatches.push({
                team1: rotatedTeams[i],
                team2: rotatedTeams[rotatedTeams.length - 1 - i],
                score1: null,
                score2: null,
                goalDetails: {
                    team1: [],
                    team2: []
                },
            });
        }
        rounds.push(roundMatches);

        // Rotate teams (except the first one)
        rotatedTeams.splice(1, 0, rotatedTeams.pop());
    }

    displaySchedule();

    scheduleSection.style.display = 'block';
    resultsSection.style.display = 'block';
});

function displaySchedule() {
    roundsContainer.innerHTML = '';
    rounds.forEach((round, roundIndex) => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('round');

        const roundTitle = document.createElement('div');
        roundTitle.classList.add('round-title');
        roundTitle.textContent = `Round ${roundIndex + 1}`;
        roundDiv.appendChild(roundTitle);

        const table = document.createElement('table');
        const tbody = document.createElement('tbody');
        round.forEach((match, matchIndex) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${match.team1}</td>
                <td>
                    <div class="score-input">
                        <input type="number" placeholder="0" min="0" data-round="${roundIndex}" data-match="${matchIndex}" data-team="1" class="score-input-field">
                    </div>
                    <div class="player-goals" id="goals-team1-${roundIndex}-${matchIndex}"></div>
                </td>
                <td>${match.team2}</td>
                <td>
                    <div class="score-input">
                        <input type="number" placeholder="0" min="0" data-round="${roundIndex}" data-match="${matchIndex}" data-team="2" class="score-input-field">
                    </div>
                    <div class="player-goals" id="goals-team2-${roundIndex}-${matchIndex}"></div>
                </td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        roundDiv.appendChild(table);
        roundsContainer.appendChild(roundDiv);
    });
}

roundsContainer.addEventListener('input', (event) => {
    const input = event.target;
    if (!input.classList.contains('score-input-field')) return;

    const roundIndex = input.dataset.round;
    const matchIndex = input.dataset.match;
    const team = input.dataset.team;
    const value = parseInt(input.value) || 0;

    const match = rounds[roundIndex][matchIndex];
    const goalsContainer = document.getElementById(`goals-team${team}-${roundIndex}-${matchIndex}`);

    if (team === '1') {
        match.score1 = value;
        match.goalDetails.team1 = Array(value).fill('');
    } else {
        match.score2 = value;
        match.goalDetails.team2 = Array(value).fill('');
    }

    goalsContainer.innerHTML = '';
    for (let i = 0; i < value; i++) {
        const inputDiv = document.createElement('div');
        inputDiv.classList.add('player-input');
        inputDiv.innerHTML = `
            <input type="text" placeholder="Enter Player Name" data-round="${roundIndex}" data-match="${matchIndex}" data-team="${team}" data-goal="${i}" class="player-name-input">
        `;
        goalsContainer.appendChild(inputDiv);
    }

    updateStandings();
    updateTopScorers();
});

roundsContainer.addEventListener('change', (event) => {
    const input = event.target;
    if (!input.classList.contains('player-name-input')) return;

    const roundIndex = input.dataset.round;
    const matchIndex = input.dataset.match;
    const team = input.dataset.team;
    const goalIndex = input.dataset.goal;
    const playerName = input.value;

    const match = rounds[roundIndex][matchIndex];
    if (team === '1') {
        match.goalDetails.team1[goalIndex] = playerName;
    } else {
        match.goalDetails.team2[goalIndex] = playerName;
    }

    updateTopScorers();
});

function updateStandings() {
    const standings = teams.map(team => ({
        team,
        points: 0,
        goalDifference: 0,
    }));

    rounds.flat().forEach(match => {
        if (match.score1 !== null && match.score2 !== null) {
            const team1 = standings.find(s => s.team === match.team1);
            const team2 = standings.find(s => s.team === match.team2);

            if (match.score1 > match.score2) {
                team1.points += 3;
            } else if (match.score1 < match.score2) {
                team2.points += 3;
            } else {
                team1.points += 1;
                team2.points += 1;
            }

            team1.goalDifference += match.score1 - match.score2;
            team2.goalDifference += match.score2 - match.score1;
        }
    });

    // Sort standings by points and then goal difference
    standings.sort((a, b) => 
        b.points - a.points || b.goalDifference - a.goalDifference
    );

    // Update standings table
    leagueStandings.innerHTML = '';
    standings.forEach(team => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${team.team}</td>
            <td>${team.points}</td>
            <td>${team.goalDifference}</td>
        `;
        leagueStandings.appendChild(row);
    });
}

function updateTopScorers() {
    scorers = {}; // Reset scorers
    rounds.flat().forEach(match => {                match.goalDetails.team1.forEach(player => {
            if (player) scorers[player] = (scorers[player] || 0) + 1;
        });

        match.goalDetails.team2.forEach(player => {
            if (player) scorers[player] = (scorers[player] || 0) + 1;
        });
    });

    // Convert scorers object to an array and sort by goals
    const topScorers = Object.entries(scorers)
        .map(([player, goals]) => ({ player, goals }))
        .sort((a, b) => b.goals - a.goals);

    // Update top scorers table
    topScorersTable.innerHTML = '';
    topScorers.forEach(({ player, goals }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player}</td>
            <td>${goals}</td>
        `;
        topScorersTable.appendChild(row);
    });
}
