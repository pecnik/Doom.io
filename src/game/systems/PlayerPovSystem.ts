import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { lerp, ease } from "../core/Utils";
import {
    Vector3,
    Object3D,
    TextureLoader,
    NearestFilter,
    Sprite,
    SpriteMaterial
} from "three";

export enum State {
    Walk,
    Idle,
    Jump,
    Fall,
    Shoot
}

export class Weapon extends Object3D {
    public material = new SpriteMaterial();

    public constructor(speite: string) {
        super();

        new TextureLoader().load(speite, map => {
            this.material = new SpriteMaterial({
                depthTest: false,
                depthWrite: false,
                map
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            const sprite = new Sprite(this.material);
            sprite.scale.x = 2;
            sprite.renderOrder = 100;
            sprite.position.set(0.75, -0.625, -1);
            this.add(sprite);
        });
    }
}

export class PlayerPovSystem extends System {
    private readonly family: Family;
    private readonly weapon: Weapon;
    private state = State.Idle;
    private transition = 0;

    public constructor(world: World) {
        super();

        this.weapon = new Weapon("/assets/sprites/pov-gun.png");
        world.camera.add(this.weapon);

        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Velocity2D)
            .include(Comp.Shooter)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position2D);

            // Update light color tint
            const sprite = this.weapon.material;
            const cell = world.level.getCell(
                Math.round(position.x),
                Math.round(position.y)
            );

            if (cell !== undefined && !sprite.color.equals(cell.light)) {
                sprite.color.lerp(cell.light, 0.125);
                sprite.needsUpdate = true;
            }

            // Update pov state
            const prevState = this.state;
            const nextState = this.getState(world, entity);

            if (this.transition > 0) {
                this.transition = lerp(this.transition, 0, 0.05);
            }

            if (prevState !== nextState) {
                this.state = nextState;
                this.transition = 1;
            }

            const frame = this.getFrame(world.elapsedTime);
            if (this.state === State.Shoot) {
                this.transition = 0;
            }

            if (this.transition === 0) {
                this.weapon.position.x = frame.x;
                this.weapon.position.y = frame.y;
                this.weapon.position.z = frame.z;
            } else {
                const pos = this.weapon.position;
                pos.x = ease(pos.x, frame.x, 1 - this.transition);
                pos.y = ease(pos.y, frame.y, 1 - this.transition);
                pos.z = ease(pos.z, frame.z, 1 - this.transition);
            }
        }
    }

    private getState(world: World, entity: Entity) {
        const shooter = entity.getComponent(Comp.Shooter);
        if (shooter.shootTime === world.elapsedTime) {
            return State.Shoot;
        }

        const velocity = entity.getComponent(Comp.Velocity2D);
        if (velocity.lengthSq() > 0) {
            return State.Walk;
        }

        return State.Idle;
    }

    private getFrame(elapsed: number) {
        const frame = new Vector3();

        switch (this.state) {
            case State.Walk:
                elapsed *= 10;
                frame.y += Math.abs(Math.sin(elapsed) * 0.05);
                frame.x += Math.cos(elapsed) * 0.05;
                return frame;

            case State.Jump:
            case State.Fall:
                frame.y += 0.125;
                return frame;

            case State.Shoot:
                frame.z += 0.125;
                return frame;

            case State.Idle:
            default:
                frame.y += Math.sin(elapsed) * 0.05;
                return frame;
        }
    }
}
