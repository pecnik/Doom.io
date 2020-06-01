import { System, Entity } from "../ecs";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { GameClient } from "../GameClient";
import { AvatarFrameUpdate } from "../network/NetworkEvents";

export class PlayerSyncSystem extends System {
    private readonly prevSync = new AvatarFrameUpdate();
    private readonly nextSync = new AvatarFrameUpdate();

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
                this.client.dispatcher.sendMessage(this.nextSync);
            }
        }
    }

    private fillSyncData(
        sync: AvatarFrameUpdate,
        avatar: Entity<LocalAvatarArchetype>
    ) {
        sync.avatarId = avatar.id;
        sync.position.copy(avatar.position);
        sync.velocity.copy(avatar.velocity);
        sync.rotation.copy(avatar.rotation);
    }

    private syncDiff(syncA: AvatarFrameUpdate, syncB: AvatarFrameUpdate) {
        if (!syncA.position.equals(syncB.position)) return true;
        if (!syncA.velocity.equals(syncB.velocity)) return true;
        if (!syncA.rotation.equals(syncB.rotation)) return true;
        return false;
    }
}
