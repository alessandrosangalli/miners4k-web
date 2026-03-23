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

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('SW registered!', reg);
        }).catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}

// Prevent double-tap to zoom on mobile
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
