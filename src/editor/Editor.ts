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
import { store } from "./Store";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { Level } from "../game/data/Level";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import { loadTexture, disposeMeshMaterial } from "../game/utils/Helpers";
import { Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { EntityTool } from "./tools/EntityTool";
import { PaintTool } from "./tools/PaintTool";

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

    public readonly tools: {
        block: BlockTool;
        paint: PaintTool;
        entity: EntityTool;
        list: Tool[];
        active: Tool;
    };

    public constructor() {
        this.level.setSize(8, 8, 8);
        const { max_x, max_z } = this.level.data;

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

        // Init tools
        const block = new BlockTool(this);
        const paint = new PaintTool(this);
        const entity = new EntityTool(this);
        this.tools = {
            active: block,
            list: [block, paint, entity],
            block,
            paint,
            entity
        };

        store.watch(
            state => state.toolId,
            (toolId, prevId) => {
                const prev = this.tools[prevId];
                const next = this.tools[toolId];
                prev.end();
                next.start();
                this.tools.active = next;
            }
        );
    }

    public preload() {
        return loadTexture("/assets/tileset.png").then(map => {
            this.level.setMaterial(map);
            this.tools.list.forEach(tool => tool.preload());
        });
    }

    public update(elapsed: number) {
        this.previusTime = this.elapsedTime;
        this.elapsedTime = elapsed;

        const delta = (this.elapsedTime - this.previusTime) * 0.001;
        this.movementSystem(delta);
        this.toolSystem(delta);
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

    private toolSystem(dt: number) {
        const { active } = this.tools;

        active.update(dt);

        if (this.input.isMousePresed(MouseBtn.Left)) {
            active.onMousePressed();
        }

        if (this.input.isMouseReleased(MouseBtn.Left)) {
            active.onMouseReleased();
        }
    }
}

export const editor = new Editor();
