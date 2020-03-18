import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { lerp } from "../core/Utils";

export class PlayerCameraSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position2D)
            .include(Comp.Rotation2D)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position2D);
            const rotation = entity.getComponent(Comp.Rotation2D);
            world.camera.position.set(position.x, 0, position.y);
            world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

            const fov = this.getWeaponFov(world, entity);
            if (world.camera.fov !== fov) {
                world.camera.fov = lerp(world.camera.fov, fov, 10);
                world.camera.updateProjectionMatrix();
            }
        }
    }

    private getWeaponFov(world: World, entity: Entity) {
        if (!entity.getComponent(Comp.Shooter)) {
            return 90;
        }

        const input = entity.getComponent(Comp.PlayerInput);
        const shooter = entity.getComponent(Comp.Shooter);
        const weapon = world.weapons[shooter.weaponIndex];
        return input.scope && weapon.scope ? 60 : 90;
    }
}
