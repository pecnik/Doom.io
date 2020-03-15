import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Hitscan } from "../utils/EntityUtils";

export class PlayerShootSystem extends System {
    private readonly targets: Family;
    private readonly shooters: Family;

    public constructor(world: World) {
        super();

        this.targets = new FamilyBuilder(world).include(Comp.Render).build();

        this.shooters = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position2D)
            .include(Comp.Rotation2D)
            .include(Comp.Shooter)
            .build();
    }

    public update(world: World) {
        const { elapsedTime } = world;
        for (let i = 0; i < this.shooters.entities.length; i++) {
            const entity = this.shooters.entities[i];
            const input = entity.getComponent(Comp.PlayerInput);
            const position = entity.getComponent(Comp.Position2D);
            const rotation = entity.getComponent(Comp.Rotation2D);
            const shooter = entity.getComponent(Comp.Shooter);

            const fireRate = 1 / 4;
            const shootDelta = elapsedTime - shooter.shootTime;
            if (input.shoot && shootDelta > fireRate) {
                shooter.shootTime = elapsedTime;

                console.log("> TODO: Play shoot sound");

                // Init hitscan
                Hitscan.caster.entity = entity;
                Hitscan.origin.set(0, 0);
                Hitscan.camera.position.set(position.x, 0, position.y);
                Hitscan.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
                Hitscan.camera.updateWorldMatrix(false, false);
                Hitscan.raycaster.setFromCamera(Hitscan.origin, Hitscan.camera);
                const rsp = Hitscan.cast(world, this.targets);

                if (rsp.intersection === undefined) {
                    return;
                }

                if (rsp.entity === undefined && rsp.intersection.face) {
                    const { point, face } = rsp.intersection;
                    world.decals.spawn(point, face.normal);
                    return;
                }
            }
        }
    }
}
