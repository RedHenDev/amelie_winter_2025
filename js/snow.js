// snow.js - Creates efficient shader-based snow particles

const SnowModule = (() => {
    const config = {
        flakeCount: 15000, // Increased from 8000 for density
        spreadRadius: 200, // Reduced from 512 for tighter cloud
        heightRange: [-80, 80], // Tighter vertical range around camera
        fallSpeed: 2, // Units per second
        wobbleAmount: 8, // Horizontal wobble distance
        wobbleSpeed: 1, // Wobble frequency
        cameraOffset: 5 // Distance of cloud center from camera
    };
    
    const createSnow = () => {
        const snowContainer = document.getElementById('snow-container');
        const camera = document.getElementById('camera');
        
        // Create custom shader material for snow
        const snowShader = createSnowShader();
        
        // Generate particle geometry
        const geometry = createSnowGeometry();
        
        // Create mesh with shader
        const snowMesh = new THREE.Points(geometry, snowShader);
        snowMesh.frustumCulled = false; // Don't cull particles
        
        // Create A-Frame entity to hold the mesh
        const snowEntity = document.createElement('a-entity');
        snowEntity.setAttribute('id', 'snow-particles');
        snowEntity.object3D.add(snowMesh);
        
        snowContainer.appendChild(snowEntity);
        
        // Start animation loop
        animateSnow(snowMesh, camera, snowEntity);
    };
    
    const createSnowShader = () => {
        const vertexShader = `
            uniform float uTime;
            uniform float uFallSpeed;
            uniform float uWobbleAmount;
            uniform float uWobbleSpeed;
            
            attribute float aSize;
            attribute float aPhase;
            attribute float aColorPhase;
            
            varying vec4 vColor;
            varying float vSize;
            
            void main() {
                // Apply wobble based on particle's phase and time
                float wobble = sin(uTime * uWobbleSpeed + aPhase) * uWobbleAmount;
                vec3 wobblePos = position;
                wobblePos.x += wobble;
                wobblePos.z += cos(uTime * uWobbleSpeed * 0.7 + aPhase) * uWobbleAmount;
                
                // Apply falling motion
                wobblePos.y -= uTime * uFallSpeed;
                
                // Wrap Y position to create infinite falling effect
                wobblePos.y = mod(wobblePos.y - aPhase * 5.0, 140.0) - 70.0;
                
                // Shimmering color between light blue and creamy white
                float colorShimmer = sin(uTime * 0.5 + aColorPhase) * 0.5 + 0.5;
                
                // Light blue: #a8d8ff, Creamy white: #fffef0
                vec3 lightBlue = vec3(0.66, 0.85, 1.0);
                vec3 creamyWhite = vec3(1.0, 0.998, 0.94);
                vec3 baseColor = mix(lightBlue, creamyWhite, colorShimmer);
                
                // Add brightness variation per flake
                float brightness = 0.7 + sin(aPhase * 2.0) * 0.3;
                
                // Set particle size with variation
                gl_PointSize = aSize;
                vSize = aSize;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(wobblePos, 1.0);
                
                vColor = vec4(baseColor * brightness, 0.9);
            }
        `;
        
        const fragmentShader = `
            varying vec4 vColor;
            varying float vSize;
            
            void main() {
                // Create a square snowflake with outline
                vec2 coords = gl_PointCoord - vec2(0.5);
                
                // Square shape - use max for sharp corners
                float dist = max(abs(coords.x), abs(coords.y));
                
                // Outline thickness
                float outlineThickness = 0.1;
                
                // Create filled square
                float square = step(dist, 0.5);
                
                // Create outline (only on edges)
                float outline = step(0.5 - outlineThickness, dist) * square;
                
                // Combine: outline is black, fill is the color
                vec3 finalColor = mix(vColor.rgb, vec3(0.0, 0.0, 0.0), outline);
                
                // Alpha: full inside the square, fade at edges
                float alpha = square * vColor.a;
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uFallSpeed: { value: config.fallSpeed },
                uWobbleAmount: { value: config.wobbleAmount },
                uWobbleSpeed: { value: config.wobbleSpeed },
                uTexture: { value: null }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true
        });
        
        // Ensure the material is not emissive to prevent self-illumination
        material.emissive = new THREE.Color(0, 0, 0);
        
        return material;
    };
    
    const createSnowGeometry = () => {
        const geometry = new THREE.BufferGeometry();
        
        const positions = [];
        const sizes = [];
        const phases = [];
        const colorPhases = [];
        
        // Generate particle positions with bias towards center
        for (let i = 0; i < config.flakeCount; i++) {
            // Use exponential distribution to cluster particles near center
            // Random value 0-1, then square it to bias towards 0
            const randomRadius = Math.random();
            const biasedRadius = Math.sqrt(randomRadius); // Square root creates denser center
            
            // Random angle around camera
            const angle = Math.random() * Math.PI * 2;
            
            // Distribute based on biased radius
            const x = Math.cos(angle) * biasedRadius * config.spreadRadius;
            const z = Math.sin(angle) * biasedRadius * config.spreadRadius;
            
            // Uniform height distribution for falling effect
            const y = config.heightRange[0] + Math.random() * (config.heightRange[1] - config.heightRange[0]);
            
            positions.push(x, y, z);
            
            // Size variation - smaller flakes in distance, larger up close
            // Closer particles (smaller radius) are slightly larger
            const sizeVariation = 1.5 + (1 - biasedRadius) * 0.5; // Range: 1.5 to 2.0x
            sizes.push(2.0 + Math.random() * 6.0 * sizeVariation);
            
            // Random phase for wobble variation
            phases.push(Math.random() * Math.PI * 2);
            
            // Random phase for color shimmer variation
            colorPhases.push(Math.random() * Math.PI * 2);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(sizes), 1));
        geometry.setAttribute('aPhase', new THREE.BufferAttribute(new Float32Array(phases), 1));
        geometry.setAttribute('aColorPhase', new THREE.BufferAttribute(new Float32Array(colorPhases), 1));
        
        return geometry;
    };
    
    const animateSnow = (snowMesh, camera, snowEntity) => {
        let startTime = Date.now();
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000; // Convert to seconds
            snowMesh.material.uniforms.uTime.value = elapsed;
            
            // Lock snow position to camera (translations only, no rotation)
            if (camera) {
                const cameraPos = camera.object3D.position;
                snowEntity.object3D.position.copy(cameraPos);
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    };
    
    return {
        init: createSnow,
        getConfig: () => config
    };
})();

// Initialize snow
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        SnowModule.init();
    } else {
        scene.addEventListener('loaded', () => {
            SnowModule.init();
        });
    }
});
