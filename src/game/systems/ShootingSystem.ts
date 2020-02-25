import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { random } from "lodash";
import { World } from "../World";
import {
    PositionComponent,
    VelocityComponent,
    LocalPlayerTag,
    RotationComponent,
    ShooterComponent
} from "../Components";
import { Input, MouseBtn } from "../core/Input";

export class ShootingSystem extends System {
    private readonly family: Family;
    private readonly input: Input;

    public constructor(world: World, input: Input) {
        super();
        this.input = input;
        this.family = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();
    }

    public update(world: World) {
        const { elapsedTime } = world;
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const shooter = entity.getComponent(ShooterComponent);

            const fireRate = 1 / 20;
            const shootDelta = elapsedTime - shooter.shootTime;
            const shootTriger = this.input.isMouseDown(MouseBtn.Left);
            if (shootTriger && shootDelta > fireRate) {
                shooter.shootTime = elapsedTime;

                const hits = this.hitscan(entity, world);
                for (let i = 0; i < hits.length; i++) {
                    const hit = hits[i];

                    // TMP
                    const impact = new Mesh(
                        new BoxGeometry(0.05, 0.05, 0.05),
                        new MeshBasicMaterial({ color: 0x000000 })
                    );
                    impact.position.copy(hit.point);
                    world.scene.add(impact);

                    break;
                }
            }
        }
    }

    private hitscan(entity: Entity, world: World) {
        const position = entity.getComponent(PositionComponent);
        const rotation = entity.getComponent(RotationComponent);
        const shooter = entity.getComponent(ShooterComponent);

        const spread = 0.05;
        shooter.origin.x = random(-spread, spread, true);
        shooter.origin.y = random(-spread, spread, true);

        shooter.camera.copy(world.camera);
        shooter.camera.position.set(position.x, position.y, position.z);
        shooter.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

        shooter.raycaster.setFromCamera(shooter.origin, shooter.camera);

        return shooter.raycaster.intersectObject(world.level.scene, true);
    }
}
