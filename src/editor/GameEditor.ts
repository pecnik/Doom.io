import { Game } from "../game/core/Engine";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { EditorWorld } from "./EditorWorld";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import {
    Vector3,
    Vector2,
    MeshBasicMaterial,
    BoxGeometry,
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
        return Promise.resolve();
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
        // this.updateBrush();
        this.placeBrush();
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

    private updateBrush() {
        const buffer: Intersection[] = [];
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.world.camera);
        Hitscan.raycaster.intersectObject(this.world.floor, true, buffer);
        Hitscan.raycaster.intersectObject(this.world.level.scene, true, buffer);

        this.world.brush.visible = false;

        for (let i = 0; i < buffer.length; i++) {
            const rsp = buffer[i];
            if (!rsp.face) continue;

            const normal = rsp.face.normal.clone().multiplyScalar(0.1);
            this.world.brush.visible = true;
            this.world.brush.position.set(
                Math.round(rsp.point.x + normal.x),
                Math.round(rsp.point.y + normal.y),
                Math.round(rsp.point.z + normal.z)
            );

            if (this.world.brush.position.y < 0) {
                this.world.brush.position.y = 0;
            }

            break;
        }
    }

    private placeBrush() {
        const place = this.input.isMousePresed(MouseBtn.Left);
        if (!place) {
            return;
        }

        const [hit] = this.hitscan();
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1);
        point.add(normal);

        const voxel = this.world.level.getVoxel(point);
        if (voxel === undefined) return;

        voxel.solid = true;

        // Reconstruct level mesh
        const geo = new BoxGeometry(1, 1, 1);
        const mat = new MeshBasicMaterial({
            color: 0x00ff22,
            wireframe: true
        });
        this.world.level.scene.remove(...this.world.level.scene.children);
        this.world.level.forEachVoxel(voxel => {
            if (voxel.solid) {
                const block = new Mesh(geo, mat);
                block.position.copy(voxel.origin);
                console.log(voxel.origin);
                this.world.level.scene.add(block);
            }
        });
    }

    private hitscan() {
        const buffer: Intersection[] = [];
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.world.camera);
        Hitscan.raycaster.intersectObject(this.world.floor, true, buffer);
        Hitscan.raycaster.intersectObject(this.world.level.scene, true, buffer);
        return buffer;
    }

    private removeVoxel() {
        const remove = this.input.isMousePresed(MouseBtn.Right);
        if (remove && this.world.brush.visible) {
            const point = this.world.brush.position;
            const voxel = this.world.level.getVoxel(point);
            if (voxel === undefined) return;

            voxel.solid = true;

            // Reconstruct level mesh
            const geo = new BoxGeometry(1, 1, 1);
            const mat = new MeshBasicMaterial({
                color: 0x00ff22,
                wireframe: true
            });
            this.world.level.scene.remove(...this.world.level.scene.children);
            this.world.level.forEachVoxel(voxel => {
                if (voxel.solid) {
                    const block = new Mesh(geo, mat);
                    block.position.copy(voxel.origin);
                    console.log(voxel.origin);
                    this.world.level.scene.add(block);
                }
            });
        }
    }
}
