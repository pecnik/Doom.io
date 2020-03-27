import { Tool } from "./Tool";
import {
    Intersection,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Object3D,
    TextureLoader
} from "three";
import { Hitscan } from "../../game/utils/EntityUtils";
import { HUD_WIDTH, HUD_HEIGHT } from "../../game/data/Globals";
import { TILE_COLS, TILE_ROWS } from "../data/Constants";

export class ActionSelectTool extends Tool {
    private readonly texturePlanel = this.createTexturePanel();

    private createTexturePanel() {
        const texturePlanel = new Object3D();
        texturePlanel.visible = false;
        this.hud.scene.add(texturePlanel);

        new TextureLoader().load("/assets/tileset.png", map => {
            const geometry = new PlaneGeometry(
                HUD_WIDTH * 0.25,
                HUD_WIDTH * 0.25
            );

            const material = new MeshBasicMaterial({
                map,
                depthTest: false,
                depthWrite: false
            });

            texturePlanel.add(new Mesh(geometry, material));
        });

        return texturePlanel;
    }

    public start() {
        this.texturePlanel.visible = true;
        this.texturePlanel.position.set(0, 0, -1);
    }

    public end() {
        // Hitscan
        const cursor = this.hud.cursor.position;
        const buffer: Intersection[] = [];
        Hitscan.origin.set(
            cursor.x / (HUD_WIDTH / 2),
            cursor.y / (HUD_HEIGHT / 2)
        );
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.hud.camera);
        Hitscan.raycaster.intersectObject(this.texturePlanel, true, buffer);

        for (let i = 0; i < buffer.length; i++) {
            const rsp = buffer[i];
            if (rsp.uv) {
                const x = Math.floor(rsp.uv.x * TILE_COLS);
                const y = Math.floor((1 - rsp.uv.y) * TILE_ROWS);
                const index = y * TILE_COLS + x;
                this.world.texutreIndex = index + 1;
            }
        }

        // Clear hud cursor
        this.texturePlanel.visible = false;
        this.hud.cursor.position.setScalar(0);
    }

    public update() {
        const { dx, dy } = this.input.mouse;
        this.hud.cursor.position.x += dx;
        this.hud.cursor.position.y -= dy;

        // A bit hacky ... prevents FPS mouse look, when this tool is active
        this.input.mouse.dx = 0;
        this.input.mouse.dy = 0;
    }
}
