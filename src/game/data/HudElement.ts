import { Mesh, Texture, MeshBasicMaterial, PlaneGeometry } from "three";

export class HudElement<T> {
    public readonly props: T;
    public readonly plane: Mesh;
    public readonly width: number;
    public readonly height: number;

    public readonly texture: Texture;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;

    public constructor(config: { props: T; width: number; height: number }) {
        const { props, width, height } = config;
        this.props = props;
        this.width = width;
        this.height = height;

        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;

        this.texture = new Texture(this.canvas);
        this.texture.needsUpdate = true;

        const material = new MeshBasicMaterial({ map: this.texture });
        material.transparent = true;

        const geometry = new PlaneGeometry(width, height);
        this.plane = new Mesh(geometry, material);
        this.plane.renderOrder = 100;

        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.ctx.font = "Normal 24px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "white";
    }
}
