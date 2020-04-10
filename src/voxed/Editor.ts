import Vue from "vue";
import Vuex from "vuex";
import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    Mesh,
    MeshBasicMaterial,
    Vector2,
    Vector3,
    PlaneGeometry
} from "three";
import { Input, KeyCode } from "../game/core/Input";
import { Level } from "./Level";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import { disposeMeshMaterial, loadTexture } from "../game/utils/Helpers";

Vue.use(Vuex);

export enum EditorTool {
    Block = "Block",
    Paint = "Paint",
    Sample = "Sample"
}

export class Editor {
    public static readonly getInstance = (() => {
        const intance = new Editor();
        return () => intance;
    })();

    public elapsedTime = 0;
    public previusTime = 0;

    public readonly renderer = new WebGLRenderer({});
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();
    public readonly level = new Level();
    public readonly floor = new Mesh();

    public readonly input = new Input({
        requestPointerLock: true,
        element: this.renderer.domElement
    });

    public readonly store = new Vuex.Store({
        state: {
            tool: EditorTool.Block,
            texture: {
                slots: [0, 1, 2, 3, 8, 9, 10, 11],
                index: 0
            }
        }
    });

    public constructor() {
        this.scene.add(this.floor, this.level.mesh, this.level.wireframe);
    }

    public preload() {
        return loadTexture("/assets/tileset.png").then(map => {
            this.level.initMaterial(map);
        });
    }

    public newLevel(max_x: number, max_y: number, max_z: number) {
        this.level.initData(max_x, max_y, max_z);
        this.level.updateGeometry();

        {
            // Reconstruct floor mesh
            this.floor.geometry.dispose();
            this.floor.geometry = new PlaneGeometry(max_x, max_z, max_x, max_z);
            this.floor.geometry.rotateX(-Math.PI / 2);
            this.floor.geometry.translate(-0.5, -0.5, -0.5);
            this.floor.geometry.translate(max_x / 2, 0, max_z / 2);

            disposeMeshMaterial(this.floor.material);
            this.floor.material = new MeshBasicMaterial({
                wireframe: true,
                color: 0xf2f2f2
            });
        }

        this.camera.rotation.set(-Math.PI / 4, 0, 0, "YXZ");
        this.camera.position.set(max_x / 2, max_y / 2, max_z / 2);
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
        const str = 0.1;
        const dx = this.input.mouse.dx;
        const dy = this.input.mouse.dy;
        const rotation = this.camera.rotation.clone();
        rotation.y -= dx * str * dt;
        rotation.x -= dy * str * dt;
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
            .multiplyScalar(5)
            .multiplyScalar(dt);
        this.camera.position.add(velocity);
    }
}
