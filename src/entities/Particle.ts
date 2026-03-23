export class Particle {
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;
    public color: number;
    public life: number; // Frames remaining
    public maxLife: number;
    public gravity: number = 0.2;

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
        this.vy += this.gravity;
        this.life--;
    }

    public isDead(): boolean {
        return this.life <= 0;
    }
}
