// snow.js - Creates efficient shader-based snow particles

const SnowModule = (() => {
    const config = {
        flakeCount: 80000, // Total number of snowflakes
        spreadRadius: 128, // Horizontal spread
        heightRange: [-128, 512], // Min and max height
        fallSpeed: 5, // Units per second
        wobbleAmount: 15, // Horizontal wobble distance
        wobbleSpeed: 1 // Wobble frequency
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
                // Create a simple square/circular snowflake
                vec2 coords = gl_PointCoord - vec2(0.5);
                float dist = length(coords);
                
                // Anti-aliased circle
                float alpha = smoothstep(0.5, 0.4, dist);
                
                gl_FragColor = vec4(vColor.rgb, alpha * vColor.a);
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
        
        return material;
    };
    
    const createSnowGeometry = () => {
        const geometry = new THREE.BufferGeometry();
        
        const positions = [];
        const sizes = [];
        const phases = [];
        const colorPhases = [];
        
        // Generate particle positions
        for (let i = 0; i < config.flakeCount; i++) {
            // Random position in spread area
            const x = (Math.random() - 0.5) * config.spreadRadius;
            const y = config.heightRange[0] + Math.random() * (config.heightRange[1] - config.heightRange[0]);
            const z = (Math.random() - 0.5) * config.spreadRadius;
            
            positions.push(x, y, z);
            
            // Random size variation (0.5 to 2.0)
            sizes.push(2.0 + Math.random() * 6.0);
            
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
