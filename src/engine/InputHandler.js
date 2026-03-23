export class InputHandler {
    constructor(canvas) {
        this.keys = new Set();
        this.xMouse = 0;
        this.yMouse = 0;
        this.mouseButton = 0;
        this.mouseWheelRotation = 0;

        window.addEventListener('keydown', (e) => this.keys.add(e.code));
        window.addEventListener('keyup', (e) => this.keys.delete(e.code));

        const updateMousePosition = (e) => {
            const rect = canvas.getBoundingClientRect();
            this.xMouse = (e.clientX - rect.left) / rect.width;
            this.yMouse = (e.clientY - rect.top) / rect.height;
        };

        window.addEventListener('mousemove', (e) => updateMousePosition(e));

        canvas.addEventListener('mousedown', (e) => {
            updateMousePosition(e);
            this.mouseButton = e.button === 2 || e.ctrlKey ? 3 : 1;
        });

        window.addEventListener('mouseup', () => {
            this.mouseButton = 0;
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    isKeyPressed(code) {
        return this.keys.has(code);
    }
}
