// start-screen.js - Handles the terrain selection start screen

const StartScreenModule = (() => {
    let selectedTerrainPath = null;
    
    const terrainOptions = [
        {
            path: 'assets/heightmap.png',
            name: 'Classic Peaks',
            description: 'Rolling mountain terrain'
        },
        {
            path: 'assets/b.jpeg',
            name: 'Mystery Landscape',
            description: 'Unknown terrain awaits'
        },
        {
            path: 'assets/Missing_Person_Stalenhag.jpeg',
            name: 'Stalenhag Vista',
            description: 'Atmospheric wilderness'
        }
    ];
    
    const init = () => {
        populateTerrainSelector();
        setupEventListeners();
        
        // Hide the A-Frame scene initially
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.style.display = 'none';
        }
    };
    
    const populateTerrainSelector = () => {
        const selector = document.getElementById('terrain-selector');
        
        terrainOptions.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'terrain-option';
            optionDiv.dataset.terrainPath = option.path;
            optionDiv.dataset.index = index;
            
            // Create image element
            const img = document.createElement('img');
            img.src = option.path;
            img.alt = option.name;
            
            // Handle image load errors
            img.onerror = () => {
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="250" height="250"%3E%3Crect width="250" height="250" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23fff" font-size="20"%3ETerrain %23' + (index + 1) + '%3C/text%3E%3C/svg%3E';
            };
            
            // Create overlay with name
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            overlay.textContent = option.name;
            
            optionDiv.appendChild(img);
            optionDiv.appendChild(overlay);
            selector.appendChild(optionDiv);
        });
    };
    
    const setupEventListeners = () => {
        const selector = document.getElementById('terrain-selector');
        
        selector.addEventListener('click', (event) => {
            const option = event.target.closest('.terrain-option');
            if (option) {
                selectedTerrainPath = option.dataset.terrainPath;
                startGame(selectedTerrainPath);
            }
        });
    };
    
    const startGame = (terrainPath) => {
        console.log('Starting game with terrain:', terrainPath);
        
        // Set the selected terrain in the config
        if (typeof TERRAIN_CONFIG !== 'undefined') {
            TERRAIN_CONFIG.heightmapPath = terrainPath;
        }
        
        // Initialize the reveal light BEFORE showing the scene
        if (typeof RevealTerrainModule !== 'undefined') {
            RevealTerrainModule.init();
        }
        
        // Show the scene
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.style.display = 'block';
        }
        
        // Hide start screen with fade out
        const startScreen = document.getElementById('start-screen');
        startScreen.classList.add('hidden');
        
        // Remove start screen from DOM after animation
        setTimeout(() => {
            startScreen.style.display = 'none';
            
            // Dispatch event to notify controls that terrain is selected
            const terrainSelectedEvent = new CustomEvent('terrainSelected');
            document.dispatchEvent(terrainSelectedEvent);
            
            // Initialize the terrain with the selected heightmap
            if (typeof TerrainModule !== 'undefined') {
                TerrainModule.init();
            }
            
            // Initialize the minimap AFTER terrain selection
            if (typeof MinimapModule !== 'undefined') {
                setTimeout(() => {
                    MinimapModule.init();
                }, 500); // Small delay to ensure terrain is loaded
            }
        }, 500);
    };
    
    return {
        init: init,
        getSelectedTerrain: () => selectedTerrainPath
    };
})();

// Initialize start screen immediately
document.addEventListener('DOMContentLoaded', () => {
    StartScreenModule.init();
});