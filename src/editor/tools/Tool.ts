import { Editor } from "../Editor";
import { Input } from "../../game/core/Input";
import { EditorWorld } from "../data/EditorWorld";
import { EditorHud } from "../data/EditorHud";
import { Intersection } from "three/src/core/Raycaster";
import { Hitscan } from "../../game/utils/EntityUtils";

export abstract class Tool {
    protected readonly input: Input;
    protected readonly world: EditorWorld;
    protected readonly hud: EditorHud;

    public abstract icon: string;
    public abstract name: string;

    public constructor(editor: Editor) {
        this.input = editor.input;
        this.world = editor.world;
        this.hud = editor.hud;
    }

    public start() {}

    public end() {}

    public onMouseOne() {}

    public onMouseTwo() {}

    protected getVoxel(dir: 1 | -1) {
        const buffer: Intersection[] = [];
        Hitscan.origin.set(0, 0);
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.world.camera);
        Hitscan.raycaster.intersectObject(this.world.floor, true, buffer);
        Hitscan.raycaster.intersectObject(this.world.level.scene, true, buffer);

        const [hit] = buffer;
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1 * dir);
        point.add(normal);

        return this.world.level.getVoxel(point);
    }
}
