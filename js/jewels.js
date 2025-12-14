// jewels.js - Distributes collectible jewels across the terrain

const JewelsModule = (() => {
    const config = {
        gridSize: 16, // 16x16 grid across terrain
        jeweelsPerCell: 2, // Average jewels per grid cell
        collectDistance: 2, // Distance to collect jewel
        rotationSpeed: 0.02, // Rotation speed for visual effect
        bobSpeed: 0.05, // Bobbing speed
        bobAmount: 1 // Bobbing height
    };

    // Jewel types - simplified
    const jewelTypes = [
        { color: '#00d4ff', emissive: '#0099ff', size: 0.3, type: 'diamond' },
        { color: '#00ff44', emissive: '#00cc33', size: 0.25, type: 'emerald' },
        { color: '#0055ff', emissive: '#0044cc', size: 0.2, type: 'lapis' }
    ];

    let jewels = [];
    let collectedCount = { diamond: 0, emerald: 0, lapis: 0 };

    const init = () => {
        console.log('Jewels module initialized');
        const checkTerrainInterval = setInterval(() => {
            if (TerrainModule && TerrainModule.getTerrain()) {
                clearInterval(checkTerrainInterval);
                distributeJewels();
                startCollectionCheck();
            }
        }, 100);
    };

    const distributeJewels = () => {
        const terrainConfig = TERRAIN_CONFIG;
        const terrainScale = terrainConfig.terrainScale;
        const cellSize = terrainScale / config.gridSize;
        
        const jewelContainer = document.querySelector('a-scene');
        const container = document.createElement('a-entity');
        container.setAttribute('id', 'jewels-container');
        jewelContainer.appendChild(container);

        // Grid-based distribution - much simpler
        for (let gx = 0; gx < config.gridSize; gx++) {
            for (let gz = 0; gz < config.gridSize; gz++) {
                // Cell center
                const cellX = (gx - config.gridSize / 2) * cellSize + cellSize / 2;
                const cellZ = (gz - config.gridSize / 2) * cellSize + cellSize / 2;
                
                // Create jewels in this cell
                const jewelCount = Math.floor(config.jeweelsPerCell + Math.random());
                
                for (let j = 0; j < jewelCount; j++) {
                    // Random offset within cell
                    const x = cellX + (Math.random() - 0.5) * cellSize * 0.8;
                    const z = cellZ + (Math.random() - 0.5) * cellSize * 0.8;
                    
                    const terrainHeight = getTerrainHeightAt(x, z);
                    if (terrainHeight !== null) {
                        // Pick random jewel type
                        const jewelType = jewelTypes[Math.floor(Math.random() * jewelTypes.length)];
                        const y = terrainHeight + 2; // Fixed offset above terrain
                        
                        createJewel(jewelType, x, y, z, container);
                    }
                }
            }
        }

        console.log(`Jewels distributed: ${jewels.length} total`);
    };

    const createJewel = (jewelType, x, y, z, container) => {
        const jewel = {
            type: jewelType.type,
            position: new THREE.Vector3(x, y, z),
            baseY: y,
            rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * config.rotationSpeed,
                (Math.random() - 0.5) * config.rotationSpeed,
                (Math.random() - 0.5) * config.rotationSpeed
            ),
            time: Math.random() * Math.PI * 2,
            collected: false,
            entity: null,
            mesh: null
        };

        const entity = document.createElement('a-entity');
        entity.setAttribute('position', `${x} ${y} ${z}`);

        // Create geometry
        const geometry = new THREE.OctahedronGeometry(jewelType.size, 0);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(jewelType.color),
            emissive: new THREE.Color(jewelType.emissive),
            emissiveIntensity: 0.8,
            metalness: 0.6,
            roughness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        entity.object3D.add(mesh);
        container.appendChild(entity);

        jewel.entity = entity;
        jewel.mesh = mesh;
        jewels.push(jewel);
    };

    const getTerrainHeightAt = (x, z) => {
        const terrainMesh = TerrainModule.getTerrain();
        if (!terrainMesh) return null;

        const raycaster = new THREE.Raycaster();
        const rayStart = new THREE.Vector3(x, 150, z);
        const rayDir = new THREE.Vector3(0, -1, 0);

        raycaster.set(rayStart, rayDir);
        const intersects = raycaster.intersectObject(terrainMesh);

        return intersects.length > 0 ? intersects[0].point.y : null;
    };

    const startCollectionCheck = () => {
        const camera = document.getElementById('camera');
        let lastCheckTime = Date.now();

        const checkCollect = () => {
            if (!camera) {
                requestAnimationFrame(checkCollect);
                return;
            }

            const cameraPos = camera.object3D.position;
            const now = Date.now();

            // Update animations every frame, collection check every 100ms
            jewels.forEach(jewel => {
                if (!jewel.collected && jewel.mesh) {
                    // Rotate
                    jewel.rotation.x += jewel.rotationSpeed.x;
                    jewel.rotation.y += jewel.rotationSpeed.y;
                    jewel.rotation.z += jewel.rotationSpeed.z;
                    jewel.mesh.rotation.copy(jewel.rotation);

                    // Bob
                    jewel.time += config.bobSpeed;
                    jewel.entity.object3D.position.y = jewel.baseY + Math.sin(jewel.time) * config.bobAmount;

                    // Collection check (throttled)
                    if (now - lastCheckTime > 100) {
                        const dist = cameraPos.distanceTo(jewel.position);
                        if (dist < config.collectDistance) {
                            collectJewel(jewel);
                        }
                    }
                }
            });

            if (now - lastCheckTime > 100) {
                lastCheckTime = now;
            }

            requestAnimationFrame(checkCollect);
        };

        checkCollect();
    };

    const collectJewel = (jewel) => {
        jewel.collected = true;
        collectedCount[jewel.type]++;

        if (jewel.entity && jewel.entity.parentElement) {
            jewel.entity.parentElement.removeChild(jewel.entity);
        }

        updateCollectionUI();
    };

    const updateCollectionUI = () => {
        const statsElement = document.querySelector('#jewel-stats');
        if (statsElement) {
            statsElement.innerHTML = `💎 ${collectedCount.diamond} | 💚 ${collectedCount.emerald} | 💙 ${collectedCount.lapis}`;
        }
    };

    const getCollectionStats = () => collectedCount;

    return {
        init: init,
        getCollectionStats: getCollectionStats,
        getConfig: () => config
    };
})();

// Initialize jewels when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        setTimeout(() => {
            JewelsModule.init();
        }, 1000);
    } else {
        scene.addEventListener('loaded', () => {
            setTimeout(() => {
                JewelsModule.init();
            }, 1000);
        });
    }
});

// Initialize jewels when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        setTimeout(() => {
            JewelsModule.init();
        }, 1000);
    } else {
        scene.addEventListener('loaded', () => {
            setTimeout(() => {
                JewelsModule.init();
            }, 1000);
        });
    }
});
