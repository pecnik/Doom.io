import { System } from "../ecs";
import { AvatarArchetype } from "../ecs/Archetypes";
import { AvatarState } from "../data/Types";

export class AvatarStateSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((avatar) => {
            let prevState = avatar.avatar.state;
            let nextState = this.getAvatarState(avatar);

            if (
                prevState === AvatarState.Jump &&
                nextState !== AvatarState.Jump &&
                avatar.avatar.prevVelocityY < -5
            ) {
                avatar.avatar.state = AvatarState.Land;
                return;
            }

            avatar.avatar.state = nextState;
            avatar.avatar.prevVelocityY = avatar.velocity.y;
        });
    }

    private getAvatarState(avatar: AvatarArchetype) {
        if (avatar.collision.falg.y !== -1) return AvatarState.Jump;
        if (avatar.velocity.x !== 0) return AvatarState.Walk;
        if (avatar.velocity.z !== 0) return AvatarState.Walk;
        return AvatarState.Idle;
    }
}
