import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import {
    TextureLoader,
    Sprite,
    SpriteMaterial,
    AdditiveBlending,
    NearestFilter,
    Vector3
} from "three";
import {
    PovComponent,
    PositionComponent,
    ControllerComponent,
    PovAnimation,
    ShooterComponent
} from "../Components";
import { lerp, ease } from "../core/Utils";

export class PovSystem extends System {
    public readonly family: Family;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(PovComponent)
            .include(ControllerComponent)
            .include(PositionComponent)
            .include(ShooterComponent)
            .build();

        world.addEntityListener({
            onEntityAdded: entity => {
                if (this.family.includesEntity(entity)) {
                    this.loadSprites(entity, world);
                }
            },
            onEntityRemoved: entity => {
                if (this.family.includesEntity(entity)) {
                    const pov = entity.getComponent(PovComponent);
                    world.camera.remove(pov.crosshair);
                    world.camera.remove(pov.weapon);
                }
            }
        });
    }

    private loadSprites(entity: Entity, world: World) {
        const pov = entity.getComponent(PovComponent);

        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const material = new SpriteMaterial({
                depthTest: false,
                depthWrite: false,
                blending: AdditiveBlending,
                map
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            pov.crosshair = new Sprite(material);
            pov.crosshair.renderOrder = 100;

            pov.crosshair.position.z = -4;
            world.camera.add(pov.crosshair);
        });

        new TextureLoader().load("/assets/sprites/pov-gun.png", map => {
            const material = new SpriteMaterial({
                depthTest: false,
                depthWrite: false,
                map
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            pov.weapon = new Sprite(material);
            pov.weapon.renderOrder = 100;

            pov.weapon.position.x = 0.75;
            pov.weapon.position.y = -0.5;
            pov.weapon.position.z = -1;
            world.camera.add(pov.weapon);
        });
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            this.updateLight(entity, world);

            const pov = entity.getComponent(PovComponent);
            const shooter = entity.getComponent(ShooterComponent);
            const controller = entity.getComponent(ControllerComponent);

            let prevState = pov.state;
            let nextState = pov.state;
            if (controller.move.lengthSq() < 1) {
                nextState = PovAnimation.Idle;
            } else {
                nextState = PovAnimation.Walk;
            }

            if (pov.transition > 0) {
                pov.transition = lerp(pov.transition, 0, 0.05);
            }

            if (prevState !== nextState) {
                pov.state = nextState;
                pov.transition = 1;
            }

            const frame = this.getAnimationFrame(pov, world.elapsedTime);
            if (pov.transition === 0) {
                pov.weapon.position.x = frame.x;
                pov.weapon.position.y = frame.y;
            } else {
                const pos = pov.weapon.position;
                pos.x = ease(pos.x, frame.x, 1 - pov.transition);
                pos.y = ease(pos.y, frame.y, 1 - pov.transition);
            }

            // Shoot animation
            pov.weapon.position.z = ease(pov.weapon.position.z, -1, 0.1);
            if (shooter.shootTime === world.elapsedTime) {
                pov.weapon.position.z = -0.75;
                pov.weapon.position.x = 0.75;
                pov.weapon.position.y = -0.625;
            }
        }
    }

    private getAnimationFrame(pov: PovComponent, elapsed: number) {
        const frame = new Vector3();
        frame.x = 0.75;
        frame.y = -0.625;
        frame.z = -1;
        switch (pov.state) {
            case PovAnimation.Walk:
                elapsed *= 10;
                frame.y += Math.abs(Math.sin(elapsed) * 0.05);
                frame.x += Math.cos(elapsed) * 0.05;
                break;

            case PovAnimation.Idle:
            default:
                frame.y += Math.sin(elapsed) * 0.05;
                break;
        }

        return frame;
    }

    private updateLight(entity: Entity, world: World) {
        const pov = entity.getComponent(PovComponent);
        const position = entity.getComponent(PositionComponent);
        const weaponSprite = pov.weapon.material;
        const cell = world.level.getCell(
            Math.round(position.x),
            Math.round(position.z)
        );
        if (cell !== undefined && !weaponSprite.color.equals(cell.light)) {
            weaponSprite.color.lerp(cell.light, 0.125);
            weaponSprite.needsUpdate = true;
        }
    }
}
