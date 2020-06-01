import { Action, AvatarUpdateAction, ActionType } from "./Action";
import { ArrayBufferF32 } from "./data/ArrayBufferF32";
import { Vector3, Vector2 } from "three";

export interface ActionParser {
    serialize(action: Action): string;
    deserialize(msg: string): Action;
}

export class AvatarUpdateParcer {
    private readonly binary = new ArrayBufferF32(3 + 3 + 2);
    private readonly action: AvatarUpdateAction = {
        type: ActionType.AvatarUpdate,
        avatarId: "",
        position: new Vector3(),
        velocity: new Vector3(),
        rotation: new Vector2(),
    };

    public serialize(action: AvatarUpdateAction): string {
        this.binary.buffer[0] = action.position.x;
        this.binary.buffer[1] = action.position.y;
        this.binary.buffer[2] = action.position.z;
        this.binary.buffer[3] = action.velocity.x;
        this.binary.buffer[4] = action.velocity.y;
        this.binary.buffer[5] = action.velocity.z;
        this.binary.buffer[6] = action.rotation.x;
        this.binary.buffer[7] = action.rotation.y;
        return `${action.avatarId}¤${this.binary.toStringBuffer()}`;
    }

    public deserialize(msg: string): AvatarUpdateAction {
        const index = msg.indexOf("¤");
        const avatarId = msg.slice(0, index);
        const buffer = msg.slice(index + 1);

        this.binary.readStringBuffer(buffer);
        this.action.avatarId = avatarId;
        this.action.position.x = this.binary.buffer[0];
        this.action.position.y = this.binary.buffer[1];
        this.action.position.z = this.binary.buffer[2];
        this.action.velocity.x = this.binary.buffer[3];
        this.action.velocity.y = this.binary.buffer[4];
        this.action.velocity.z = this.binary.buffer[5];
        this.action.rotation.x = this.binary.buffer[6];
        this.action.rotation.y = this.binary.buffer[7];

        return this.action;
    }
}
