import { System } from "../../ecs";
import { World } from "../../ecs";
import { Hud } from "../../data/Hud";
import { MeshBasicMaterial, Mesh, RingGeometry } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { getWeaponSpec } from "../../Helpers";

export class CrosshairSystem extends System {
    private readonly crosshair: Mesh;
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(world: World, hud: Hud) {
        super(world);

        const geo = new RingGeometry(4, 4.1, 16);
        const mat = new MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            opacity: 0.5,
            transparent: true,
        });
        this.crosshair = new Mesh(geo, mat);
        hud.scene.add(this.crosshair);
    }

    public update() {
        const avatar = this.family.first();
        if (avatar === undefined) {
            return;
        }

        const weaponSpec = getWeaponSpec(avatar);
        const scale = 1 + 4 * (1 - weaponSpec.accuracy);
        if (this.crosshair.scale.x !== scale) {
            this.crosshair.scale.setScalar(scale);
        }
    }
}
