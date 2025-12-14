// physics.js - Terrain collision, friction, and sliding physics

const PHYSICS_CONFIG = {
    gravity: 35, // Units per second squared
    friction: 0.85, // Friction coefficient (0-1, higher = more friction)
    maxClimbAngle: 30, // Maximum angle player can climb (degrees) - BLOCKS movement above this
    slideThreshold: 25, // Angle above which player slides (degrees)
    slideAcceleration: 2.0, // How fast player accelerates while sliding (increased from 0.8)
    slideMaxSpeed: 35, // Maximum sliding speed (increased from 20)
    raycastDistance: 100, // Distance to raycast for terrain
    checkInterval: 0.016, // Physics update interval (60fps)
    sampleDistance: 2.5 // Distance to sample terrain ahead
};

const PhysicsModule = (() => {
    let terrainMesh = null;
    let raycaster = new THREE.Raycaster();
    let playerVelocity = new THREE.Vector3(0, 0, 0);
    let isOnTerrain = false;
    let currentSlopeAngle = 0;
    let slopeDirection = new THREE.Vector3(0, 0, 0);
    let lastCameraPos = new THREE.Vector3(0, 0, 0);
    let inputVelocity = new THREE.Vector3(0, 0, 0);
    let fallingVelocity = 0; // Track vertical velocity for falling
    let isInitialized = false;
    
    const init = () => {
        console.log('Physics module initialized');
        // Wait for terrain to be ready
        const checkTerrainInterval = setInterval(() => {
            terrainMesh = TerrainModule.getTerrain();
            if (terrainMesh) {
                clearInterval(checkTerrainInterval);
                // Initialize player position high up
                const camera = document.getElementById('camera');
                if (camera) {
                    lastCameraPos.copy(camera.object3D.position);
                    fallingVelocity = 0; // Start with no velocity
                    isInitialized = true;
                }
                startPhysicsLoop();
            }
        }, 100);
    };
    
    const startPhysicsLoop = () => {
        const camera = document.getElementById('camera');
        const movementModule = window.MovementModule; // Get reference to movement module
        
        const physicsUpdate = () => {
            if (!terrainMesh || !camera) {
                requestAnimationFrame(physicsUpdate);
                return;
            }
            
            const cameraPos = camera.object3D.position.clone();
            
            const terrainHeight = getTerrainHeightAt(cameraPos.x, cameraPos.z);
            const desiredTerrainHeight = terrainHeight !== null ? terrainHeight + TERRAIN_CONFIG.playerHeight : null;
            
            // Check if player is above terrain
            const isAboveTerrain = desiredTerrainHeight === null || cameraPos.y > desiredTerrainHeight + 0.5;
            
            if (!isAboveTerrain && terrainHeight !== null) {
                // Player is on terrain - calculate and apply slope physics
                const slopeAngle = calculateSlopeAngle(cameraPos.x, cameraPos.z);
                currentSlopeAngle = slopeAngle;
                slopeDirection = getSlopeDirection(cameraPos.x, cameraPos.z);
                
                // Determine if climbing or descending
                const isClimbing = slopeDirection.y > 0; // Positive Y slope = going uphill (inverse of before)
                const isDescending = slopeDirection.y < 0; // Negative Y slope = going downhill (inverse of before)
                const onSteepSlope = slopeAngle > PHYSICS_CONFIG.slideThreshold;
                const tooSteepToClimb = isClimbing && slopeAngle > PHYSICS_CONFIG.maxClimbAngle;
                
                // Modify movement friction based on terrain
                let frictionMultiplier = 1.0;
                
                if (tooSteepToClimb) {
                    // Block movement up the slope entirely
                    frictionMultiplier = 0.05; // Nearly complete stop
                } else if (onSteepSlope && isDescending) {
                    // Steep downslope - add sliding acceleration
                    frictionMultiplier = 0.80; // Less friction, allow sliding
                    // Add acceleration down slope
                    const slideForce = slopeDirection.multiplyScalar(PHYSICS_CONFIG.slideAcceleration);
                    cameraPos.x += slideForce.x;
                    cameraPos.z += slideForce.z;
                } else if (isClimbing && slopeAngle > 5) {
                    // Climbing slope - high friction resistance
                    frictionMultiplier = 0.15; // Very hard to climb
                } else if (isDescending && slopeAngle > 3) {
                    // Gentle descent
                    frictionMultiplier = 0.90; // Slight reduction
                } else {
                    // Flat terrain
                    frictionMultiplier = 1.0;
                }
                
                // Apply friction multiplier to movement module
                if (movementModule && movementModule.setFrictionMultiplier) {
                    movementModule.setFrictionMultiplier(frictionMultiplier);
                }
                
                // Keep player above terrain
                cameraPos.y = desiredTerrainHeight;
                
                camera.object3D.position.copy(cameraPos);
                isOnTerrain = true;
                fallingVelocity = 0;
            } else {
                // Player is in the air - apply gravity
                isOnTerrain = false;
                
                // Apply gravity acceleration
                fallingVelocity += PHYSICS_CONFIG.gravity * 0.016;
                
                // Cap fall speed
                const maxFallSpeed = 50;
                fallingVelocity = Math.min(fallingVelocity, maxFallSpeed);
                
                // Apply vertical gravity
                cameraPos.y -= fallingVelocity * 0.016;
                
                // Check if we've hit the terrain
                const newTerrainHeight = getTerrainHeightAt(cameraPos.x, cameraPos.z);
                if (newTerrainHeight !== null && cameraPos.y <= newTerrainHeight + TERRAIN_CONFIG.playerHeight) {
                    // Landing - set position to terrain and reset velocity
                    cameraPos.y = newTerrainHeight + TERRAIN_CONFIG.playerHeight;
                    fallingVelocity = 0;
                }
                
                camera.object3D.position.copy(cameraPos);
            }
            
            requestAnimationFrame(physicsUpdate);
        };
        
        physicsUpdate();
    };
    
    const getTerrainHeightAt = (x, z) => {
        if (!terrainMesh) return null;
        
        // Create a ray pointing downward
        const rayStart = new THREE.Vector3(x, 100, z);
        const rayDir = new THREE.Vector3(0, -1, 0);
        
        raycaster.set(rayStart, rayDir);
        const intersects = raycaster.intersectObject(terrainMesh);
        
        if (intersects.length > 0) {
            return intersects[0].point.y;
        }
        
        return null;
    };
    
    const calculateSlopeAngle = (x, z, movementDir) => {
        if (!terrainMesh) return 0;
        
        // Sample terrain heights in direction of movement
        const sampleDistance = PHYSICS_CONFIG.sampleDistance;
        const height1 = getTerrainHeightAt(x, z);
        
        if (height1 === null) return 0;
        
        // Sample ahead in movement direction
        let height2 = null;
        const movementLength = movementDir ? Math.sqrt(movementDir.x ** 2 + movementDir.z ** 2) : 0;
        
        if (movementLength > 0.001) {
            // Move in actual direction of input
            const dirNorm = new THREE.Vector2(movementDir.x, movementDir.z).normalize();
            height2 = getTerrainHeightAt(
                x + (dirNorm.x * sampleDistance),
                z + (dirNorm.y * sampleDistance)
            );
        } else {
            // No input, sample ahead in Z direction
            height2 = getTerrainHeightAt(x, z + sampleDistance);
        }
        
        if (height2 === null) return 0;
        
        const heightDiff = height2 - height1;
        const angle = Math.atan(heightDiff / sampleDistance) * (180 / Math.PI);
        
        return Math.max(-90, Math.min(angle, 90));
    };
    
    const getSlopeDirection = (x, z, movementDir) => {
        const sampleDistance = PHYSICS_CONFIG.sampleDistance;
        const height1 = getTerrainHeightAt(x, z);
        
        if (height1 === null) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Sample ahead in movement direction
        let height2 = null;
        const movementLength = movementDir ? Math.sqrt(movementDir.x ** 2 + movementDir.z ** 2) : 0;
        
        if (movementLength > 0.001) {
            // Sample in direction of actual movement
            const dirNorm = new THREE.Vector2(movementDir.x, movementDir.z).normalize();
            height2 = getTerrainHeightAt(
                x + (dirNorm.x * sampleDistance),
                z + (dirNorm.y * sampleDistance)
            );
        } else {
            // No input, sample down Z
            height2 = getTerrainHeightAt(x, z + sampleDistance);
        }
        
        if (height2 === null) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Normalize direction
        const direction = new THREE.Vector3(0, height2 - height1, sampleDistance);
        direction.normalize();
        
        return direction;
    };
    
    const applyClimbFriction = (inputVel) => {
        // Very high friction when climbing - significantly reduces movement
        const frictionFactor = 0.15; // Only 15% of velocity remains per frame (was 30%)
        inputVelocity.x *= frictionFactor;
        inputVelocity.z *= frictionFactor;
    };
    
    const applySlidingPhysics = (slopeDirection, cameraPos) => {
        // Apply sliding acceleration in slope direction
        const slideForce = new THREE.Vector3(
            slopeDirection.x * PHYSICS_CONFIG.slideAcceleration,
            slopeDirection.y * PHYSICS_CONFIG.slideAcceleration * 0.5,
            slopeDirection.z * PHYSICS_CONFIG.slideAcceleration
        );
        
        // Add gravity component for steeper slopes
        if (slopeDirection.y > 0) {
            slideForce.y += PHYSICS_CONFIG.gravity * 0.01;
        }
        
        inputVelocity.add(slideForce);
        
        // Cap sliding speed
        const horizontalSpeed = Math.sqrt(
            inputVelocity.x ** 2 + inputVelocity.z ** 2
        );
        
        if (horizontalSpeed > PHYSICS_CONFIG.slideMaxSpeed) {
            const scale = PHYSICS_CONFIG.slideMaxSpeed / horizontalSpeed;
            inputVelocity.x *= scale;
            inputVelocity.z *= scale;
        }
        
        // Apply drag friction even while sliding (reduced from 0.95 to 0.90)
        inputVelocity.x *= 0.90;
        inputVelocity.z *= 0.90;
    };
    
    const applyDescentPhysics = (slopeDirection, cameraPos) => {
        // Less friction on descent - allow sliding down
        const descentFriction = PHYSICS_CONFIG.friction * 0.85;
        inputVelocity.x *= descentFriction;
        inputVelocity.z *= descentFriction;
        
        // Slight acceleration down slope
        if (slopeDirection.y > 0) {
            const slideForce = slopeDirection.multiplyScalar(PHYSICS_CONFIG.slideAcceleration * 0.3);
            inputVelocity.add(slideForce);
        }
    };
    
    const applyFlatFriction = (inputVel) => {
        // Normal friction on flat terrain
        inputVelocity.x *= PHYSICS_CONFIG.friction;
        inputVelocity.z *= PHYSICS_CONFIG.friction;
    };
    
    const getPhysicsState = () => ({
        isOnTerrain,
        slopeAngle: currentSlopeAngle,
        slopeDirection: slopeDirection.clone(),
        velocity: inputVelocity.clone()
    });
    
    return {
        init: init,
        getPhysicsState: getPhysicsState,
        getConfig: () => PHYSICS_CONFIG
    };
})();

// Initialize physics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            PhysicsModule.init();
        }, 500); // Wait for terrain to fully load
    });
});
