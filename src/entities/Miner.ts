export class Miner {
    public x: number;
    public y: number;
    public direction: number; // -1 for left, 1 for right
    public walkAnimationStep: number = 0;
    public jumpVelocity: number = -1; // -1 = on ground, 16 = max jump
    public fallDistance: number = 0;
    public carryingGold: boolean = false;
    private deathAnimationFrame: number = 0; // 0 if alive, 1-16 for death animation

    constructor(x: number, y: number, direction: number, initialFallDistance: number) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.fallDistance = initialFallDistance;
    }

    public animate(): void {
        this.walkAnimationStep = (this.walkAnimationStep + 1) & 15;
    }

    public jump(): void {
        this.jumpVelocity = 16;
    }

    public die(): void {
        if (this.deathAnimationFrame === 0) this.deathAnimationFrame = 1;
    }

    public isAlive(): boolean {
        return this.deathAnimationFrame === 0;
    }

    public updateDeathAnimation(): void {
        if (this.deathAnimationFrame > 0 && this.deathAnimationFrame < 16) {
            this.deathAnimationFrame++;
        }
    }

    public getDeathAnimationFrame(): void {
        return; // deathAnimationFrame getter handled inline or below
    }

    public getAnimationFrame(): number {
        return Math.floor(this.walkAnimationStep / 4);
    }
}
