import { Engine, Entity } from "@nova-engine/ecs";
import { Scene, PerspectiveCamera } from "three";
import { Action, ActionType } from "./Actions";
import { Level } from "./level/Level";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent
} from "./Components";

export class World extends Engine {
    public readonly level = new Level();
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public elapsedTime = 0;

    public constructor() {
        super();
        this.scene.add(this.level.scene);
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
