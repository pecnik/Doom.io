import { PositionComponent } from "./Components";

export type Action = SpawnPlayerAvatarAction | DespwnPlayerAvatarAction;

export enum ActionType {
    SpawnPlayerAvatar,
    DespwnPlayerAvatar
}

export class SpawnPlayerAvatarAction {
    public readonly type = ActionType.SpawnPlayerAvatar;
    public readonly id: string;
    public readonly position: PositionComponent;
    public constructor(id: string, position: PositionComponent) {
        this.id = id;
        this.position = position;
    }
}

export class DespwnPlayerAvatarAction {
    public readonly type = ActionType.DespwnPlayerAvatar;
    public readonly id: string;
    public constructor(id: string) {
        this.id = id;
    }
}
