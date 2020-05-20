import { WebGLRenderer, Scene, Camera, PerspectiveCamera } from "three";
import { clamp } from "lodash";
import { Settings } from "../Settings";

export interface Game {
    readonly world: { scene: Scene; camera: PerspectiveCamera };
    readonly hud: { layers: Scene[]; camera: Camera };
    preload(): Promise<any>;
    create(): void;
    update(dt: number): void;
}

export class Engine {
    private readonly renderer: WebGLRenderer;
    private readonly gamearea: HTMLDivElement;
    private readonly viewport: HTMLCanvasElement;
    private readonly game: Game;
    private gameTime = 0;
    private aspect = 1;

    public constructor(
        game: Game,
        canvas: HTMLCanvasElement,
        gamearea: HTMLDivElement
    ) {
        this.game = game;
        this.viewport = canvas;
        this.gamearea = gamearea;
        this.renderer = new WebGLRenderer({
            canvas: this.viewport,
            antialias: Settings.props.antialiasing,
        });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0x6495ed);
        this.renderer.setPixelRatio(Settings.props.renderResolution);
        this.renderer.toneMapping = Settings.props.toneMapping;
        this.renderer.toneMappingExposure = Settings.props.toneMappingExposure;
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

        this.game.preload().then(() => {
            this.game.create(); // Start game
            this.loop(0); // Start game loop
        });
    }

    private update(dt: number) {
        const { world, hud } = this.game;
        this.game.update(dt);
        this.renderer.render(world.scene, world.camera);
        for (let i = 0; i < hud.layers.length; i++) {
            this.renderer.render(hud.layers[i], hud.camera);
        }
    }

    private loop(gameTime: number) {
        const lastTime = this.gameTime;
        this.gameTime = gameTime;

        let delta = (this.gameTime - lastTime) * 0.001;
        delta = clamp(delta, 1 / 120, 1);
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
        const camera = this.game.world.camera;
        camera.aspect = this.aspect;
        camera.near = 0.1;
        camera.far = 1000;
        camera.updateProjectionMatrix();

        // Update gamearea to center the viewport
        this.gamearea.style.width = width + "px";
        this.gamearea.style.height = height + "px";
        this.gamearea.style.marginLeft = -(width / 2) + "px";
        this.gamearea.style.marginTop = -(height / 2) + "px";

        // Update renderer
        this.renderer.setSize(width, height);
    }
}
