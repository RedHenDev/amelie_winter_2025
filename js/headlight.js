// headlight.js - Attaches powerful exploration lights to the camera

const HeadlightModule = (() => {
    const config = {
        enabled: true,
        // Main spotlight beam
        mainLightColor: '#ffffff',
        mainLightIntensity: 6.0,
        mainLightDistance: 85,
        
        // Secondary accent lights for limited atmospheric depth
        accentColor1: '#4488ff',
        accentIntensity1: 2.5,
        accentDistance1: 65,
        
        accentColor2: '#00ddff',
        accentIntensity2: 1.2,
        accentDistance2: 55
    };

    const init = () => {
        console.log('Headlight module initialized');
        attachHeadlights();
    };

    const attachHeadlights = () => {
        const camera = document.getElementById('camera');
        if (!camera) {
            setTimeout(attachHeadlights, 100);
            return;
        }

        // Main powerful spotlight - straight ahead
        const mainLight = document.createElement('a-light');
        mainLight.setAttribute('type', 'point');
        mainLight.setAttribute('color', config.mainLightColor);
        mainLight.setAttribute('intensity', config.mainLightIntensity);
        mainLight.setAttribute('distance', config.mainLightDistance);
        mainLight.setAttribute('position', '0 0 -0.5');
        camera.appendChild(mainLight);

        // Accent light 1 - right side, blue tint
        const accentLight1 = document.createElement('a-light');
        accentLight1.setAttribute('type', 'point');
        accentLight1.setAttribute('color', config.accentColor1);
        accentLight1.setAttribute('intensity', config.accentIntensity1);
        accentLight1.setAttribute('distance', config.accentDistance1);
        accentLight1.setAttribute('position', '20 0 -15');
        camera.appendChild(accentLight1);

        // Accent light 2 - left side, cyan tint
        const accentLight2 = document.createElement('a-light');
        accentLight2.setAttribute('type', 'point');
        accentLight2.setAttribute('color', config.accentColor2);
        accentLight2.setAttribute('intensity', config.accentIntensity2);
        accentLight2.setAttribute('distance', config.accentDistance2);
        accentLight2.setAttribute('position', '-15 0 -12');
        camera.appendChild(accentLight2);

        console.log('Headlights attached to camera');
    };

    return {
        init: init,
        getConfig: () => config,
        setEnabled: (enabled) => {
            config.enabled = enabled;
        }
    };
})();

// Initialize headlights when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        setTimeout(() => {
            HeadlightModule.init();
        }, 500);
    } else {
        scene.addEventListener('loaded', () => {
            setTimeout(() => {
                HeadlightModule.init();
            }, 500);
        });
    }
});
