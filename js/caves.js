// caves.js - Creates cave structures with icy walls

const CaveModule = (() => {
    const createCaves = () => {
        const caveContainer = document.getElementById('cave-container');
        
        // Cave 1 - Large cavern
        createCavern(caveContainer, -30, -8, -20, 20, 15, 25);
        
        // Cave 2 - Medium cave
        createCavern(caveContainer, 25, -10, -35, 15, 12, 18);
        
        // Cave 3 - Deep cave system
        createCavern(caveContainer, -15, -15, 30, 12, 10, 20);
    };
    
    const createCavern = (parent, posX, posY, posZ, width, height, depth) => {
        const cavern = document.createElement('a-entity');
        cavern.setAttribute('position', `${posX} ${posY} ${posZ}`);
        
        // Ceiling - using inverted dome
        const ceiling = document.createElement('a-entity');
        ceiling.setAttribute('geometry', 'primitive: sphere; radius: 10');
        ceiling.setAttribute('position', '0 8 0');
        ceiling.setAttribute('material', 'color: #d0e8ff; side: back; metalness: 0.6; roughness: 0.3');
        ceiling.setAttribute('shadow', 'receive: true');
        cavern.appendChild(ceiling);
        
        // Walls - left
        const leftWall = document.createElement('a-box');
        leftWall.setAttribute('width', '3');
        leftWall.setAttribute('height', height);
        leftWall.setAttribute('depth', depth);
        leftWall.setAttribute('position', `-${width / 2} 0 0`);
        leftWall.setAttribute('material', 'color: #a0c8e8; roughness: 0.7; metalness: 0.4');
        leftWall.setAttribute('shadow', 'cast: true; receive: true');
        cavern.appendChild(leftWall);
        
        // Walls - right
        const rightWall = document.createElement('a-box');
        rightWall.setAttribute('width', '3');
        rightWall.setAttribute('height', height);
        rightWall.setAttribute('depth', depth);
        rightWall.setAttribute('position', `${width / 2} 0 0`);
        rightWall.setAttribute('material', 'color: #a0c8e8; roughness: 0.7; metalness: 0.4');
        rightWall.setAttribute('shadow', 'cast: true; receive: true');
        cavern.appendChild(rightWall);
        
        // Floor - ice
        const floor = document.createElement('a-box');
        floor.setAttribute('width', width);
        floor.setAttribute('height', '2');
        floor.setAttribute('depth', depth);
        floor.setAttribute('position', '0 -7 0');
        floor.setAttribute('material', 'color: #e0f0ff; roughness: 0.2; metalness: 0.8');
        floor.setAttribute('shadow', 'cast: true; receive: true');
        cavern.appendChild(floor);
        
        parent.appendChild(cavern);
    };
    
    return {
        init: createCaves
    };
})();

// Initialize caves
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            CaveModule.init();
        }, 100);
    });
});
