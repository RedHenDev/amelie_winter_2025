// main.js - Main initialization and scene management

const AppModule = (() => {
    const init = () => {
        setupScene();
        setupControls();
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
    
    const logInfo = () => {
        console.log('=== Winter Terrain Scene ===');
        console.log('Modules loaded:');
        console.log('- Terrain with procedural hills');
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
