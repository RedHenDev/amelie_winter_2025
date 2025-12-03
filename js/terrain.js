// terrain.js - Creates a procedural terrain with ice and snow textures

const TerrainModule = (() => {
    const createTerrain = () => {
        const terrainContainer = document.getElementById('terrain-container');
        
        // Create base terrain using a-plane with displacement
        const terrain = document.createElement('a-entity');
        terrain.setAttribute('id', 'base-terrain');
        terrain.setAttribute('position', '0 -5 0');
        
        // Main ground plane
        const ground = document.createElement('a-plane');
        ground.setAttribute('width', '100');
        ground.setAttribute('height', '100');
        ground.setAttribute('rotation', '-90 0 0');
        ground.setAttribute('material', 'color: #f0f8ff; wireframe: false; side: double');
        terrain.appendChild(ground);
        
        // Create rolling hills using multiple boxes with varying heights
        createHills(terrain);
        
        terrainContainer.appendChild(terrain);
    };
    
    const createHills = (parent) => {
        const hillSize = 10;
        const gridSize = 100;
        const segments = gridSize / hillSize;
        
        for (let x = -segments / 2; x < segments / 2; x++) {
            for (let z = -segments / 2; z < segments / 2; z++) {
                const posX = x * hillSize;
                const posZ = z * hillSize;
                
                // Random height variation
                const height = Math.sin(posX / 20) * 3 + Math.cos(posZ / 20) * 3 + 2;
                const posY = height / 2;
                
                const hill = document.createElement('a-box');
                hill.setAttribute('width', hillSize);
                hill.setAttribute('height', height);
                hill.setAttribute('depth', hillSize);
                hill.setAttribute('position', `${posX} ${posY} ${posZ}`);
                hill.setAttribute('material', 'color: #ffffff; metalness: 0.3; roughness: 0.8');
                hill.setAttribute('shadow', 'cast: true; receive: true');
                
                parent.appendChild(hill);
            }
        }
    };
    
    return {
        init: createTerrain
    };
})();

// Initialize terrain when scene is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        TerrainModule.init();
    });
});
