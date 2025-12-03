// crystals.js - Creates sparkling ice crystals

const CrystalsModule = (() => {
    const createCrystals = () => {
        const crystalsContainer = document.getElementById('crystals-container');
        
        // Create crystal clusters throughout the scene
        createCrystalCluster(crystalsContainer, -20, 5, -15, 5);
        createCrystalCluster(crystalsContainer, 30, 3, 10, 4);
        createCrystalCluster(crystalsContainer, -35, -8, 25, 6);
        createCrystalCluster(crystalsContainer, 15, -10, -40, 5);
        createCrystalCluster(crystalsContainer, 0, 8, 35, 4);
        
        // Add crystal animation
        addCrystalAnimation();
    };
    
    const createCrystalCluster = (parent, posX, posY, posZ, count) => {
        const cluster = document.createElement('a-entity');
        cluster.setAttribute('position', `${posX} ${posY} ${posZ}`);
        
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 8;
            const offsetY = (Math.random() - 0.5) * 8;
            const offsetZ = (Math.random() - 0.5) * 8;
            
            const crystal = createCrystal(offsetX, offsetY, offsetZ);
            cluster.appendChild(crystal);
        }
        
        parent.appendChild(cluster);
    };
    
    const createCrystal = (x, y, z) => {
        const crystal = document.createElement('a-entity');
        crystal.setAttribute('position', `${x} ${y} ${z}`);
        
        // Create icosahedron-like shape with cones and boxes
        const mainBody = document.createElement('a-entity');
        
        // Main pyramid
        const cone = document.createElement('a-cone');
        cone.setAttribute('radius-bottom', '0.3');
        cone.setAttribute('radius-top', '0');
        cone.setAttribute('height', '1.5');
        cone.setAttribute('material', `color: #c0e8ff; emissive: #88ddff; emissiveIntensity: 0.9; transparent: true; opacity: 0.85; side: double`);
        mainBody.appendChild(cone);
        
        // Secondary crystals (smaller)
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const smallCone = document.createElement('a-cone');
            smallCone.setAttribute('radius-bottom', '0.15');
            smallCone.setAttribute('radius-top', '0');
            smallCone.setAttribute('height', '0.8');
            smallCone.setAttribute('position', `${Math.cos(angle) * 0.5} ${-0.3} ${Math.sin(angle) * 0.5}`);
            smallCone.setAttribute('rotation', `${Math.random() * 30} ${angle * 57.3} 0`);
            smallCone.setAttribute('material', `color: #d0f0ff; emissive: #99eeff; emissiveIntensity: 0.85; transparent: true; opacity: 0.8; side: double`);
            mainBody.appendChild(smallCone);
        }
        
        // Store animation data
        crystal.dataset.rotationX = Math.random() * 0.01;
        crystal.dataset.rotationY = Math.random() * 0.02;
        crystal.dataset.rotationZ = Math.random() * 0.01;
        crystal.dataset.startY = y;
        crystal.dataset.floatSpeed = Math.random() * 0.5 + 0.2;
        crystal.dataset.time = Math.random() * 6.28;
        
        crystal.appendChild(mainBody);
        return crystal;
    };
    
    const addCrystalAnimation = () => {
        const scene = document.querySelector('a-scene');
        
        scene.addEventListener('loaded', () => {
            const crystalsContainer = document.getElementById('crystals-container');
            
            const animationTick = () => {
                const crystals = crystalsContainer.querySelectorAll('a-entity > a-entity > a-entity');
                
                crystals.forEach(crystal => {
                    const rotX = parseFloat(crystal.dataset.rotationX) || 0;
                    const rotY = parseFloat(crystal.dataset.rotationY) || 0;
                    const rotZ = parseFloat(crystal.dataset.rotationZ) || 0;
                    const startY = parseFloat(crystal.dataset.startY) || 0;
                    const floatSpeed = parseFloat(crystal.dataset.floatSpeed) || 0.3;
                    let time = parseFloat(crystal.dataset.time) || 0;
                    
                    time += 0.01;
                    if (time > 6.28) time = 0;
                    
                    crystal.dataset.time = time;
                    
                    // Gentle floating motion
                    const floatY = Math.sin(time * floatSpeed) * 0.5;
                    const currentPos = crystal.getAttribute('position');
                    const parts = currentPos.split(' ');
                    const posX = parts[0];
                    const posZ = parts[2];
                    
                    crystal.setAttribute('position', `${posX} ${startY + floatY} ${posZ}`);
                    
                    // Rotation
                    const currentRot = crystal.getAttribute('rotation') || '0 0 0';
                    const rotParts = currentRot.split(' ');
                    const newRotX = (parseFloat(rotParts[0]) + rotX) % 360;
                    const newRotY = (parseFloat(rotParts[1]) + rotY) % 360;
                    const newRotZ = (parseFloat(rotParts[2]) + rotZ) % 360;
                    
                    crystal.setAttribute('rotation', `${newRotX} ${newRotY} ${newRotZ}`);
                });
                
                requestAnimationFrame(animationTick);
            };
            
            animationTick();
        });
    };
    
    return {
        init: createCrystals
    };
})();

// Initialize crystals
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            CrystalsModule.init();
        }, 250);
    });
});
