import { World } from "./ecs";
import { Action, ActionType } from "./Action";
import { EntityFactory } from "./data/EntityFactory";
import { WEAPON_SPEC_RECORD } from "./data/Weapon";
import { getWeaponAmmo, getWeaponSpec } from "./Helpers";

export abstract class GameContext {
    public abstract readonly world: World;

    public dispatch(action: Action) {
        this.syncDispatch(action);
        this.runDispatch(action);
    }

    /**
     * Send action over the network.
     */
    public abstract syncDispatch(action: Action): void;

    public runDispatch(action: Action) {
        switch (action.type) {
            case ActionType.SpawnDecal: {
                this.world.decals.spawn(action.point, action.normal);
                return;
            }

            case ActionType.AvatarSpawn: {
                const avatar =
                    action.avatarType === "local"
                        ? EntityFactory.LocalAvatar(action.avatarId)
                        : EntityFactory.EnemyAvatar(action.avatarId);
                avatar.playerId = action.playerId;
                avatar.position.copy(action.position);
                this.world.addEntity(avatar);
                return;
            }

            case ActionType.RemoveEntity: {
                this.world.removeEntity(action.entityId);
                return;
            }

            case ActionType.AvatarUpdate: {
                const avatar = this.world.entities.get(action.avatarId);
                if (avatar === undefined) return;

                if (avatar.position !== undefined) {
                    avatar.position.copy(action.position);
                }

                if (avatar.velocity !== undefined) {
                    avatar.velocity.copy(action.velocity);
                }

                if (avatar.rotation !== undefined) {
                    avatar.rotation.copy(action.rotation);
                }

                if (avatar.shooter !== undefined) {
                    avatar.shooter.weaponType = action.weaponType;
                }
                return;
            }

            case ActionType.AvatarHit: {
                const shooter = this.world.entities.get(action.shooterId);
                if (shooter === undefined) return;
                if (shooter.shooter === undefined) return;
                if (shooter.position === undefined) return;

                const target = this.world.entities.get(action.targetId);
                if (target === undefined) return;
                if (target.health === undefined) return;
                if (target.health.value <= 0) return;

                const weaponSpec = WEAPON_SPEC_RECORD[action.weaponType];
                const damage = weaponSpec.bulletDamage;
                const headshot = action.headshot ? 3 : 1;

                target.health.value -= damage * headshot;
                target.health.value = Math.max(target.health.value, 0);

                if (target.cameraShake !== undefined) {
                    target.cameraShake.setScalar(1);
                }

                if (target.hitIndicator !== undefined) {
                    target.hitIndicator.show = true;
                    target.hitIndicator.time = this.world.elapsedTime;
                    target.hitIndicator.origin.copy(shooter.position);
                }

                return;
            }

            case ActionType.EmitProjectile: {
                const { projectileId, playerId, position, velcotiy } = action;
                const projectile = EntityFactory.Projectile(projectileId);
                projectile.projectile.spawnTime = this.world.elapsedTime;
                projectile.playerId = playerId;
                projectile.position.copy(position);
                projectile.velocity.copy(velcotiy);
                projectile.velocity.normalize();
                projectile.velocity.multiplyScalar(10);
                this.world.addEntity(projectile);
                return;
            }

            case ActionType.AmmoPackSpawn: {
                const pickup = EntityFactory.AmmoPikcup(action.weaponType);
                pickup.id = action.entityId;
                pickup.position.copy(action.position);
                this.world.addEntity(pickup);
                return;
            }

            case ActionType.AmmoPackPickup: {
                const pickup = this.world.entities.get(action.pickupId);
                this.world.removeEntity(action.pickupId);
                if (pickup === undefined) return;
                if (pickup.pickup === undefined) return;

                const avatar = this.world.entities.get(action.avatarId);
                if (avatar === undefined) return;
                if (avatar.shooter === undefined) return;

                // Update ammo
                const { shooter } = avatar;
                const { weaponType } = pickup.pickup;
                const ammo = getWeaponAmmo({ shooter }, weaponType);
                const spec = getWeaponSpec({ shooter }, weaponType);
                ammo.reserved += 10;
                ammo.reserved = Math.min(ammo.reserved, spec.maxReservedAmmo);

                // Play pickup sound
                this.runDispatch(
                    Action.playSound(
                        action.avatarId,
                        "/assets/sounds/pickup_1.wav"
                    )
                );

                return;
            }
        }
    }
}
