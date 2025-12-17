// enhanced-controls.js - Enhanced controls with VR toggle and mobile swipe support

AFRAME.registerComponent('enhanced-camera-controls', {
    schema: {
        enabled: { default: true },
        sensitivity: { default: 2.0 },
        mobileSensitivity: { default: 1.0 },
        heightOffset: { default: 1.6 },
        moveSpeed: { default: 0.25 },
        runMultiplier: { default: 2.5 },
        showMobileControls: { default: true }
    },

    init: function() {
        this.canvasEl = document.querySelector('canvas');
        this.pointerLocked = false;
        this.isMobile = AFRAME.utils.device.isMobile();
        this.cameraEl = this.el;
        this.camera = this.el.object3D;

        // Touch state tracking
        this.touchActive = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;

        // Movement state
        this.isMoving = false;
        this.isRunning = false;

        // Velocity for smooth movement
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.verticalVelocity = 0;
        this.isOnGround = true;

        // Key states
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            shift: false,
            space: false
        };

        // Flag to track if controls are ready
        this.controlsReady = false;

        console.log("Enhanced controls initialized for", this.isMobile ? "mobile" : "desktop");

        // Bind methods
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onPointerLockError = this.onPointerLockError.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.toggleMovement = this.toggleMovement.bind(this);
        this.toggleRunning = this.toggleRunning.bind(this);

        // DON'T setup controls yet - wait for terrain to be selected
        // Listen for a custom event from start-screen
        document.addEventListener('terrainSelected', () => {
            this.initializeControls();
        });

        // Fallback: if scene is already visible (shouldn't happen with start screen)
        setTimeout(() => {
            const scene = document.querySelector('a-scene');
            if (scene && scene.style.display !== 'none' && !this.controlsReady) {
                this.initializeControls();
            }
        }, 1000);
    },

    initializeControls: function() {
        if (this.controlsReady) return; // Already initialized
        this.controlsReady = true;

        console.log("Initializing controls after terrain selection");

        // Setup controls based on device
        if (this.isMobile) {
            this.setupTouchControls();
        } else {
            this.setupMouseControls();
        }

        // Setup keyboard controls for desktop
        if (!this.isMobile) {
            document.addEventListener('keydown', this.onKeyDown);
            document.addEventListener('keyup', this.onKeyUp);
        }
    },

    setupMouseControls: function() {
        // Disable A-Frame's default look controls
        if (this.cameraEl.getAttribute('look-controls') !== null) {
            this.cameraEl.setAttribute('look-controls', 'enabled', false);
        }

        this.canvasEl.addEventListener('click', this.onMouseDown);

        document.addEventListener('pointerlockchange', this.onPointerLockChange);
        document.addEventListener('mozpointerlockchange', this.onPointerLockChange);
        document.addEventListener('webkitpointerlockchange', this.onPointerLockChange);

        document.addEventListener('pointerlockerror', this.onPointerLockError);
        document.addEventListener('mozpointerlockerror', this.onPointerLockError);
        document.addEventListener('webkitpointerlockerror', this.onPointerLockError);

        console.log("Mouse controls setup complete");
    },

    setupTouchControls: function() {
        console.log("Setting up touch controls for mobile");

        // Disable A-Frame's default look controls
        if (this.cameraEl.getAttribute('look-controls') !== null) {
            this.cameraEl.setAttribute('look-controls', 'enabled', false);
        }

        this.canvasEl.addEventListener('touchstart', this.onTouchStart, false);
        this.canvasEl.addEventListener('touchmove', this.onTouchMove, false);
        this.canvasEl.addEventListener('touchend', this.onTouchEnd, false);

        this.canvasEl.style.touchAction = 'none';
        document.body.style.touchAction = 'none';

        if (this.data.showMobileControls) {
            this.createMobileControls();
        }
    },

    createMobileControls: function() {
        // Create container for mobile controls
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.style.position = 'fixed';
        this.controlsContainer.style.bottom = '30px';
        this.controlsContainer.style.left = '50%';
        this.controlsContainer.style.transform = 'translateX(-50%)';
        this.controlsContainer.style.display = 'flex';
        this.controlsContainer.style.gap = '15px';
        this.controlsContainer.style.zIndex = '1000';

        // Movement toggle button
        this.moveButton = this.createControlButton('Move: OFF', 'rgba(0, 0, 0, 0.6)');
        this.moveButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleMovement();
        });

        // Run toggle button
        this.runButton = this.createControlButton('Run: OFF', 'rgba(0, 0, 0, 0.6)');
        this.runButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleRunning();
        });

        this.controlsContainer.appendChild(this.moveButton);
        this.controlsContainer.appendChild(this.runButton);
        document.body.appendChild(this.controlsContainer);

        console.log("Mobile controls created");
    },

    createControlButton: function(text, bgColor) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '15px 25px';
        button.style.border = 'none';
        button.style.borderRadius = '30px';
        button.style.backgroundColor = bgColor;
        button.style.color = 'white';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        button.style.transition = 'all 0.3s';
        button.style.userSelect = 'none';
        button.style.webkitUserSelect = 'none';
        return button;
    },

    toggleMovement: function() {
        this.isMoving = !this.isMoving;
        console.log("Movement toggled:", this.isMoving ? "ON" : "OFF");

        if (this.moveButton) {
            this.moveButton.textContent = this.isMoving ? 'Move: ON' : 'Move: OFF';
            this.moveButton.style.backgroundColor = this.isMoving 
                ? 'rgba(76, 175, 80, 0.7)' 
                : 'rgba(0, 0, 0, 0.6)';
        }
    },

    toggleRunning: function() {
        this.isRunning = !this.isRunning;
        console.log("Running toggled:", this.isRunning ? "ON" : "OFF");

        if (this.runButton) {
            this.runButton.textContent = this.isRunning ? 'Run: ON' : 'Run: OFF';
            this.runButton.style.backgroundColor = this.isRunning 
                ? 'rgba(255, 152, 0, 0.7)' 
                : 'rgba(0, 0, 0, 0.6)';
        }
    },

    onMouseDown: function(event) {
        if (event.target.closest('.a-enter-vr') || 
            event.target.closest('.a-orientation-modal')) {
            return;
        }

        if (!this.pointerLocked) {
            this.canvasEl.requestPointerLock = 
                this.canvasEl.requestPointerLock ||
                this.canvasEl.mozRequestPointerLock ||
                this.canvasEl.webkitRequestPointerLock;
            this.canvasEl.requestPointerLock();
        }
    },

    onTouchStart: function(event) {
        if (!this.data.enabled) return;
        if (event.target === this.canvasEl) {
            event.preventDefault();
        }

        if (event.touches.length === 1) {
            this.touchActive = true;
            this.lastTouchX = event.touches[0].clientX;
            this.lastTouchY = event.touches[0].clientY;
        }
    },

    onTouchMove: function(event) {
        if (!this.touchActive || !this.data.enabled) return;
        if (event.target === this.canvasEl) {
            event.preventDefault();
        }

        if (event.touches.length === 1) {
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;

            const movementX = touchX - this.lastTouchX;
            const movementY = touchY - this.lastTouchY;

            const sensitivity = this.data.mobileSensitivity / 200;

            // Horizontal rotation (yaw)
            this.camera.rotation.y -= movementX * sensitivity;

            // Vertical rotation (pitch) with clamping
            const currentPitch = this.camera.rotation.x;
            const newPitch = currentPitch - movementY * sensitivity;
            this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, newPitch));

            this.lastTouchX = touchX;
            this.lastTouchY = touchY;
        }
    },

    onTouchEnd: function(event) {
        this.touchActive = false;
    },

    onPointerLockChange: function() {
        this.pointerLocked = 
            document.pointerLockElement === this.canvasEl ||
            document.mozPointerLockElement === this.canvasEl ||
            document.webkitPointerLockElement === this.canvasEl;

        if (this.pointerLocked) {
            document.addEventListener('mousemove', this.onMouseMove, false);
            console.log("Pointer locked - mouse look enabled");
        } else {
            document.removeEventListener('mousemove', this.onMouseMove, false);
            console.log("Pointer unlocked");
        }
    },

    onPointerLockError: function() {
        console.error('Error obtaining pointer lock');
    },

    onMouseMove: function(event) {
        if (!this.pointerLocked || !this.data.enabled) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        const sensitivity = this.data.sensitivity / 1000;

        // Horizontal rotation (yaw)
        this.camera.rotation.y -= movementX * sensitivity;

        // Vertical rotation (pitch) with clamping
        const currentPitch = this.camera.rotation.x;
        const newPitch = currentPitch - movementY * sensitivity;
        this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, newPitch));
    },

    onKeyDown: function(event) {
        const key = event.key.toLowerCase();
        if (key === 'w') this.keys.w = true;
        if (key === 'a') this.keys.a = true;
        if (key === 's') this.keys.s = true;
        if (key === 'd') this.keys.d = true;
        if (event.code === 'ShiftLeft') this.keys.shift = true;
        if (event.code === 'Space') {
            this.keys.space = true;
            if (this.isOnGround) {
                this.verticalVelocity = 15; // Jump impulse
                this.isOnGround = false;
            }
        }
        // Toggle movement with T key
        if (key === 't') {
            this.toggleMovement();
        }
        // Toggle run with R key
        if (key === 'r' && !event.repeat) {
            this.toggleRunning();
        }
    },

    onKeyUp: function(event) {
        const key = event.key.toLowerCase();
        if (key === 'w') this.keys.w = false;
        if (key === 'a') this.keys.a = false;
        if (key === 's') this.keys.s = false;
        if (key === 'd') this.keys.d = false;
        if (event.code === 'ShiftLeft') this.keys.shift = false;
        if (event.code === 'Space') this.keys.space = false;
    },

    tick: function(time, delta) {
        if (!delta) return;
        delta = Math.min(delta, 50) * 0.001; // Convert to seconds, cap at 50ms

        const position = this.camera.position;
        const rotation = this.camera.rotation;

        // Calculate movement direction
        let moveDir = new THREE.Vector3();
        
        // Desktop: WASD controls
        if (!this.isMobile) {
            if (this.keys.w) moveDir.z -= 1;
            if (this.keys.s) moveDir.z += 1;
            if (this.keys.a) moveDir.x += 1;
            if (this.keys.d) moveDir.x -= 1;
            
            // Apply shift for running
            this.isRunning = this.keys.shift;
        } else {
            // Mobile: toggle movement (always forward)
            if (this.isMoving) {
                moveDir.z -= 1;
            }
        }

        // Apply movement if there's input
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            
            // Calculate speed with run multiplier
            const speed = this.data.moveSpeed * (this.isRunning ? this.data.runMultiplier : 1.0);
            
            // Rotate movement direction by camera yaw
            const angle = rotation.y;
            const moveX = -moveDir.x * Math.cos(angle) + moveDir.z * Math.sin(angle);
            const moveZ = moveDir.x * Math.sin(angle) + moveDir.z * Math.cos(angle);
            
            // Apply to velocity
            this.velocity.x = moveX * speed;
            this.velocity.z = moveZ * speed;
        } else {
            // Apply friction when no input
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
        }

        // Apply gravity
        if (!this.isOnGround) {
            this.verticalVelocity -= 35 * delta; // Gravity
        }

        // Update position
        position.x += this.velocity.x;
        position.z += this.velocity.z;
        position.y += this.verticalVelocity * delta;

        // Get terrain height
        const terrainHeight = this.getTerrainHeight(position.x, position.z);
        const targetHeight = terrainHeight + this.data.heightOffset;

        // Ground collision
        if (position.y <= targetHeight) {
            position.y = targetHeight;
            this.verticalVelocity = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }
    },

    getTerrainHeight: function(x, z) {
        const terrainMesh = TerrainModule.getTerrain();
        if (!terrainMesh) return 0;

        const raycaster = new THREE.Raycaster();
        const rayStart = new THREE.Vector3(x, 1000, z);
        const rayDir = new THREE.Vector3(0, -1, 0);

        raycaster.set(rayStart, rayDir);
        const intersects = raycaster.intersectObject(terrainMesh);

        if (intersects.length > 0) {
            return intersects[0].point.y;
        }

        return 0;
    },

    remove: function() {
        // Clean up event listeners
        this.canvasEl.removeEventListener('click', this.onMouseDown);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('mozpointerlockchange', this.onPointerLockChange);
        document.removeEventListener('webkitpointerlockchange', this.onPointerLockChange);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        
        this.canvasEl.removeEventListener('touchstart', this.onTouchStart);
        this.canvasEl.removeEventListener('touchmove', this.onTouchMove);
        this.canvasEl.removeEventListener('touchend', this.onTouchEnd);

        if (this.controlsContainer && this.controlsContainer.parentNode) {
            this.controlsContainer.parentNode.removeChild(this.controlsContainer);
        }
    }
});