import { Game } from "../game/core/Engine";
import { Input, KeyCode } from "../game/core/Input";
import { EditorWorld } from "./EditorWorld";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import {
    Vector3,
    Vector2,
    MeshBasicMaterial,
    Mesh,
    Scene,
    OrthographicCamera,
    AdditiveBlending,
    TextureLoader,
    NearestFilter,
    PlaneGeometry,
} from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "../game/data/Globals";
import { PlaceBlockTool } from "./tools/PlaceBlockTool";
import { TextureSelectTool } from "./tools/TextureSelectTool";
import { FillBlockTool } from "./tools/FillBlockTool";

export class GameEditor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
    public readonly hud = {
        scene: new Scene(),
        camera: new OrthographicCamera(
            -HUD_WIDTH / 2,
            HUD_WIDTH / 2,
            HUD_HEIGHT / 2,
            -HUD_HEIGHT / 2,
            0,
            30
        )
    };

    public currTool = 0;
    public prevTool = 0;
    public readonly toolPanel = document.createElement("canvas");
    public readonly toolArray = [
        new PlaceBlockTool(this),
        new FillBlockTool(this),
        new TextureSelectTool(this)
    ];

    public preload(): Promise<any> {
        return Promise.all([

            // Load level tileset texture
            new Promise(resolve => {
                new TextureLoader().load("/assets/tileset.png", map => {
                    this.world.level.textrue = map;
                    resolve();
                });
            }),

            // Load crosshair cursor
            new Promise(resolve => {
                new TextureLoader().load("/assets/sprites/crosshair.png", map => {
                    const material = new MeshBasicMaterial({
                        map,
                        blending: AdditiveBlending
                    });

                    map.magFilter = NearestFilter;
                    map.minFilter = NearestFilter;

                    const geometry = new PlaneGeometry(64, 64);
                    const crosshair = new Mesh(geometry, material);
                    this.hud.scene.add(crosshair);
                    resolve();
                });
            })
        ]);
    }

    public create() {
        console.log(`> Editor::created`);

        // Create toolpanel
        this.toolPanel.width = 256;
        this.toolPanel.height = 124;
        this.toolPanel.style.position = "absolute";
        this.renderToolPanel();
        document.body.appendChild(this.toolPanel);
    }

    public update(dt: number) {
        const prevIndex = this.currTool;
        this.toolArray[this.currTool].update();

        for (let i = 0; i < this.toolArray.length; i++) {
            const tool = this.toolArray[i];
            if (this.input.isKeyPressed(tool.hotkey)) {
                this.currTool = i;
            }
        }

        if (this.currTool !== prevIndex) {
            this.prevTool = prevIndex;
            this.toolArray[this.currTool].selected();
            this.renderToolPanel();
        }

        this.updateControlls(dt);

        this.input.clear();
    }

    private updateControlls(dt: number) {
        // Mouse look
        const str = 0.1;
        const dx = this.input.mouse.dx;
        const dy = this.input.mouse.dy;
        const rotation = this.world.camera.rotation.clone();
        rotation.y -= dx * str * dt;
        rotation.x -= dy * str * dt;
        rotation.y = modulo(rotation.y, Math.PI * 2);
        rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
        this.world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

        // Move
        const forward = this.input.isKeyDown(KeyCode.W);
        const backward = this.input.isKeyDown(KeyCode.S);
        const left = this.input.isKeyDown(KeyCode.A);
        const right = this.input.isKeyDown(KeyCode.D);
        const up = this.input.isKeyDown(KeyCode.SPACE);
        const down = this.input.isKeyDown(KeyCode.SHIFT);

        const move = new Vector2();
        move.x = (left ? -1 : 0) + (right ? 1 : 0);
        move.y = (forward ? -1 : 0) + (backward ? 1 : 0);
        if (move.x !== 0 || move.y !== 0) {
            move.rotateAround(new Vector2(), -rotation.y);
        }

        const fly = (down ? -1 : 0) + (up ? 1 : 0);
        const velocity = new Vector3(move.x, fly, move.y);
        velocity
            .normalize()
            .multiplyScalar(5)
            .multiplyScalar(dt);
        this.world.camera.position.add(velocity);
    }

    private renderToolPanel() {
        const ctx = this.toolPanel.getContext("2d");
        if (ctx === null) return;

        ctx.font = "24px Arial";
        ctx.textAlign = "left";

        this.toolArray.forEach((tool, index) => {
            const key = KeyCode[tool.hotkey];
            const active = index === this.currTool;
            const offsety = (index + 1) * 32;

            ctx.fillStyle = active ? "orange" : "white";

            ctx.fillText(`[${key}]`, 16, offsety);
            ctx.fillText(tool.name, 64, offsety);
        });
    }
}
