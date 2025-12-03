// tunnels.js - Creates interconnected tunnel systems

const TunnelModule = (() => {
    const createTunnels = () => {
        const tunnelContainer = document.getElementById('tunnel-container');
        
        // Horizontal tunnel 1
        createTunnel(tunnelContainer, -40, -5, 0, 60, 'horizontal');
        
        // Horizontal tunnel 2
        createTunnel(tunnelContainer, 0, -8, -50, 50, 'horizontal');
        
        // Vertical tunnel (connects upper and lower areas)
        createVerticalTunnel(tunnelContainer, 40, 0, -30, 35);
    };
    
    const createTunnel = (parent, posX, posY, posZ, length, orientation) => {
        const tunnel = document.createElement('a-entity');
        tunnel.setAttribute('position', `${posX} ${posY} ${posZ}`);
        
        const radius = 5;
        const segments = Math.floor(length / 5);
        
        for (let i = 0; i < segments; i++) {
            const segmentX = i * 5;
            const segment = document.createElement('a-entity');
            segment.setAttribute('geometry', 'primitive: cylinder; radius: 5; height: 5');
            segment.setAttribute('rotation', orientation === 'horizontal' ? '0 0 90' : '0 0 0');
            segment.setAttribute('position', orientation === 'horizontal' ? `${segmentX} 0 0` : `0 ${segmentX * -1} 0`);
            segment.setAttribute('material', 'color: #90b8d8; side: back; metalness: 0.5; roughness: 0.4');
            segment.setAttribute('shadow', 'receive: true');
            tunnel.appendChild(segment);
        }
        
        parent.appendChild(tunnel);
    };
    
    const createVerticalTunnel = (parent, posX, posY, posZ, height) => {
        const tunnel = document.createElement('a-entity');
        tunnel.setAttribute('position', `${posX} ${posY} ${posZ}`);
        
        const shaft = document.createElement('a-entity');
        shaft.setAttribute('geometry', 'primitive: cylinder; radius: 4; height: 40');
        shaft.setAttribute('material', 'color: #80a8c8; side: back; metalness: 0.5; roughness: 0.4');
        shaft.setAttribute('shadow', 'receive: true');
        tunnel.appendChild(shaft);
        
        parent.appendChild(tunnel);
    };
    
    return {
        init: createTunnels
    };
})();

// Initialize tunnels
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            TunnelModule.init();
        }, 150);
    });
});
