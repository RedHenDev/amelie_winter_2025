// snow.js - Creates sparkling snow particles

const SnowModule = (() => {
    const createSnow = () => {
        const snowContainer = document.getElementById('snow-container');
        
        // Create multiple layers of snow particles
        for (let layer = 0; layer < 3; layer++) {
            const snowParticleGroup = document.createElement('a-entity');
            snowParticleGroup.setAttribute('id', `snow-layer-${layer}`);
            
            // Create individual snowflakes
            const flakeCount = 150;
            const layerHeight = 30 + (layer * 15);
            const spreadRadius = 80;
            
            for (let i = 0; i < flakeCount; i++) {
                const flake = createSnowflake(
                    (Math.random() - 0.5) * spreadRadius,
                    layerHeight + Math.random() * 20,
                    (Math.random() - 0.5) * spreadRadius,
                    layer
                );
                snowParticleGroup.appendChild(flake);
            }
            
            snowContainer.appendChild(snowParticleGroup);
        }
        
        // Add animation script
        addSnowAnimation();
    };
    
    const createSnowflake = (x, y, z, layer) => {
        const flake = document.createElement('a-entity');
        flake.setAttribute('position', `${x} ${y} ${z}`);
        
        // Snowflake is a small sphere with emissive material
        const geometry = document.createElement('a-sphere');
        geometry.setAttribute('radius', '0.1');
        geometry.setAttribute('material', 'color: #ffffff; emissive: #4488ff; emissiveIntensity: 0.8');
        flake.appendChild(geometry);
        
        // Store animation data
        flake.dataset.startX = x;
        flake.dataset.startY = y;
        flake.dataset.startZ = z;
        flake.dataset.time = Math.random() * 1000;
        flake.dataset.speed = 0.3 + Math.random() * 0.5;
        flake.dataset.wobble = Math.random() * 2 + 1;
        
        return flake;
    };
    
    const addSnowAnimation = () => {
        const scene = document.querySelector('a-scene');
        
        scene.addEventListener('loaded', () => {
            const animationTick = () => {
                const snowLayers = document.querySelectorAll('[id^="snow-layer-"]');
                
                snowLayers.forEach(layer => {
                    const snowflakes = layer.querySelectorAll('a-entity');
                    
                    snowflakes.forEach(flake => {
                        const startX = parseFloat(flake.dataset.startX);
                        const startY = parseFloat(flake.dataset.startY);
                        const startZ = parseFloat(flake.dataset.startZ);
                        const time = parseFloat(flake.dataset.time) + 0.01;
                        const speed = parseFloat(flake.dataset.speed);
                        const wobble = parseFloat(flake.dataset.wobble);
                        
                        const newY = startY - (time * speed);
                        const wobbleX = Math.sin(time * wobble) * 3;
                        const wobbleZ = Math.cos(time * wobble * 0.7) * 3;
                        
                        // Reset if snow falls below ground
                        if (newY < -20) {
                            flake.dataset.time = 0;
                        } else {
                            flake.dataset.time = time;
                            flake.setAttribute('position', `${startX + wobbleX} ${newY} ${startZ + wobbleZ}`);
                        }
                    });
                });
                
                requestAnimationFrame(animationTick);
            };
            
            animationTick();
        });
    };
    
    return {
        init: createSnow
    };
})();

// Initialize snow
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            SnowModule.init();
        }, 200);
    });
});
