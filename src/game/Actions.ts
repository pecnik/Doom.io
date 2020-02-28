import { PositionComponent } from "./Components";

export type Action = BulletImpact;

export enum ActionType {
    BulletImpact
}

export class BulletImpact {
    public readonly type = ActionType.BulletImpact;
    public readonly id: string;
    public readonly position: PositionComponent;
    public constructor(id: string, position: PositionComponent) {
        this.id = id;
        this.position = position;
    }
}
