import {
    Mesh,
    Texture,
    NearestFilter,
    MeshBasicMaterial,
    PlaneGeometry
} from "three";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../Editor";

export class StateInfo {
    public readonly scene: Mesh;
    public readonly width: number;
    public readonly height: number;

    public readonly texture: Texture;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;

    public constructor() {
        this.width = 256;
        this.height = 256;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.texture = new Texture(this.canvas);
        this.texture.minFilter = NearestFilter;
        this.texture.magFilter = NearestFilter;
        this.texture.needsUpdate = true;

        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        const material = new MeshBasicMaterial({
            map: this.texture,
            transparent: true
        });
        const geometry = new PlaneGeometry(this.width, this.height);
        material.transparent = true;
        this.scene = new Mesh(geometry, material);
        this.scene.position.x = -VIEW_WIDTH / 2;
        this.scene.position.y = VIEW_HEIGHT / 2;
        this.scene.translateX(this.width / 2);
        this.scene.translateY(-this.height / 2);
    }
}
