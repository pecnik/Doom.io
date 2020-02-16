import {
    PerspectiveCamera,
    Scene,
    Mesh,
    BoxGeometry,
    MeshBasicMaterial,
    Vector3
} from "three";
import { Input, KeyCode } from "./core/Input";

export class Game {
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();
    public readonly input: Input;

    public constructor(input: Input) {
        this.input = input;
    }

    public onStart() {
        console.log(`> TODO: load level`);
        console.log(`> TODO: connect to game`);

        const level = [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1]
        ];

        const tileGeo = new BoxGeometry(1, 1, 1);
        const tileMat = new MeshBasicMaterial({ wireframe: true });
        for (let z = 0; z < level.length; z++) {
            for (let x = 0; x < level[z].length; x++) {
                const tileId = level[z][x];
                if (tileId > 0) {
                    const tile = new Mesh(tileGeo, tileMat);
                    tile.position.set(x, 0, z);
                    this.scene.add(tile);
                }
            }
        }

        this.camera.position.x = level[0].length / 2;
        this.camera.position.z = level.length / 2;
    }

    public update(dt: number) {
        const forward = this.input.isKeyDown(KeyCode.W);
        const backward = this.input.isKeyDown(KeyCode.S);
        const left = this.input.isKeyDown(KeyCode.A);
        const right = this.input.isKeyDown(KeyCode.D);

        const velocity = new Vector3();
        velocity.z -= forward ? 1 : 0;
        velocity.z += backward ? 1 : 0;
        velocity.x -= left ? 1 : 0;
        velocity.x += right ? 1 : 0;

        const movementSpeed = 5;
        velocity.normalize();
        velocity.multiplyScalar(movementSpeed * dt);

        this.camera.position.add(velocity);
    }
}
