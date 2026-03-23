export class Miner {
    constructor(x, y, direction, initialFallDistance) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.walkAnimationStep = 0;
        this.jumpVelocity = -1;
        this.fallDistance = initialFallDistance;
        this.carryingGold = false;
        this.deathAnimationFrame = 0;
    }
    animate() { this.walkAnimationStep = (this.walkAnimationStep + 1) & 15; }
    jump() { this.jumpVelocity = 16; }
    die() { if (this.deathAnimationFrame === 0) this.deathAnimationFrame = 1; }
    isAlive() { return this.deathAnimationFrame === 0; }
    updateDeathAnimation() {
        if (this.deathAnimationFrame > 0 && this.deathAnimationFrame < 16) {
            this.deathAnimationFrame++;
        }
    }
    getDeathAnimationFrame() { return this.deathAnimationFrame; }
    getAnimationFrame() { return Math.floor(this.walkAnimationStep / 4); }
}
