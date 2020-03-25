import {
    Scene,
    PerspectiveCamera,
    MeshBasicMaterial,
    Mesh,
    PlaneGeometry
} from "three";

export class GameEditorWorld {
    public readonly width = 16;
    public readonly depth = 16;

    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public readonly floor = this.createFloor();

    public constructor() {
        this.camera.position.z = 5;
        this.camera.position.y = 2;

        this.scene.add(this.floor);
    }

    private createFloor() {
        const mat = new MeshBasicMaterial({ color: 0xffffff, wireframe: true });
        const geo = new PlaneGeometry(
            this.width,
            this.depth,
            this.width,
            this.depth
        );

        const floor = new Mesh(geo, mat);
        floor.rotateX(Math.PI / 2);

        return floor;
    }
}
