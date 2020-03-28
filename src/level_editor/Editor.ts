import { Game } from "../game/core/Engine";
import {
    Scene,
    OrthographicCamera,
    TextureLoader,
    Vector2,
    Vector3
} from "three";
import { EditorWorld } from "./data/EditorWorld";
import { Input, KeyCode } from "../game/core/Input";
import { clamp } from "lodash";
import { modulo } from "../game/core/Utils";

export class Editor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
    public readonly hud = {
        scene: new Scene(),
        camera: new OrthographicCamera(0, 0, 0, 0)
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
        // ...
    }

    public update(dt: number): void {
        this.movementSystem(dt);
        this.input.clear();
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
}
