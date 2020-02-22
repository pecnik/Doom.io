import { Engine, Entity } from "@nova-engine/ecs";
import {
    Scene,
    PerspectiveCamera,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh
} from "three";
import { Action, ActionType } from "./Actions";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent
} from "./Components";

export class World extends Engine {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);

    public constructor() {
        super();
        const level = [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1]
        ];

        const tileGeo = new BoxGeometry(1, 1, 1);
        const tileMat = new MeshBasicMaterial({ wireframe: true });
        for (let z = 0; z < level.length; z++) {
            for (let x = 0; x < level[z].length; x++) {
                const tileId = level[z][x];
                if (tileId > 0) {
                    const tile = new Mesh(tileGeo, tileMat);
                    tile.position.set(x, 0, z);
                    this.scene.add(tile);
                }
            }
        }

        this.camera.position.x = level[0].length / 2;
        this.camera.position.z = level.length / 2;
    }

    public dispatch(action: Action) {
        switch (action.type) {
            case ActionType.SpawnPlayerAvatar: {
                const { id, position } = action;
                const avatar = new Entity();
                avatar.id = id;
                avatar.putComponent(PositionComponent);
                avatar.putComponent(VelocityComponent);
                avatar.putComponent(RotationComponent);

                const avatarPosition = avatar.getComponent(PositionComponent);
                avatarPosition.x = position.x;
                avatarPosition.y = position.y;
                avatarPosition.z = position.z;

                this.addEntity(avatar);
                console.log(`> Spawn::avatar(${avatar.id})`);

                break;
            }

            case ActionType.DespwnPlayerAvatar:
                const { id } = action;
                const avatar = this.entities.find(e => e.id === id);
                if (avatar !== undefined) {
                    this.removeEntity(avatar);
                    console.log(`> Despawn::avatar(${avatar.id})`);
                }
                break;
        }
    }
}
