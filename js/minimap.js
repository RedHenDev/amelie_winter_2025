// minimap.js - Displays a minimap using the heightmap texture

const MinimapModule = (() => {
    const config = {
        heightmapPath: 'assets/heightmap.png',
        size: 256, // Minimap size in pixels
        position: { x: 'right', y: 'top' },
        margin: 10, // Pixels from edge
        playerDotSize: 8,
        playerDotColor: '#ffffff',
        playerOutlineColor: '#000000',
        playerOutlineWidth: 2
    };
    
    const init = () => {
        createMinimap();
        console.log('Minimap module initialized');
    };
    
    const createMinimap = () => {
        // Create canvas for minimap
        const canvas = document.createElement('canvas');
        canvas.id = 'minimap';
        canvas.width = config.size;
        canvas.height = config.size;
        
        const ctx = canvas.getContext('2d');
        
        // Load heightmap image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            // Draw heightmap image scaled to minimap
            ctx.drawImage(img, 0, 0, config.size, config.size);
            
            // Add border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, config.size, config.size);
            
            // Start animation loop to update player position
            updateMinimapPlayerPosition(canvas, ctx, img);
        };
        
        img.onerror = () => {
            console.warn('Heightmap not found, minimap will not display');
        };
        
        img.src = config.heightmapPath;
        
        // Style the canvas
        canvas.style.position = 'fixed';
        canvas.style.top = config.margin + 'px';
        canvas.style.right = config.margin + 'px';
        canvas.style.zIndex = '100';
        canvas.style.border = '2px solid white';
        canvas.style.borderRadius = '4px';
        canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        canvas.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.7)';
        
        // Add to DOM
        document.body.appendChild(canvas);
    };
    
    const updateMinimapPlayerPosition = (canvas, ctx, heightmapImg) => {
        const camera = document.getElementById('camera');
        const terrainConfig = TERRAIN_CONFIG;
        
        const updateTick = () => {
            if (!camera || !terrainConfig) {
                requestAnimationFrame(updateTick);
                return;
            }
            
            // Redraw heightmap
            ctx.drawImage(heightmapImg, 0, 0, config.size, config.size);
            
            // Add border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, config.size, config.size);
            
            // Get camera position.
            const cameraPos = camera.object3D.position;
            const cameraRot = camera.object3D.rotation;
            
            // Map world position to minimap coordinates
            const terrainHalfScale = terrainConfig.terrainScale / 2;
            const minimapX = ((cameraPos.x + terrainHalfScale) / terrainConfig.terrainScale) * config.size;
            const minimapY = ((cameraPos.z + terrainHalfScale) / terrainConfig.terrainScale) * config.size;
            
            // Draw player dot with outline
            // Draw black outline first
            ctx.fillStyle = config.playerOutlineColor;
            ctx.beginPath();
            ctx.arc(minimapX, minimapY, config.playerDotSize / 2 + config.playerOutlineWidth, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw white dot on top
            ctx.fillStyle = config.playerDotColor;
            ctx.beginPath();
            ctx.arc(minimapX, minimapY, config.playerDotSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw arrow pointing in forward direction
            // Camera rotation.y is yaw (rotation around Y axis)
            const arrowLength = config.playerDotSize * 1.5;
            const arrowX = minimapX + Math.sin(-cameraRot.y) * arrowLength;
            const arrowY = minimapY - Math.cos(-cameraRot.y) * arrowLength;
            
            // Draw arrow shaft with black outline
            ctx.strokeStyle = config.playerOutlineColor;
            ctx.lineWidth = 2 + config.playerOutlineWidth;
            ctx.beginPath();
            ctx.moveTo(minimapX, minimapY);
            ctx.lineTo(arrowX, arrowY);
            ctx.stroke();
            
            // Draw arrow shaft in white
            ctx.strokeStyle = config.playerDotColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(minimapX, minimapY);
            ctx.lineTo(arrowX, arrowY);
            ctx.stroke();
            
            // Draw arrow head with outline
            const arrowHeadSize = 4;
            const angle1 = -cameraRot.y + Math.PI * 0.75;
            const angle2 = -cameraRot.y - Math.PI * 0.75;
            
            // Black outline for arrow head
            ctx.strokeStyle = config.playerOutlineColor;
            ctx.lineWidth = 2 + config.playerOutlineWidth;
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX + Math.sin(angle1) * arrowHeadSize,
                arrowY - Math.cos(angle1) * arrowHeadSize
            );
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX + Math.sin(angle2) * arrowHeadSize,
                arrowY - Math.cos(angle2) * arrowHeadSize
            );
            ctx.stroke();
            
            // White arrow head on top
            ctx.strokeStyle = config.playerDotColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX + Math.sin(angle1) * arrowHeadSize,
                arrowY - Math.cos(angle1) * arrowHeadSize
            );
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX + Math.sin(angle2) * arrowHeadSize,
                arrowY - Math.cos(angle2) * arrowHeadSize
            );
            ctx.stroke();
            
            requestAnimationFrame(updateTick);
        };
        
        updateTick();
    };
    
    return {
        init: init,
        getConfig: () => config
    };
})();

// Initialize minimap
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        MinimapModule.init();
    } else {
        scene.addEventListener('loaded', () => {
            setTimeout(() => {
                MinimapModule.init();
            }, 300);
        });
    }
});
