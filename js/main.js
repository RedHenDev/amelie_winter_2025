// main.js - Main initialization and scene management

const AppModule = (() => {
    const init = () => {
        setupScene();
        setupControls();
        setupDebugDisplay();
        logInfo();
    };
    
    const setupScene = () => {
        const scene = document.querySelector('a-scene');
        
        scene.addEventListener('loaded', () => {
            console.log('Scene loaded successfully');
        });
    };
    
    const setupControls = () => {
        const camera = document.getElementById('camera');
        
        // Add additional camera controls
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'r') {
                // Reset camera position
                camera.setAttribute('position', '0 5 20');
                console.log('Camera reset to starting position');
            }
        });
    };
    
    const setupDebugDisplay = () => {
        const infoPanel = document.getElementById('info');
        
        const updateDebugInfo = () => {
            const physicsState = PhysicsModule.getPhysicsState();
            const camera = document.getElementById('camera');
            const pos = camera.object3D.position;
            
            let debugText = `
                <h3>Winter Terrain Explorer</h3>
                <p><strong>Controls:</strong> WASD/Arrows to move, Mouse to look, R to reset</p>
                <hr style="margin: 8px 0; opacity: 0.3;">
                <p><strong>Terrain Physics:</strong></p>
                <p>On Terrain: ${physicsState.isOnTerrain ? '✓ Yes' : '✗ No'}</p>
                <p>Slope Angle: ${physicsState.slopeAngle.toFixed(1)}°</p>
                <p>Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})</p>
            `;
            
            infoPanel.innerHTML = debugText;
            requestAnimationFrame(updateDebugInfo);
        };
        
        updateDebugInfo();
    };
    
    const logInfo = () => {
        console.log('=== Winter Terrain Scene ===');
        console.log('Modules loaded:');
        console.log('- Terrain with heightmap-based generation');
        console.log('- Physics system with friction and sliding');
        console.log('- Cave system with icy walls');
        console.log('- Tunnel system connecting areas');
        console.log('- Sparkling snow particles');
        console.log('- Ice crystals with animations');
        console.log('Controls: WASD/Arrows to move, Mouse to look, R to reset camera');
    };
    
    return {
        init: init
    };
})();

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        AppModule.init();
    });
});
