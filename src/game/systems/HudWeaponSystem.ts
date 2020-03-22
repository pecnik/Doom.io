import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { lerp, ease } from "../core/Utils";
import {
    Vector3,
    Object3D,
    NearestFilter,
    Sprite,
    SpriteMaterial,
    Texture,
    Group
} from "three";
import { SWAP_SPEED, HUD_WIDTH, HUD_HEIGHT } from "../data/Globals";
import { WeaponSpec, WeaponSpecs } from "../data/Weapon";
import { Hud } from "../data/Hud";
import { isScopeActive } from "../utils/EntityUtils";

export enum State {
    Walk,
    Idle,
    Jump,
    Fall,
    Shoot
}

export class WeaponPovSprite extends Object3D {
    public material = new SpriteMaterial();

    public constructor(map: Texture) {
        super();

        this.material = new SpriteMaterial({ map });
        map.magFilter = NearestFilter;
        map.minFilter = NearestFilter;

        const sprite = new Sprite(this.material);
        sprite.scale.set(2, 1, 1);
        this.add(sprite);
    }
}

export class HudWeaponSystem extends System {
    private readonly family: Family;
    private readonly weapons: WeaponPovSprite[];

    private state = State.Idle;
    private transition = 0;

    public constructor(world: World, hud: Hud) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Velocity2D)
            .include(Comp.Shooter)
            .build();

        this.weapons = WeaponSpecs.map(weapon => {
            return new WeaponPovSprite(weapon.povSpriteTexture as Texture);
        });

        const group = new Group();
        group.add(...this.weapons);
        group.position.x = HUD_WIDTH / 4;
        group.position.y = -HUD_HEIGHT / 3;
        group.renderOrder = 0;
        group.scale.multiplyScalar(256);

        hud.scene.add(group);
    }

    public update(world: World) {
        const { elapsedTime } = world;

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const shooter = entity.getComponent(Comp.Shooter);
            const position = entity.getComponent(Comp.Position2D);

            const weaponSprite = this.weapons[shooter.weaponIndex];
            for (let i = 0; i < this.weapons.length; i++) {
                this.weapons[i].visible = i === shooter.weaponIndex;
            }

            if (weaponSprite === undefined) {
                return;
            }

            // Update light color tint
            const sprite = weaponSprite.material;
            const cell = world.level.getCell(
                Math.round(position.x),
                Math.round(position.y)
            );

            if (cell !== undefined && !sprite.color.equals(cell.light)) {
                sprite.color.lerp(cell.light, 0.125);
                sprite.needsUpdate = true;
            }

            // Scale sprite up when scope is active
            const scale = isScopeActive(entity) ? 2 : 1;
            if (weaponSprite.scale.x !== scale) {
                weaponSprite.scale.lerp(new Vector3(scale, scale, scale), 0.25);
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

            const weapon = WeaponSpecs[shooter.weaponIndex];
            const frame = this.getFrame(world, weapon);

            if (this.state === State.Shoot) {
                this.transition = 0;
            }

            if (this.transition === 0) {
                weaponSprite.position.x = frame.x;
                weaponSprite.position.y = frame.y;
            } else {
                const pos = weaponSprite.position;
                pos.x = ease(pos.x, frame.x, 1 - this.transition);
                pos.y = ease(pos.y, frame.y, 1 - this.transition);
            }

            const swapDelta = elapsedTime - shooter.swapTime;
            if (swapDelta < SWAP_SPEED) {
                weaponSprite.position.y = swapDelta / SWAP_SPEED - 1;
                continue;
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

    private getFrame(world: World, weapon: WeaponSpec) {
        const frame = new Vector3(0, 0, 0);
        let elapsed = world.elapsedTime;
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
                frame.x += weapon.knockback;
                frame.y -= weapon.knockback;
                return frame;

            case State.Idle:
            default:
                frame.y += Math.sin(elapsed) * 0.05;
                return frame;
        }
    }
}
