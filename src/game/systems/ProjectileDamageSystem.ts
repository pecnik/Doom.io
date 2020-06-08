import { System } from "../ecs";
import { ProjectileArchetype, AvatarArchetype } from "../ecs/Archetypes";
import { AvatarHitAction, ActionType, Action } from "../Action";
import { WeaponType } from "../data/Weapon";
import { getPlayerAvatar } from "../Helpers";
import { GameContext } from "../GameContext";

export class ProjectileDamageSystem extends System {
    private readonly game: GameContext;
    private readonly avatars = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });
    private readonly projectiles = this.createEntityFamily({
        archetype: new ProjectileArchetype(),
    });

    public constructor(server: GameContext) {
        super(server.world);
        this.game = server;
    }

    public update() {
        this.projectiles.entities.forEach((projectile) => {
            this.avatars.entities.forEach((avatar) => {
                if (avatar.playerId === projectile.playerId) return;

                const p1 = projectile.position;
                const p2 = avatar.position;
                if (p1.distanceToSquared(p2) > 0.25) return;

                const shooter = getPlayerAvatar(
                    projectile.playerId,
                    this.avatars
                );
                if (shooter === undefined) return;

                const hitEntity: AvatarHitAction = {
                    type: ActionType.AvatarHit,
                    weaponType: WeaponType.Shotgun, // Will it be always tho?
                    shooterId: shooter.id,
                    targetId: avatar.id,
                    headshot: false, /// ammm no
                };

                this.game.dispatch(hitEntity);
                this.game.dispatch(Action.removeEntity(projectile.id));
            });
        });
    }
}
