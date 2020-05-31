import { System, Entity } from "../ecs";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { GameClient } from "../GameClient";
import { AvatarFrameSync } from "../events/Netcode";

export class PlayerSyncSystem extends System {
    private readonly prevSync = new AvatarFrameSync();
    private readonly nextSync = new AvatarFrameSync();

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
                this.client.dispatcher.avatarFrameSync(this.nextSync);
            }
        }
    }

    private fillSyncData(
        sync: AvatarFrameSync,
        avatar: Entity<LocalAvatarArchetype>
    ) {
        sync.playerId = avatar.id;
        sync.position.copy(avatar.position);
        sync.velocity.copy(avatar.velocity);
        sync.rotation.copy(avatar.rotation);
    }

    private syncDiff(syncA: AvatarFrameSync, syncB: AvatarFrameSync) {
        if (!syncA.position.equals(syncB.position)) return true;
        if (!syncA.velocity.equals(syncB.velocity)) return true;
        if (!syncA.rotation.equals(syncB.rotation)) return true;
        return false;
    }
}
