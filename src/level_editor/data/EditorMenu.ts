import { Scene, Group, Object3D } from "three";

export interface MenuButton {
    readonly object: Object3D;
    readonly onClick: () => void;
}

export class MenuGroup extends Group {
    public readonly buttons: MenuButton[] = [];

    public addButton(btn: MenuButton) {
        this.add(btn.object);
        this.buttons.push(btn);
    }
}

export class EditorMenu {
    public readonly scene = new Scene();

    public addGroup() {
        const group = new MenuGroup();
        this.scene.add(group);
        return group;
    }
}
