import { Renderer } from "./Renderer";
import { Input } from "./Input";
import { Game } from "../Game";

export class Engine {
    private readonly renderer: Renderer;
    private readonly gamearea: HTMLDivElement;
    private readonly viewport: HTMLCanvasElement;

    private readonly game: Game;
    private gameTime = 0;
    private aspect = 1;

    public readonly input = new Input({ requestPointerLock: true });

    public constructor(canvas: HTMLCanvasElement, gamearea: HTMLDivElement) {
        this.viewport = canvas;
        this.gamearea = gamearea;
        this.renderer = new Renderer(this.viewport);
        this.game = new Game(this.input);
    }

    public start(width: number, height: number) {
        this.viewport.width = width;
        this.viewport.height = height;

        // Calc aspect ratio
        if (width > height) {
            this.aspect = width / height;
        } else {
            this.aspect = height / width;
        }

        // Events
        window.addEventListener("resize", this.onWindowResize.bind(this));

        // Call resize manually once
        this.onWindowResize();

        // Start game
        this.game.onStart();

        // Start game loop
        this.loop(0);
    }

    private update(dt: number) {
        this.game.update(dt);
        this.renderer.webgl.render(this.game.scene, this.game.camera);
        this.input.clear();
    }

    private loop(gameTime: number) {
        const lastTime = this.gameTime;
        this.gameTime = gameTime;

        const delta = (this.gameTime - lastTime) * 0.001;
        this.update(delta);

        requestAnimationFrame(this.loop.bind(this));
    }

    private onWindowResize() {
        let width = 0;
        let height = 0;

        const windowAspect = window.innerWidth / window.innerHeight;
        if (windowAspect >= this.aspect) {
            // Horizontal
            height = window.innerHeight;
            width = Math.round(height * this.aspect);
        } else {
            // Vertical
            width = window.innerWidth;
            height = Math.round(width / this.aspect);
        }

        // Update camera
        this.game.camera.aspect = this.aspect;
        this.game.camera.near = 0.1;
        this.game.camera.far = 1000;
        this.game.camera.updateProjectionMatrix();

        // Update gamearea to center the viewport
        this.gamearea.style.width = width + "px";
        this.gamearea.style.height = height + "px";
        this.gamearea.style.marginLeft = -(width / 2) + "px";
        this.gamearea.style.marginTop = -(height / 2) + "px";

        // Update renderer
        this.renderer.onResize(width, height);
    }
}
