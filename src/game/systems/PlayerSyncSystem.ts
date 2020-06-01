import { System, Entity } from "../ecs";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { GameClient } from "../GameClient";
import { AvatarUpdateAction, ActionType } from "../Action";
import { Vector3, Vector2 } from "three";
import { WeaponType } from "../data/Weapon";

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
            this.fillActionData(this.nextSync, avatar);
            if (this.actionDiff(this.nextSync, this.prevSync)) {
                this.fillActionData(this.prevSync, avatar);
                this.client.send(this.nextSync);
            }
        }
    }

    private fillActionData(
        action: AvatarUpdateAction,
        avatar: Entity<LocalAvatarArchetype>
    ) {
        action.avatarId = avatar.id;
        action.weaponType = avatar.shooter.weaponType;
        action.position.copy(avatar.position);
        action.velocity.copy(avatar.velocity);
        action.rotation.copy(avatar.rotation);
    }

    private actionDiff(syncA: AvatarUpdateAction, syncB: AvatarUpdateAction) {
        if (!syncA.position.equals(syncB.position)) return true;
        if (!syncA.velocity.equals(syncB.velocity)) return true;
        if (!syncA.rotation.equals(syncB.rotation)) return true;
        if (syncA.weaponType !== syncB.weaponType) return true;
        return false;
    }

    private createAvatarUpdateAction(): AvatarUpdateAction {
        return {
            type: ActionType.AvatarUpdate,
            avatarId: "",
            position: new Vector3(),
            velocity: new Vector3(),
            rotation: new Vector2(),
            weaponType: WeaponType.Pistol,
        };
    }
}
