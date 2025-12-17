// jewels.js - Distributes collectible jewels across the terrain using 2D sprites

const JewelsModule = (() => {
    const config = {
        gridSize: 16, // 16x16 grid across terrain
        jeweelsPerCell: 2, // Average jewels per grid cell
        collectDistance: 2, // Distance to collect jewel
        spriteSize: 0.8 // Size of 2D sprite
    };

    // Jewel types - simplified for sprites
    const jewelTypes = [
        { color: '#00d4ff', type: 'diamond' },
        { color: '#00ff44', type: 'emerald' },
        { color: '#f90227ff', type: 'ruby' }
    ];

    let jewels = [];
    let collectedCount = { diamond: 0, emerald: 0, ruby: 0 };
    let sharedMaterial = null;

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

        // Create shared sprite material
        sharedMaterial = createSpriteMaterial();

        // Grid-based distribution
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
                        const y = terrainHeight + 2;
                        
                        createJewel(jewelType, x, y, z, container);
                    }
                }
            }
        }

        console.log(`Jewels distributed: ${jewels.length} total`);
    };

    const createSpriteMaterial = () => {
        return new THREE.ShaderMaterial({
            uniforms: {
                spriteColor: { value: new THREE.Color('#ffffff') }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 spriteColor;
                varying vec2 vUv;
                
                void main() {
                    // Create diamond shape
                    vec2 center = vUv - 0.5;
                    float dist = abs(center.x) + abs(center.y);
                    
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    // Add glow
                    float glow = 1.0 - dist;
                    gl_FragColor = vec4(spriteColor, glow);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    };

    const createJewel = (jewelType, x, y, z, container) => {
        const jewel = {
            type: jewelType.type,
            position: new THREE.Vector3(x, y, z),
            baseY: y,
            time: Math.random() * Math.PI * 2,
            collected: false,
            entity: null,
            mesh: null
        };

        const entity = document.createElement('a-entity');
        entity.setAttribute('position', `${x} ${y} ${z}`);

        // Create simple quad sprite
        const geometry = new THREE.PlaneGeometry(config.spriteSize, config.spriteSize);
        const material = sharedMaterial.clone();
        material.uniforms.spriteColor.value = new THREE.Color(jewelType.color);

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

            // Update animations and collection check
            jewels.forEach(jewel => {
                if (!jewel.collected && jewel.mesh) {
                    // Bob animation
                    jewel.time += 0.05;
                    const bobY = jewel.baseY + Math.sin(jewel.time) * 0.5;
                    jewel.entity.object3D.position.y = bobY;

                    // Billboard effect - always face camera
                    jewel.mesh.lookAt(cameraPos);

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
