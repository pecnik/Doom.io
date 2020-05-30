import { System } from "../../ecs";
import { EnemyAvatarArchetype } from "../../ecs/Archetypes";
import { getEntityMesh } from "../../Helpers";
import { WeaponType } from "../../data/Weapon";

export class AvatarMeshSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new EnemyAvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((avatar) => {
            const mesh = getEntityMesh(this.world, avatar);
            if (mesh !== undefined) {
                mesh.position.copy(avatar.position);
                mesh.rotation.y = avatar.rotation.y + Math.PI;

                const body = mesh.getObjectByName("BODY");
                if (body === undefined) return;

                const rot1 = avatar.rotation.x * 0.5;
                body.rotation.x = -rot1;

                const rot2 = avatar.rotation.x - rot1;
                const head = body.getObjectByName("HEAD");
                if (head !== undefined) {
                    head.rotation.x = -rot2;
                }

                const arms = body.getObjectByName("ARMS");
                if (arms !== undefined) {
                    arms.rotation.x = -rot2;

                    // Guns
                    const type = avatar.shooter.weaponType;
                    const shtg = arms.getObjectByName("SHOTGUN");
                    if (shtg !== undefined) {
                        shtg.visible = type === WeaponType.Shotgun;
                    }

                    const pist = arms.getObjectByName("PISTOL");
                    if (pist !== undefined) {
                        pist.visible = type === WeaponType.Pistol;
                    }

                    const mchg = arms.getObjectByName("MACHINEGUN");
                    if (mchg !== undefined) {
                        mchg.visible = type === WeaponType.Machinegun;
                    }
                }
            }
        });
    }
}
