import { System } from "../ecs";
import { ProjectileArchetype } from "../ecs/Archetypes";
import { GameServer } from "../../server/GameServer";
import { AvatarHitAction, ActionType, Action } from "../Action";
import { WeaponType } from "../data/Weapon";
import { getPlayerAvatar } from "../Helpers";

export class ProjectileDamageSystem extends System {
    private readonly server: GameServer;

    private readonly projectiles = this.createEntityFamily({
        archetype: new ProjectileArchetype(),
    });

    public constructor(server: GameServer) {
        super(server.world);
        this.server = server;
    }

    public update() {
        this.projectiles.entities.forEach((projectile) => {
            this.server.avatars.entities.forEach((avatar) => {
                if (avatar.playerId === projectile.playerId) return;

                const p1 = projectile.position;
                const p2 = avatar.position;
                if (p1.distanceToSquared(p2) > 0.25) return;

                const shooter = getPlayerAvatar(
                    projectile.playerId,
                    this.server.avatars
                );
                if (shooter === undefined) return;

                const hitEntity: AvatarHitAction = {
                    type: ActionType.AvatarHit,
                    weaponType: WeaponType.Shotgun, // Will it be always tho?
                    shooterId: shooter.id,
                    targetId: avatar.id,
                    headshot: false, /// ammm no
                };

                const msg = Action.serialize(hitEntity);
                this.server.playerMessage(projectile.playerId, msg);

                const remove = this.server.removeEntity(projectile.id);
                const removeMsg = Action.serialize(remove);
                this.server.broadcastToAll(removeMsg);
                this.world.removeEntity(projectile.id);
            });
        });
    }
}
