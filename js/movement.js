// movement.js - Handles player input and movement with physics integration

const MovementModule = (() => {
    const keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        arrowUp: false,
        arrowLeft: false,
        arrowDown: false,
        arrowRight: false
    };
    
    const config = {
        moveSpeed: 0.25, // Units per frame - increased for better control
        acceleration: 1.2 // Multiplier for holding keys
    };
    
    const init = () => {
        setupInputListeners();
        startMovementLoop();
        console.log('Movement module initialized');
    };
    
    const setupInputListeners = () => {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w') keys.w = true;
            if (key === 'a') keys.a = true;
            if (key === 's') keys.s = true;
            if (key === 'd') keys.d = true;
            if (e.key === 'ArrowUp') keys.arrowUp = true;
            if (e.key === 'ArrowLeft') keys.arrowLeft = true;
            if (e.key === 'ArrowDown') keys.arrowDown = true;
            if (e.key === 'ArrowRight') keys.arrowRight = true;
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w') keys.w = false;
            if (key === 'a') keys.a = false;
            if (key === 's') keys.s = false;
            if (key === 'd') keys.d = false;
            if (e.key === 'ArrowUp') keys.arrowUp = false;
            if (e.key === 'ArrowLeft') keys.arrowLeft = false;
            if (e.key === 'ArrowDown') keys.arrowDown = false;
            if (e.key === 'ArrowRight') keys.arrowRight = false;
        });
    };
    
    const startMovementLoop = () => {
        const camera = document.getElementById('camera');
        
        const movementTick = () => {
            if (!camera) {
                requestAnimationFrame(movementTick);
                return;
            }
            
            const cameraPos = camera.object3D.position;
            const cameraRot = camera.object3D.rotation;
            
            // Get camera forward and right vectors
            const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRot.y);
            const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRot.y);
            
            // Calculate movement direction
            let moveDir = new THREE.Vector3();
            
            // WASD movement
            if (keys.w || keys.arrowUp) moveDir.add(forward);
            if (keys.s || keys.arrowDown) moveDir.sub(forward);
            if (keys.d || keys.arrowRight) moveDir.add(right);
            if (keys.a || keys.arrowLeft) moveDir.sub(right);
            
            // Normalize if moving
            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                moveDir.multiplyScalar(config.moveSpeed * config.acceleration);
                
                // Apply movement - only horizontal (terrain physics handles vertical)
                cameraPos.x += moveDir.x;
                cameraPos.z += moveDir.z;
                
                camera.object3D.position.copy(cameraPos);
            }
            
            requestAnimationFrame(movementTick);
        };
        
        movementTick();
    };
    
    return {
        init: init,
        getConfig: () => config
    };
})();

// Initialize movement
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        MovementModule.init();
    } else {
        scene.addEventListener('loaded', () => {
            MovementModule.init();
        });
    }
});
