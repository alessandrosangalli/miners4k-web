export class FloatingText {
    public x: number;
    public y: number;
    public text: string;
    public color: string;
    public life: number;
    public maxLife: number;
    public velocityY: number;

    constructor(x: number, y: number, text: string, color: string = '#FFDE00') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 40; // ~1 second
        this.maxLife = 40;
        this.velocityY = -1.0;
    }

    public update(): void {
        this.y += this.velocityY;
        this.velocityY *= 0.95; // Decelerate upward movement
        this.life--;
    }

    public isDead(): boolean {
        return this.life <= 0;
    }

    public getOpacity(): number {
        return this.life / this.maxLife;
    }
}
