// mouselook.js - Enables pointer lock for seamless mouselook

const MouseLookModule = (() => {
    let isPointerLocked = false;
    
    const init = () => {
        setupPointerLock();
        setupClickHandler();
        console.log('MouseLook module initialized - click to enable pointer lock');
    };
    
    const setupPointerLock = () => {
        // Listen for pointer lock changes
        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('mozpointerlockchange', onPointerLockChange);
    };
    
    const onPointerLockChange = () => {
        isPointerLocked = document.pointerLockElement === document.documentElement ||
                         document.mozPointerLockElement === document.documentElement;
        
        if (isPointerLocked) {
            console.log('Pointer locked - mouselook enabled');
        } else {
            console.log('Pointer unlocked - press ESC again to re-enable');
        }
    };
    
    const setupClickHandler = () => {
        document.addEventListener('click', () => {
            if (!isPointerLocked) {
                // Request pointer lock on click
                document.documentElement.requestPointerLock = 
                    document.documentElement.requestPointerLock || 
                    document.documentElement.mozRequestPointerLock;
                
                if (document.documentElement.requestPointerLock) {
                    document.documentElement.requestPointerLock();
                }
            }
        });
        
        // ESC key to unlock
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (isPointerLocked) {
                    document.exitPointerLock = 
                        document.exitPointerLock || 
                        document.mozExitPointerLock;
                    
                    if (document.exitPointerLock) {
                        document.exitPointerLock();
                    }
                }
            }
        });
    };
    
    const getState = () => ({
        isPointerLocked: isPointerLocked
    });
    
    return {
        init: init,
        getState: getState
    };
})();

// Initialize mouselook
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        MouseLookModule.init();
    } else {
        scene.addEventListener('loaded', () => {
            MouseLookModule.init();
        });
    }
});
