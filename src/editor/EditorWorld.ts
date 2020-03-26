import {
    Scene,
    PerspectiveCamera,
    MeshBasicMaterial,
    Mesh,
    PlaneGeometry
} from "three";
import { Level } from "./Level";

export class EditorWorld {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);

    public readonly level = new Level(9, 6, 4);
    public readonly floor = this.createFloor();

    public texutreIndex = 1;

    public constructor() {
        this.camera.position.set(
            this.level.width / 2,
            this.level.height / 2,
            this.level.depth
        );
        this.camera.rotation.set(Math.PI * -0.25, 0, 0, "YXZ");
        this.scene.add(this.camera, this.floor, this.level.scene);
    }

    private createFloor() {
        const mat = new MeshBasicMaterial({
            wireframe: true,
            color: 0xffffff
        });

        const geo = new PlaneGeometry(
            this.level.width,
            this.level.depth,
            this.level.width,
            this.level.depth
        );

        geo.rotateX(-Math.PI / 2);
        geo.translate(-0.5, -0.5, -0.5);
        geo.translate(this.level.width / 2, 0, this.level.depth / 2);
        return new Mesh(geo, mat);
    }
}
