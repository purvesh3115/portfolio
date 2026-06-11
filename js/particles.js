/* ==========================================================================
   INTERACTIVE CANVAS PARTICLE BACKDROP SYSTEM
   ========================================================================== */

class ParticleNetwork {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 50;
        this.connectionDistance = 150;
        
        this.mouse = {
            x: null,
            y: null,
            radius: 100
        };

        this.init();
        this.animate();
        this.bindEvents();
    }

    init() {
        this.resizeCanvas();
        this.particles = [];

        const densityMultiplier = window.innerWidth < 768 ? 0.4 : 1.0;
        const currentCount = Math.floor(this.particleCount * densityMultiplier);

        for (let i = 0; i < currentCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.3 + 0.1,
            baseAlpha: Math.random() * 0.3 + 0.1
        };
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -1;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -1;
            }

            particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));

            if (this.mouse.x && this.mouse.y) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    particle.vx = Math.cos(angle) * 2;
                    particle.vy = Math.sin(angle) * 2;
                }
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    this.ctx.strokeStyle = `rgba(0, 180, 216, ${0.2 * (1 - distance / this.connectionDistance)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = `rgba(0, 180, 216, ${particle.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ParticleNetwork();
    });
} else {
    new ParticleNetwork();
}
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.init();
        });

        // Mouse hover tracking
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Clear mouse tracking on leave
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    animate() {
        // Run animation loop only if tab is currently visible
        if (document.visibilityState === 'visible') {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawParticles();
            this.drawConnections();
        }
        
        requestAnimationFrame(() => this.animate());
    }

    drawParticles() {
        this.particles.forEach((p) => {
            // Standard drift velocity
            p.x += p.vx;
            p.y += p.vy;

            // Bounce on canvas wall borders
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Mouse Avoidance Physics (Repelling Force)
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const distance = Math.hypot(dx, dy);

                if (distance < this.mouse.radius) {
                    // Calculate repulsion vector strength
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;

                    // Push particle slightly
                    p.x += forceDirectionX * force * 1.5;
                    p.y += forceDirectionY * force * 1.5;
                    
                    // Temporarily boost glow/alpha when mouse is near
                    p.alpha = Math.min(p.baseAlpha * 2, 0.95);
                } else {
                    // Decay back to base alpha
                    if (p.alpha > p.baseAlpha) {
                        p.alpha -= 0.01;
                    }
                }
            }

            // Render Particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})`; // Cyan accent
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';
            this.ctx.fill();
        });
        
        // Reset shadow for performance
        this.ctx.shadowBlur = 0;
    }

    drawConnections() {
        const length = this.particles.length;
        
        for (let i = 0; i < length; i++) {
            for (let j = i + 1; j < length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.hypot(dx, dy);

                // Draw translucent link if particles are close
                if (dist < this.connectionDistance) {
                    const alpha = (1 - dist / this.connectionDistance) * 0.12;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    
                    // Color blending gradient style
                    this.ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`; // Violet connections
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            }
        }
    }
}

// Instantiate particle canvas when content is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork();
});
