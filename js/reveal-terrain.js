// reveal-terrain.js - Directional light for initial terrain reveal, disabled when player lands

const RevealTerrainModule = (() => {
    let revealLight = null;
    let isRevealed = true;
    let hasLandedOnce = false; // Track if player has landed at least once

    const init = () => {
        console.log('Reveal terrain module initialized');
        createRevealLight();
        extendFog();
        startLandingCheck();
    };

    const createRevealLight = () => {
        const scene = document.querySelector('a-scene');
        
        // Create directional light for terrain reveal
        revealLight = document.createElement('a-light');
        revealLight.setAttribute('type', 'directional');
        revealLight.setAttribute('color', '#ffffff');
        revealLight.setAttribute('intensity', '1.2');
        revealLight.setAttribute('position', '100 200 100');
        revealLight.setAttribute('id', 'reveal-light');
        
        scene.appendChild(revealLight);
    };

    const extendFog = () => {
        const scene = document.querySelector('a-scene');
        
        // Extend fog far for initial reveal
        scene.setAttribute('fog', 'type: linear; color: #0a0e27; far: 1500; near: 0.1');
        console.log('Fog extended for terrain reveal');
    };

    const restoreFog = () => {
        const scene = document.querySelector('a-scene');
        
        // Restore original fog distance
        scene.setAttribute('fog', 'type: linear; color: #0a0e27; far: 300; near: 0.1');
        console.log('Fog restored to normal distance');
    };

    const startLandingCheck = () => {
        const checkLanding = () => {
            if (!revealLight) {
                requestAnimationFrame(checkLanding);
                return;
            }

            // Get camera and its enhanced-camera-controls component
            const camera = document.getElementById('camera');
            if (!camera) {
                requestAnimationFrame(checkLanding);
                return;
            }

            // Check if the component exists
            const controlsComponent = camera.components['enhanced-camera-controls'];
            if (!controlsComponent) {
                requestAnimationFrame(checkLanding);
                return;
            }

            // Check if player is on ground
            const isOnGround = controlsComponent.isOnGround;
            
            // Disable reveal light when player first lands
            if (isRevealed && isOnGround && !hasLandedOnce) {
                disableRevealLight();
                restoreFog();
                isRevealed = false;
                hasLandedOnce = true;
                console.log('Player landed on terrain - disabling reveal light and restoring fog');
            }

            requestAnimationFrame(checkLanding);
        };

        checkLanding();
    };

    const disableRevealLight = () => {
        if (revealLight) {
            revealLight.setAttribute('intensity', '0');
        }
    };

    const enableRevealLight = () => {
        if (revealLight) {
            revealLight.setAttribute('intensity', '1.2');
            isRevealed = true;
            hasLandedOnce = false;
            extendFog();
        }
    };

    return {
        init: init,
        disableRevealLight: disableRevealLight,
        enableRevealLight: enableRevealLight
    };
})();

// Initialize reveal terrain when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        setTimeout(() => {
            RevealTerrainModule.init();
        }, 500);
    } else {
        scene.addEventListener('loaded', () => {
            setTimeout(() => {
                RevealTerrainModule.init();
            }, 500);
        });
    }
});