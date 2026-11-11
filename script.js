const canvas = document.getElementById('symbioteCanvas');
const ctx = canvas.getContext('2d');
const core = document.getElementById('core');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false
};

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});

let coreCenter = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};

// Muito mais tentáculos (massa densa), porém curtos e controlados
const tentacleCount = 28;
let tentacles = [];

for (let i = 0; i < tentacleCount; i++) {
    tentacles.push({
        angle: (i / tentacleCount) * Math.PI * 2,
        attached: false,
        anchorX: 0,
        anchorY: 0,
        // Limites individuais para que soltem em momentos diferentes (gradual)
        breakDistance: 130 + Math.random() * 90,
        // Pequena variação estática para dar volume orgânico sem ficar balançando loucamente
        baseOffset: Math.random() * Math.PI * 2
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rect = core.getBoundingClientRect();
    coreCenter.x = rect.left + rect.width / 2;
    coreCenter.y = rect.top + rect.height / 2;

    let dx = mouse.x - coreCenter.x;
    let dy = mouse.y - coreCenter.y;
    let distanceToMouse = Math.sqrt(dx * dx + dy * dy);

    // Efeito de estiramento físico do núcleo inteiro na direção do mouse
    let corePull = Math.max(0, 1 - distanceToMouse / 280);
    core.style.transform = `translate(${dx * corePull * 0.08}px, ${dy * corePull * 0.08}px) scale(${1 + corePull * 0.07})`;

    // ORDENAR DESENHO: Renderiza a massa viscosa em camadas suaves
    tentacles.forEach((t, index) => {
        let baseAngle = t.angle;
        // Ponto de saída na borda do núcleo
        let startX = coreCenter.x + Math.cos(baseAngle) * 78;
        let startY = coreCenter.y + Math.sin(baseAngle) * 78;

        // FAIXA DE GRUDE EXATA: Entre 20px e 40px do mouse
        let isInsideGrabZone = distanceToMouse >= 15 && distanceToMouse <= 45;

        // Lógica de fixação
        if (isInsideGrabZone) {
            if (!t.attached) {
                t.attached = true;
                t.anchorX = mouse.x;
                t.anchorY = mouse.y;
            }
        }

        let targetX, targetY;

        if (t.attached) {
            // Distância atual que o tentáculo foi esticado desde a base
            let currentStretch = Math.sqrt((mouse.x - startX)**2 + (mouse.y - startY)**2);

            // DESCOLAMENTO GRADUAL: Se afastar além do limite do tentáculo ou o mouse sair de perto
            if (currentStretch > t.breakDistance || distanceToMouse > 180) {
                t.attached = false;
            } else {
                // Cola firmemente e acompanha o movimento do mouse com inércia de massa fluida
                t.anchorX += (mouse.x - t.anchorX) * 0.5;
                t.anchorY += (mouse.y - t.anchorY) * 0.5;
                targetX = t.anchorX;
                targetY = t.anchorY;
            }
        }

        if (!t.attached) {
            // Retrai o tentáculo suavemente de volta para o corpo
            t.anchorX += (startX - t.anchorX) * 0.15;
            t.anchorY += (startY - t.anchorY) * 0.15;
            targetX = t.anchorX;
            targetY = t.anchorY;

            // Se o mouse estiver relativamente perto, os tentáculos apontam levemente na direção dele (comportamento de busca coeso)
            if (distanceToMouse < 280) {
                let angleToMouse = Math.atan2(mouse.y - startY, mouse.x - startX);
                // Mescla o ângulo original com o ângulo do mouse de forma sutil (sem ficar chacoalhando)
                let blendedAngle = baseAngle + (angleToMouse - baseAngle) * 0.4;
                let shortReach = 18 + Math.sin(Date.now() * 0.002 + t.baseOffset) * 6; // Curtos e densos
                targetX = startX + Math.cos(blendedAngle) * shortReach;
                targetY = startY + Math.sin(blendedAngle) * shortReach;
            } else {
                // Em repouso, formato de massa redonda e firme
                let restRadius = 15;
                targetX = startX + Math.cos(baseAngle) * restRadius;
                targetY = startY + Math.sin(baseAngle) * restRadius;
            }
        }

        // Estilo de massa viscosa espessa (linhas mais grossas e fluidas)
        let len = Math.sqrt((targetX - startX)**2 + (targetY - startY)**2);
        let thickness = Math.max(3, 14 * (1 - len / 250));

        // Curva suave e orgânica (sem tremulação caótica)
        let midX = (startX + targetX) / 2;
        let midY = (startY + targetY) / 2;

        // Sombra de profundidade da gosma
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, targetX, targetY);
        ctx.strokeStyle = '#050508';
        ctx.lineWidth = thickness + 5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Corpo principal da massa com tom escuro vivo
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, targetX, targetY);
        ctx.strokeStyle = '#181824';
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Brilho metálico/líquido característico do Venom na superfície do tentáculo
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, targetX, targetY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = thickness * 0.28;
        ctx.lineCap = 'round';
        ctx.stroke();
    });

    requestAnimationFrame(animate);
}

animate();