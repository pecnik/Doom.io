import { Game } from "../game/core/Engine";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
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
    Intersection
} from "three";
import { Hitscan } from "../game/utils/EntityUtils";
import { HUD_WIDTH, HUD_HEIGHT } from "../game/data/Globals";
import { buildLevelMesh } from "./LevelUtils";

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

    public preload(): Promise<any> {
        return new Promise(resolve => {
            new TextureLoader().load("/assets/tileset.png", map => {
                this.world.level.textrue = map;
                resolve();
            });
        });
    }

    public create() {
        console.log(`> Editor::created`);

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
        });
    }

    public update(dt: number) {
        this.cameraController(dt);
        this.placeVoxel();
        this.removeVoxel();
        this.input.clear();
    }

    private cameraController(dt: number) {
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

    private placeVoxel() {
        const placeInput = this.input.isMousePresed(MouseBtn.Left);
        if (!placeInput) return;

        const [hit] = this.hitscan();
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1);
        point.add(normal);

        const voxel = this.world.level.getVoxel(point);
        if (voxel !== undefined) {
            voxel.solid = true;
            Object.assign(voxel.faces, [9, 9, 10, 10, 9, 9]);
            buildLevelMesh(this.world.level);
        }
    }

    private removeVoxel() {
        const removeInput = this.input.isMousePresed(MouseBtn.Right);
        if (!removeInput) return;

        const [hit] = this.hitscan();
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1);
        point.sub(normal);

        const voxel = this.world.level.getVoxel(point);
        if (voxel !== undefined) {
            voxel.solid = false;
            buildLevelMesh(this.world.level);
        }
    }

    private hitscan() {
        const buffer: Intersection[] = [];
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.world.camera);
        Hitscan.raycaster.intersectObject(this.world.floor, true, buffer);
        Hitscan.raycaster.intersectObject(this.world.level.scene, true, buffer);
        return buffer;
    }
}
