import { World, Components } from "./ecs";
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

            case ActionType.SpawnAvatar: {
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

            case ActionType.SpawnAmmoPack: {
                const { id, position, weaponType, ammo } = action;

                const ammoPack = EntityFactory.AmmoPack(id);
                ammoPack.pickupAmmo.ammo = ammo;
                ammoPack.pickupAmmo.weaponType = weaponType;
                ammoPack.position.copy(position);

                const mesh = WEAPON_SPEC_RECORD[weaponType].ammoPickupMesh;
                ammoPack.entityMesh = new Components.EntityMesh(mesh);

                this.world.addEntity(ammoPack);
                return;
            }

            case ActionType.SpawnHealthPack: {
                const { id, position, heal } = action;
                const healthPack = EntityFactory.HealthPack(id);
                healthPack.pickupHealth.heal = heal;
                healthPack.position.copy(position);

                const mesh = "/assets/mesh/healt_pickup.gltf";
                healthPack.entityMesh = new Components.EntityMesh(mesh);

                this.world.addEntity(healthPack);
                break;
            }

            case ActionType.ConsumePickup: {
                const pickup = this.world.entities.get(action.pickupId);
                this.world.removeEntity(action.pickupId);
                if (pickup === undefined) return;

                const avatar = this.world.entities.get(action.avatarId);
                if (avatar === undefined) return;
                if (avatar.health === undefined) return;
                if (avatar.shooter === undefined) return;

                if (pickup.pickupHealth !== undefined) {
                    const { health } = avatar;
                    health.value += pickup.pickupHealth.heal;
                    health.value = Math.min(health.value, 100);
                }

                if (pickup.pickupAmmo !== undefined) {
                    const { weaponType } = pickup.pickupAmmo;
                    const { shooter } = avatar;
                    const ammo = getWeaponAmmo({ shooter }, weaponType);
                    const spec = getWeaponSpec({ shooter }, weaponType);
                    ammo.reserved += pickup.pickupAmmo.ammo;
                    ammo.reserved = Math.min(
                        ammo.reserved,
                        spec.maxReservedAmmo
                    );
                }

                this.runDispatch(
                    Action.playSound(
                        action.avatarId,
                        "/assets/sounds/pickup_1.wav"
                    )
                );

                return;
            }

            case ActionType.UpdateKillLog: {
                const { killerPlayerId, victimPlayerId } = action;
                console.log(`> ${killerPlayerId} -> ${victimPlayerId}`);
                return;
            }
        }
    }
}
