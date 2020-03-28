import { Game } from "../game/core/Engine";
import {
    Scene,
    OrthographicCamera,
    TextureLoader,
    Vector2,
    Vector3
} from "three";
import { EditorWorld } from "./data/EditorWorld";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { clamp } from "lodash";
import { modulo } from "../game/core/Utils";
import { TextureBar } from "./hud/TextureBar";

export const VIEW_WIDTH = 1920;
export const VIEW_HEIGHT = 1080;

export enum EditorState {
    Editor,
    ToolSelect,
    TextureSelect
}

export class Editor implements Game {
    public state = EditorState.Editor;
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
    public readonly hud = {
        scene: new Scene(),
        camera: new OrthographicCamera(
            -VIEW_WIDTH / 2,
            VIEW_WIDTH / 2,
            VIEW_HEIGHT / 2,
            -VIEW_HEIGHT / 2,
            0,
            30
        ),
        textrueBar: new TextureBar()
    };

    public preload(): Promise<any> {
        return new Promise(resolve => {
            new TextureLoader().load("/assets/tileset.png", map => {
                this.world.level.textrue = map;
                resolve();
            });
        });
    }

    public create(): void {
        this.hud.scene.add(this.hud.textrueBar.scene);
    }

    public update(dt: number) {
        this.stateMachine(dt);
        this.input.clear();
    }

    private setState(state: EditorState) {
        const prev = EditorState[this.state];
        const next = EditorState[state];
        console.log(`> EditorState: ${prev} => ${next}`);

        this.state = state;

        if (this.state === EditorState.Editor) {
            // ...
        }

        if (this.state === EditorState.ToolSelect) {
            // ...
        }

        if (this.state === EditorState.TextureSelect) {
            // ...
        }
    }

    private stateMachine(dt: number) {
        if (this.state === EditorState.Editor) {
            if (this.input.isMouseDown(MouseBtn.Right)) {
                return this.setState(EditorState.TextureSelect);
            }

            if (this.input.isKeyPressed(KeyCode.TAB)) {
                return this.setState(EditorState.ToolSelect);
            }

            this.movementSystem(dt);
            this.textureBarSystem();
        }

        if (this.state === EditorState.ToolSelect) {
            if (this.input.isMouseDown(MouseBtn.Left)) {
                return this.setState(EditorState.Editor);
            }
        }

        if (this.state === EditorState.TextureSelect) {
            if (this.input.isMouseDown(MouseBtn.Left)) {
                return this.setState(EditorState.Editor);
            }
        }
    }

    private movementSystem(dt: number) {
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

    private textureBarSystem() {
        // ...
    }
}
