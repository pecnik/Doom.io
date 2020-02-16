import { WebGLRenderer } from "three";

export class Renderer {
    public readonly webgl: WebGLRenderer;

    public constructor(canvas: HTMLCanvasElement) {
        this.webgl = new WebGLRenderer({ canvas });
        this.webgl.setClearColor(0x6495ed);
    }

    public onResize(width: number, height: number) {
        this.webgl.setSize(width, height);
    }
}
