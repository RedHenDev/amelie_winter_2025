// initial-fall-lookdown.js - Forces camera to look straight down during initial fall
// Works with enhanced-camera-controls by temporarily disabling its rotation updates

const InitialFallLookdownModule = (() => {
    let isActive = false;
    let cameraEl = null;
    let controlsComponent = null;
    let originalTick = null;

    const init = () => {
        cameraEl = document.getElementById('camera');
        if (!cameraEl) return;

        controlsComponent = cameraEl.components['enhanced-camera-controls'];
        if (!controlsComponent) {
            console.warn('enhanced-camera-controls component not found');
            return;
        }

        console.log('Initial fall look-down module initialized');
        startCheck();
    };

    const startCheck = () => {
        const check = () => {
            if (!cameraEl || !controlsComponent) {
                requestAnimationFrame(check);
                return;
            }

            const pos = cameraEl.object3D.position;
            const terrainHeight = controlsComponent.getTerrainHeight(pos.x, pos.z);
            const targetHeight = terrainHeight + controlsComponent.data.heightOffset;
            const distanceToGround = pos.y - targetHeight;

            // Activate only on the initial high drop (starting y=100)
            if (!isActive && pos.y > 50 && distanceToGround > 10) {
                isActive = true;
                forceLookDown();
                console.log('Camera view locked straight down during initial fall');
            }

            // Deactivate when ~10 units from ground
            if (isActive && distanceToGround <= 10) {
                isActive = false;
                restoreNormalLook();
                console.log('Initial fall ended - restoring normal free look');
            }

            // Safety: if somehow on ground already
            if (isActive && controlsComponent.isOnGround) {
                isActive = false;
                restoreNormalLook();
            }

            requestAnimationFrame(check);
        };

        check();
    };

    const forceLookDown = () => {
        const camera = cameraEl.object3D;

        // Preserve current yaw (horizontal rotation) but force pitch straight down
        const currentYaw = camera.rotation.y;
        camera.rotation.set(THREE.MathUtils.degToRad(-90), currentYaw, 0);

        // Temporarily disable rotation handling in enhanced-camera-controls
        if (controlsComponent.tick) {
            originalTick = controlsComponent.tick;
            controlsComponent.tick = function (t, dt) {
                // Run original tick but skip the rotation part
                // (We can't easily skip just rotation, so we run movement only by calling parts manually if needed)
                // Instead: run full original tick, then immediately override rotation
                originalTick.call(this, t, dt);

                // Force straight down again after controls try to change it
                const preservedYaw = camera.rotation.y; // Keep user's horizontal mouse movement
                camera.rotation.set(THREE.MathUtils.degToRad(-90), preservedYaw, 0);
            };
        }

        // Continuous override loop for safety (in case tick changes)
        const overrideLoop = () => {
            if (!isActive) return;

            const preservedYaw = camera.rotation.y;
            camera.rotation.set(THREE.MathUtils.degToRad(-90), preservedYaw, 0);

            requestAnimationFrame(overrideLoop);
        };
        overrideLoop();
    };

    const restoreNormalLook = () => {
        if (originalTick && controlsComponent) {
            controlsComponent.tick = originalTick;
            originalTick = null;
        }
    };

    return {
        init: init
    };
})();

// Initialize after terrain selection
document.addEventListener('terrainSelected', () => {
    setTimeout(() => {
        InitialFallLookdownModule.init();
    }, 600);
});