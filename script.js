const API_URL = "https://bilbo-journey.onrender.com";

const locations = {
    "Bag End": { x: 0, y: 0 },
    "Caught by trolls": { x: 0, y: 0 },
    "Rivendell": { x: 0, y: 0 },
    "Misty Mountains (Goblins)": { x: 0, y: 0 },
    "Gollum & The Ring": { x: 0, y: 0 },
    "Rejoin Gandalf & Dwarves": { x: 0, y: 0 },
    "Beorn's Hall": { x: 0, y: 0 },
    "Mirkwood (Gandalf Leaves)": { x: 0, y: 0 },
    "Giant Spiders & Wood Elves": { x: 0, y: 0 },
    "Barrel Escape": { x: 0, y: 0 },
    "Lake Town": { x: 0, y: 0 },
    "The Lonely Mountain": { x: 0, y: 0 }
};

let currentMarker = null;

const map = L.map('map', {
    crs: L.CRS.Simple, 
    minZoom: -3,
    maxZoom: 1
});

const bounds = [[0, 0], [600, 1500]]; 
L.imageOverlay(MAP_IMAGE, bounds).addTo(map);
map.fitBounds(bounds);

async function updateMap() {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // UPDATED STATUS ID TO MATCH HTML
    document.getElementById('statusText').innerText = 
        `🧙‍♂️ Bilbo is at ${data.current_location} (${data.miles_traveled} miles traveled)`;

    const coords = locations[data.current_location];
    
    if (coords) {
        if (currentMarker) map.removeLayer(currentMarker);
        // Dot is hidden for now
    }

    // --- LEVEL XP LOGIC ---
    const currentXP = data.xp;
    document.getElementById('xp-display').innerText = Math.floor(currentXP);

    let level = 1;
    let xpNeededForNext = 100; 

    while (currentXP >= xpNeededForNext) {
        level++;
        xpNeededForNext = (level * level) * 100;
    }

    document.getElementById('level-display').innerText = level;
    document.getElementById('next-level-xp').innerText = xpNeededForNext;

    const previousLevelXP = ((level - 1) * (level - 1)) * 100; 
    const xpInCurrentLevel = currentXP - previousLevelXP;
    const xpRequiredForThisLevel = xpNeededForNext - previousLevelXP;
    const percentToNext = (xpInCurrentLevel / xpRequiredForThisLevel) * 100;
    
    document.getElementById('xp-bar-fill').style.width = `${Math.min(percentToNext, 100)}%`;

    // --- CHECKLIST LOGIC (PLACED IN THE CORRECT SPOT) ---
    const checkboxes = document.querySelectorAll('.stop-check');
    checkboxes.forEach(box => {
        if (box.value === data.current_location) {
            box.checked = true;
            box.disabled = true; 
        }
    });
}

async function walk() {
    const miles = document.getElementById('milesInput').value;
    await fetch(API_URL + '/walk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ miles_walked: parseInt(miles), trip_type: "one_way" })
    });
    updateMap();
}

async function resetJourney() {
    await fetch(API_URL + '/reset'), { method: 'POST' });
    
    // UNCHECK ALL CHECKBOXES
    const checkboxes = document.querySelectorAll('.stop-check');
    checkboxes.forEach(box => {
        box.checked = false;
        box.disabled = false; // Re-enable them so the journey can start fresh
    });

    updateMap();
}

map.setView([300, 800], 0);
updateMap();

// AUTO-WALK LOGIC
let autoWalkInterval = null;

function toggleAutoWalk() {
    const btn = document.getElementById('autoWalkBtn');

    if (autoWalkInterval) {
        clearInterval(autoWalkInterval);
        autoWalkInterval = null;
        btn.innerText = "▶️ Auto-Walk";
        btn.style.background = "#ffc107";
    } 
    else {
        btn.innerText = "⏸️ Pause";
        btn.style.background = "#ff9800";
        
        autoWalkInterval = setInterval(async () => {
            await fetch('http://127.0.0.1:8000/walk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ miles_walked: 5, trip_type: "one_way" })
            });
            updateMap();
        }, 1500);
    }
}

// Reset Button Listener (Kept separate and clean)
document.getElementById('resetBtn').addEventListener('click', () => {
    if (autoWalkInterval) {
        clearInterval(autoWalkInterval);
        autoWalkInterval = null;
        const btn = document.getElementById('autoWalkBtn');
        btn.innerText = "▶️ Auto-Walk";
        btn.style.background = "#ffc107";
    }
});
