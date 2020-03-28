import { Scene, Group, Object3D } from "three";

export interface MenuButton {
    readonly button: Object3D;
    readonly onClick: () => void;
    readonly onUpdate: () => void;
}

export class MenuGroup extends Group {
    public readonly buttons: MenuButton[] = [];

    public addButton(btn: MenuButton) {
        this.add(btn.button);
        this.buttons.push(btn);
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
