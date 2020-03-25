import {
    Scene,
    PerspectiveCamera,
    MeshBasicMaterial,
    Mesh,
    PlaneGeometry,
    BoxGeometry,
    Object3D
} from "three";
import { Level } from "./Level";

export class GameEditorWorld {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);

    public readonly level = new Level(17, 17, 4);
    public readonly brush = this.createBrush();
    public readonly floor = this.createFloor();

    public constructor() {
        this.camera.position.set(0, 4, this.level.depth * 0.25);
        this.camera.rotation.set(Math.PI * -0.25, 0, 0, "YXZ");

        this.scene.add(this.camera, this.brush, this.floor, this.level.scene);
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

        const floor = new Mesh(geo, mat);
        floor.translateY(-0.5);
        floor.rotateX(-Math.PI / 2);
        return floor;
    }

    private createBrush() {
        const geo = new BoxGeometry(1, 1, 1);

        const fill = new MeshBasicMaterial({
            color: 0xff00ff,
            opacity: 0.25,
            transparent: true
        });

        const stroke = new MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true
        });

        const brush = new Object3D();
        brush.add(new Mesh(geo, fill));
        brush.add(new Mesh(geo, stroke));
        return brush;
    }
}
