import { Scene, Group, Object3D, Box3, Mesh } from "three";

export interface MenuButton {
    readonly aabb: Box3;
    readonly mesh: Object3D;
    readonly onClick: () => void;
    readonly onUpdate: () => void;
}

export class MenuGroup extends Group {
    public readonly buttons: MenuButton[] = [];

    public addButton(props: {
        readonly mesh: Mesh;
        readonly onClick: () => void;
        readonly onUpdate: () => void;
    }) {
        const button = { ...props, aabb: new Box3() };

        const { aabb, mesh } = button;
        mesh.updateWorldMatrix(true, true);
        mesh.geometry.computeBoundingBox();
        aabb.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);

        this.add(button.mesh);
        this.buttons.push(button);
    }
}

export class EditorMenu {
    public readonly scene = new Scene();
    public readonly groups = this.scene.children as MenuGroup[];

    public addGroup() {
        const group = new MenuGroup();
        this.scene.add(group);
        return group;
    }
}
