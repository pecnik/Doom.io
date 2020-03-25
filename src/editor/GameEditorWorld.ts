import {
    Scene,
    PerspectiveCamera,
    MeshBasicMaterial,
    Mesh,
    PlaneGeometry,
    BoxGeometry,
    Object3D
} from "three";

export class GameEditorWorld {
    public readonly width = 17;
    public readonly depth = 17;

    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);

    public readonly level = new Object3D();
    public readonly brush = this.createBrush();
    public readonly floor = this.createFloor();

    public constructor() {
        this.camera.position.z = 5;
        this.camera.position.y = 2;

        this.level.add(this.floor);
        this.scene.add(this.camera, this.brush, this.level);
    }

    private createFloor() {
        const mat = new MeshBasicMaterial({
            wireframe: true,
            color: 0xffffff
        });

        const geo = new PlaneGeometry(
            this.width,
            this.depth,
            this.width,
            this.depth
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
