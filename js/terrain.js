// terrain.js - Creates heightmap-based terrain with ice and snow textures

// ===== CONFIGURATION =====
const TERRAIN_CONFIG = {
    heightmapPath: 'assets/heightmap.png',
    vertexResolution: 128, // Number of vertices per side (64x64, 128x128, etc.) - adjust for detail/performance
    terrainScale: 1000, // World space scale
    heightScale: 90, // Height multiplier from heightmap
    baseColor: '#f0f8ff',
    metalness: 0.3,
    roughness: 0.8,
    playerHeight: 1.6, // Height above terrain surface
    raycastDistance: 50 // Distance to check for terrain below
};

const TerrainModule = (() => {
    const createTerrain = () => {
        const terrainContainer = document.getElementById('terrain-container');
        
        // Create base terrain from heightmap
        const terrain = document.createElement('a-entity');
        terrain.setAttribute('id', 'base-terrain');
        terrain.setAttribute('position', '0 0 0');
        
        // Load heightmap and generate terrain
        loadHeightmapAndCreateTerrain(terrain);
        
        terrainContainer.appendChild(terrain);
    };
    
    const loadHeightmapAndCreateTerrain = (parent) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const heightmapData = imageData.data;
            
            createHeightmapTerrain(parent, heightmapData, canvas.width, canvas.height);
        };
        
        img.onerror = () => {
            console.warn('Heightmap not found at ' + TERRAIN_CONFIG.heightmapPath + ', creating procedural terrain instead');
            createProceduralTerrain(parent);
        };
        
        img.src = TERRAIN_CONFIG.heightmapPath;
    };
    
    const createHeightmapTerrain = (parent, heightmapData, imgWidth, imgHeight) => {
        const resolution = TERRAIN_CONFIG.vertexResolution;
        const terrainScale = TERRAIN_CONFIG.terrainScale;
        const heightScale = TERRAIN_CONFIG.heightScale;
        
        // Create vertices array and colors array
        const vertices = [];
        const colors = [];
        const indices = [];
        
        // Generate vertices based on heightmap resolution
        for (let y = 0; y < resolution; y++) {
            for (let x = 0; x < resolution; x++) {
                // Map vertex position to heightmap coordinates
                const hx = Math.floor((x / (resolution - 1)) * (imgWidth - 1));
                const hy = Math.floor((y / (resolution - 1)) * (imgHeight - 1));
                
                // Sample heightmap pixel
                const pixelIndex = (hy * imgWidth + hx) * 4;
                const r = heightmapData[pixelIndex] / 255;
                const g = heightmapData[pixelIndex + 1] / 255;
                const b = heightmapData[pixelIndex + 2] / 255;
                
                // Use grayscale (average) for height
                const heightValue = (r + g + b) / 3;
                
                // Calculate world position
                const posX = (x / (resolution - 1) - 0.5) * terrainScale;
                const posZ = (y / (resolution - 1) - 0.5) * terrainScale;
                const posY = heightValue * heightScale;
                
                vertices.push([posX, posY, posZ]);
                
                // Store the actual color from the image
                colors.push([r, g, b]);
            }
        }
        
        // Generate triangle indices for the plane
        for (let y = 0; y < resolution - 1; y++) {
            for (let x = 0; x < resolution - 1; x++) {
                const a = y * resolution + x;
                const b = y * resolution + (x + 1);
                const c = (y + 1) * resolution + x;
                const d = (y + 1) * resolution + (x + 1);
                
                // Two triangles per quad
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }
        
        // Create mesh entity
        const terrainMesh = document.createElement('a-entity');
        terrainMesh.setAttribute('id', 'heightmap-mesh');
        
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positionArray = new Float32Array(vertices.flat());
        const colorArray = new Float32Array(colors.flat());
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();
        
        // Create material with vertex colors
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            metalness: TERRAIN_CONFIG.metalness,
            roughness: TERRAIN_CONFIG.roughness,
            side: THREE.DoubleSide,
            shadowMap: { enabled: true }
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.scale.set(1, 1, 1);
        
        // Add to scene through A-Frame entity
        terrainMesh.object3D.add(mesh);
        parent.appendChild(terrainMesh);
        
        // Store mesh reference for collision detection
        TerrainModule.setTerrainMesh(mesh);
        
        console.log(`Heightmap terrain created with ${vertices.length} vertices and ${indices.length / 3} triangles`);
    };
    
    const createProceduralTerrain = (parent) => {
        console.log('Creating procedural fallback terrain...');
        const resolution = TERRAIN_CONFIG.vertexResolution;
        const terrainScale = TERRAIN_CONFIG.terrainScale;
        const heightScale = TERRAIN_CONFIG.heightScale;
        
        const vertices = [];
        const indices = [];
        
        // Generate vertices with procedural noise
        for (let y = 0; y < resolution; y++) {
            for (let x = 0; x < resolution; x++) {
                const posX = (x / (resolution - 1) - 0.5) * terrainScale;
                const posZ = (y / (resolution - 1) - 0.5) * terrainScale;
                
                // Simple Perlin-like noise using sine/cosine
                const heightValue = (
                    Math.sin(posX / 20) * 0.3 + 
                    Math.cos(posZ / 20) * 0.3 + 
                    Math.sin(posX / 50) * 0.2 + 
                    Math.cos(posZ / 50) * 0.2
                ) * 0.5 + 0.5;
                
                const posY = heightValue * heightScale;
                vertices.push([posX, posY, posZ]);
            }
        }
        
        // Generate triangle indices
        for (let y = 0; y < resolution - 1; y++) {
            for (let x = 0; x < resolution - 1; x++) {
                const a = y * resolution + x;
                const b = y * resolution + (x + 1);
                const c = (y + 1) * resolution + x;
                const d = (y + 1) * resolution + (x + 1);
                
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }
        
        // Create mesh
        const terrainMesh = document.createElement('a-entity');
        terrainMesh.setAttribute('id', 'procedural-mesh');
        
        const geometry = new THREE.BufferGeometry();
        const positionArray = new Float32Array(vertices.flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(TERRAIN_CONFIG.baseColor),
            metalness: TERRAIN_CONFIG.metalness,
            roughness: TERRAIN_CONFIG.roughness,
            side: THREE.DoubleSide,
            shadowMap: { enabled: true }
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        terrainMesh.object3D.add(mesh);
        parent.appendChild(terrainMesh);
        
        console.log('Procedural terrain created');
    };
    
    let terrainMesh = null;
    
    const getTerrain = () => terrainMesh;
    
    const setTerrainMesh = (mesh) => {
        terrainMesh = mesh;
    };
    
    return {
        init: createTerrain,
        getTerrain: getTerrain,
        setTerrainMesh: setTerrainMesh,
        getConfig: () => TERRAIN_CONFIG
    };
})();

// Initialize terrain when scene is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        TerrainModule.init();
    });
});
