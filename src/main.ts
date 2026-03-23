import './style.css'
import { Game } from './core/Game'

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if ((window as any).game) {
        (window as any).game.resize(window.innerWidth, window.innerHeight);
    }
}
window.addEventListener('resize', onResize);

const game = new Game(canvas);
(window as any).game = game;
onResize(); // Initial resize

console.log("Miners4k Web Engine Initialized and Loop Started!");
