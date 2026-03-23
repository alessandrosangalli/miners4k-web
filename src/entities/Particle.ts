export class Particle {
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;
    public color: number;
    public life: number; 
    public maxLife: number;
    public gravity: number = 0.2;
    public friction: number = 0.98;

    constructor(x: number, y: number, vx: number, vy: number, color: number, life: number) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    public update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.life--;
    }

    public isDead(): boolean {
        return this.life <= 0;
    }

    public getAlpha(): number {
        return Math.min(1.0, this.life / (this.maxLife * 0.5));
    }
}
