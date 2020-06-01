import { System, Entity } from "../ecs";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { GameClient } from "../GameClient";
import { AvatarUpdateAction, ActionType } from "../Action";
import { Vector3, Vector2 } from "three";

export class PlayerSyncSystem extends System {
    private readonly prevSync = this.createAvatarUpdateAction();
    private readonly nextSync = this.createAvatarUpdateAction();

    private readonly client: GameClient;
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(client: GameClient) {
        super(client.world);
        this.client = client;
    }

    public update() {
        const avatar = this.family.first();
        if (avatar !== undefined) {
            this.fillSyncData(this.nextSync, avatar);
            if (this.syncDiff(this.nextSync, this.prevSync)) {
                this.fillSyncData(this.prevSync, avatar);
                this.client.send(this.nextSync);
            }
        }
    }

    private fillSyncData(
        sync: AvatarUpdateAction,
        avatar: Entity<LocalAvatarArchetype>
    ) {
        sync.avatarId = avatar.id;
        sync.position.copy(avatar.position);
        sync.velocity.copy(avatar.velocity);
        sync.rotation.copy(avatar.rotation);
    }

    private syncDiff(
        syncA: AvatarUpdateAction,
        syncB: AvatarUpdateAction
    ) {
        if (!syncA.position.equals(syncB.position)) return true;
        if (!syncA.velocity.equals(syncB.velocity)) return true;
        if (!syncA.rotation.equals(syncB.rotation)) return true;
        return false;
    }

    private createAvatarUpdateAction(): AvatarUpdateAction {
        return {
            type: ActionType.AvatarUpdate,
            avatarId: "",
            position: new Vector3(),
            velocity: new Vector3(),
            rotation: new Vector2(),
        };
    }
}
