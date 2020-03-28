import { Editor } from "../Editor";
import { Input } from "../../game/core/Input";
import { EditorWorld } from "../data/EditorWorld";
import { Intersection } from "three/src/core/Raycaster";
import { Hitscan } from "../../game/utils/EntityUtils";

export abstract class Tool {
    protected readonly editor: Editor;
    protected readonly input: Input;
    protected readonly world: EditorWorld;

    public abstract icon: string;
    public abstract name: string;

    public constructor(editor: Editor) {
        this.editor = editor;
        this.input = editor.input;
        this.world = editor.world;
    }

    public start() {}

    public end() {}

    public onMouseOne() {}

    public onMouseTwo() {}

    protected getActiveTextureId(): number {
        const { textureSlots, selectedSlot } = this.world;
        return textureSlots[selectedSlot] || 0;
    }

    protected sampleVoxel(dir: 1 | -1) {
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

        const voxel = this.world.level.getVoxel(point);
        if (voxel === undefined) {
            return;
        }

        return { point: point.clone(), normal: hit.face.normal.clone(), voxel };
    }
}
