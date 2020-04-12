import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    Mesh,
    Vector2,
    Vector3,
    PlaneGeometry,
    MeshBasicMaterial
} from "three";
import { Input, KeyCode } from "../game/core/Input";
import { Level } from "../game/data/Level";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import { loadTexture, disposeMeshMaterial } from "../game/utils/Helpers";

export class Editor {
    public elapsedTime = 0;
    public previusTime = 0;

    public readonly renderer = new WebGLRenderer({ antialias: true });
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();
    public readonly level = new Level();
    public readonly floor = new Mesh();
    public readonly input = new Input({
        requestPointerLock: true,
        element: this.renderer.domElement
    });

    public constructor() {
        const max_x = 16;
        const max_z = 16;

        // Build scene
        this.scene.add(this.camera, this.floor, this.level.mesh);

        // Set camera
        this.camera.position.y = 2;
        this.camera.rotation.set(0, -1.8, 0, "XYZ");

        // Reconstruct floor mesh
        this.floor.geometry.dispose();
        this.floor.geometry = new PlaneGeometry(max_x, max_z, max_x, max_z);
        this.floor.geometry.rotateX(-Math.PI / 2);
        this.floor.geometry.translate(-0.5, -0.5, -0.5);
        this.floor.geometry.translate(max_x / 2, 0, max_z / 2);

        disposeMeshMaterial(this.floor.material);
        this.floor.material = new MeshBasicMaterial({
            wireframe: true,
            transparent: true,
            opacity: 0.25,
            color: 0xffffff
        });
    }

    public preload() {
        return loadTexture("/assets/tileset.png").then(map => {
            this.level.setMaterial(map);
        });
    }

    public update(elapsed: number) {
        this.previusTime = this.elapsedTime;
        this.elapsedTime = elapsed;

        const delta = (this.elapsedTime - this.previusTime) * 0.001;
        this.movementSystem(delta);
        this.input.clear();

        this.renderer.render(this.scene, this.camera);
    }

    private movementSystem(dt: number) {
        // Mouse look
        const str = 0.0025;
        const dx = this.input.mouse.dx;
        const dy = this.input.mouse.dy;
        const rotation = this.camera.rotation.clone();
        rotation.y -= dx * str;
        rotation.x -= dy * str;
        rotation.y = modulo(rotation.y, Math.PI * 2);
        rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
        this.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

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
            .multiplyScalar(10)
            .multiplyScalar(dt);
        this.camera.position.add(velocity);
    }
}

export const editor = new Editor();
