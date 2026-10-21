// Adapted from kevinyu2003/BilibiliGiftDropper, app.js. See CREDITS.md.
export class GiftParticle {
    constructor(x, y, image, username, isAvatar, customParams = {}) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.username = username || '';
        this.isAvatar = isAvatar || false;
        
        // Use customParams directly since they are already fully resolved by triggerDrop
        const settings = customParams;
        this.world = settings.world;
        
        const sizeScale = settings.sizeScale !== undefined ? settings.sizeScale : 1.0;
        const gravityMultiplier = settings.gravity !== undefined ? settings.gravity : 0.6;
        const bouncinessVal = settings.bounciness !== undefined ? settings.bounciness : 0.45;
        const spinForce = settings.spin !== undefined ? settings.spin : 0.5;
        const restTimeVal = settings.restTime !== undefined ? settings.restTime : 5.0;
        const behaviorVal = settings.behavior !== undefined ? settings.behavior : 'settle';
        
        this.size = (Math.random() * 16 + 48) * sizeScale; // Base size: 48-64px, multiplied by size scale
        
        // Horizontal spawn speed scatter
        this.vx = (Math.random() - 0.5) * 6;
        // Vertical spawn speed (downwards)
        this.vy = Math.random() * 4 + 2; 
        
        this.gravity = gravityMultiplier * 0.4;
        this.bounciness = bouncinessVal;
        
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.2 * spinForce;
        
        this.opacity = 1.0;
        this.isResting = false;
        
        // Rest fade timers
        this.restDuration = restTimeVal * 1000; // convert to ms
        this.restStart = null;
        
        // Boundary behavior
        this.behavior = behaviorVal;
    }

    update(deltaTime) {
        if (this.isResting) {
            // Support check: verify if this particle is resting on the floor or on another resting particle below it
            let supported = false;
            const halfSize = this.size / 2;
            const floorLevel = this.world.height - halfSize;
            
            if (this.y >= floorLevel - 2) {
                // Supported directly by the floor
                supported = true;
            } else {
                // Check if supported by another resting particle below it
                for (let i = 0; i < this.world.particles.length; i++) {
                    const other = this.world.particles[i];
                    if (other === this || !other.isResting) continue;
                    
                    const dx = this.x - other.x;
                    const dy = this.y - other.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = halfSize + (other.size / 2);
                    
                    // Colliding, and 'other' is below 'this' (dy > 0 means other has a larger y position)
                    if (distSq < minDist * minDist * 1.05 && dy < 0) {
                        supported = true;
                        break;
                    }
                }
            }
            
            if (!supported) {
                // No longer supported (e.g. underlying particle faded out). Start falling again!
                this.isResting = false;
                this.restStart = null; // reset timer so it starts fresh when it lands again
            } else {
                // Still resting: apply friction and check the stay duration timer
                this.vx *= Math.pow(0.8, deltaTime);
                this.vy = 0;
                this.angularVelocity = 0;
                
                if (!this.restStart) {
                    this.restStart = Date.now();
                } else if (Date.now() - this.restStart > this.restDuration) {
                    // Snappy fade out (takes ~0.8s to fade completely at 60fps)
                    this.opacity -= 0.02 * deltaTime;
                    if (this.opacity <= 0) {
                        this.opacity = 0;
                    }
                }
                return;
            }
        }

        // Apply forces
        this.vy += this.gravity * deltaTime;
        
        // Apply rolling friction/air resistance
        this.vx *= Math.pow(0.98, deltaTime);
        this.angularVelocity *= Math.pow(0.95, deltaTime);

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.angle += this.angularVelocity * deltaTime;

        const halfSize = this.size / 2;

        // Collision bounds (Left / Right Walls)
        if (this.x - halfSize < 0) {
            this.x = halfSize;
            this.vx = -this.vx * 0.6; // Loss of energy on bounce
        } else if (this.x + halfSize > this.world.width) {
            this.x = this.world.width - halfSize;
            this.vx = -this.vx * 0.6;
        }

        // Stacking collision with other RESTING gifts
        if (this.behavior === 'settle') {
            for (let i = 0; i < this.world.particles.length; i++) {
                const other = this.world.particles[i];
                if (other === this || !other.isResting) continue;

                // Simple circular collision check
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const distSq = dx * dx + dy * dy;
                const minDist = halfSize + (other.size / 2);

                if (distSq < minDist * minDist) {
                    const dist = Math.sqrt(distSq) || 0.001;
                    const overlap = minDist - dist;
                    
                    // Collision normal vector (pointing from other to this)
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Push this particle out of the other particle
                    this.x += nx * overlap;
                    this.y += ny * overlap;

                    // Bounce velocity off the other particle
                    const vn = this.vx * nx + this.vy * ny;
                    if (vn < 0) {
                        const impulse = -vn * (1 + this.bounciness);
                        this.vx += nx * impulse;
                        this.vy += ny * impulse;
                        
                        // Transfer speed to rotation
                        this.angularVelocity += (this.vx * ny - this.vy * nx) * 0.05;
                    }

                    // Settle check: if we are landing on top of the other particle (normal pointing mostly up)
                    // and velocity is very low, make it rest
                    if (ny < -0.6 && Math.abs(this.vy) < 0.8 && Math.abs(this.vx) < 0.8) {
                        this.vx = 0;
                        this.vy = 0;
                        this.angularVelocity = 0;
                        this.isResting = true;
                        break;
                    }
                }
            }
        }

        // Floor collision
        if (this.behavior === 'settle') {
            const floorLevel = this.world.height - halfSize;
            if (this.y >= floorLevel) {
                this.y = floorLevel;
                
                // If velocity is high, bounce, else settle
                if (Math.abs(this.vy) > 1.2) {
                    this.vy = -this.vy * this.bounciness;
                    this.vx *= 0.8; // slide resistance on ground bounce
                } else {
                    this.vy = 0;
                    this.vx = 0;
                    this.angularVelocity = 0;
                    this.isResting = true;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        
        // Draw rotational transform
        ctx.rotate(this.angle);

        const halfSize = this.size / 2;
        
        if (this.isAvatar) {
            // Render beautiful circular avatar with dynamic borders
            ctx.beginPath();
            ctx.arc(0, 0, halfSize, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            
            // Draw picture
            try {
                if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
                    ctx.drawImage(this.image, -halfSize, -halfSize, this.size, this.size);
                } else {
                    // Draw dummy fallback shape
                    ctx.fillStyle = '#00a1d6';
                    ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
                }
            } catch (e) {
                ctx.fillStyle = '#ff6699';
                ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
            }
            
            // Draw a shiny pink/blue circular border on top of clip
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            ctx.beginPath();
            ctx.arc(0, 0, halfSize, 0, Math.PI * 2, true);
            ctx.strokeStyle = '#ff6699';
            ctx.lineWidth = 3;
            ctx.stroke();
            
        } else {
            // Draw standard gift image
            if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
                ctx.drawImage(this.image, -halfSize, -halfSize, this.size, this.size);
            }
        }

        ctx.restore();

        // Draw username label beneath the gift/avatar (Optional & Premium touch)
        if (this.username && this.opacity > 0.1) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            
            // Text stroke for legibility in transparent OBS overlay
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 3.5;
            ctx.strokeText(this.username, this.x, this.y + this.size / 2 + 15);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.username, this.x, this.y + this.size / 2 + 15);
            ctx.restore();
        }
    }
}