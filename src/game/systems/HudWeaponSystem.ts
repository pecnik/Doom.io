import { System, Entity } from "../ecs";
import { World } from "../ecs";
import { Comp } from "../ecs";
import { lerp, ease } from "../core/Utils";
import {
    Vector3,
    Object3D,
    NearestFilter,
    Sprite,
    SpriteMaterial,
    Texture,
    Group,
} from "three";
import { SWAP_SPEED, HUD_WIDTH, HUD_HEIGHT } from "../data/Globals";
import { WeaponSpecs, WeaponState } from "../weapons/Weapon";
import { Hud } from "../data/Hud";
import { isScopeActive } from "../Helpers";

enum Animation {
    Walk,
    Idle,
    Jump,
    Fall,
    Land,
    Swap,
    Shoot,
    Reload,
}

class ShooterArchetype {
    input = new Comp.Input();
    position = new Comp.Position();
    velocity = new Comp.Velocity();
    shooter = new Comp.Shooter();
    collision = new Comp.Collision();
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
    private readonly weapons: WeaponPovSprite[];
    private readonly family = this.createEntityFamily({
        archetype: new ShooterArchetype(),
    });

    private animation = Animation.Idle;
    private transition = 0;

    public constructor(world: World, hud: Hud) {
        super(world);

        this.weapons = WeaponSpecs.map((weapon) => {
            const map = weapon.povSpriteTexture as Texture;
            const sprite = new WeaponPovSprite(map);
            sprite.visible = false;
            return sprite;
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
        for (let i = 0; i < this.weapons.length; i++) {
            this.weapons[i].visible = false;
        }

        this.family.entities.forEach((entity) => {
            const shooter = entity.shooter;
            const position = entity.position;
            const weaponSprite = this.weapons[shooter.weaponIndex];
            for (let i = 0; i < this.weapons.length; i++) {
                this.weapons[i].visible = i === shooter.weaponIndex;
            }

            if (weaponSprite === undefined) {
                return;
            }

            // Scale sprite up when scope is active
            const scale = isScopeActive(entity) ? 2 : 1;
            if (weaponSprite.scale.x !== scale) {
                weaponSprite.scale.lerp(new Vector3(scale, scale, scale), 0.25);
            }

            // Update light color tint
            this.setLightColor(weaponSprite, world, position);

            // Update pov state
            const prevState = this.animation;
            const nextState = this.getState(entity);

            if (this.transition > 0) {
                this.transition = lerp(this.transition, 0, 0.05);
            }

            if (prevState !== nextState) {
                this.animation = nextState;
                this.transition = 1;
            }

            if (
                this.animation === Animation.Shoot ||
                this.animation === Animation.Swap
            ) {
                this.transition = 0;
            }

            if (this.animation === Animation.Land) {
                this.transition = 0;
            }

            const frame = this.getFrame(world, shooter);
            if (this.transition === 0) {
                weaponSprite.position.x = frame.x;
                weaponSprite.position.y = frame.y;
            } else {
                const pos = weaponSprite.position;
                pos.x = ease(pos.x, frame.x, 1 - this.transition);
                pos.y = ease(pos.y, frame.y, 1 - this.transition);
            }
        });
    }

    private setLightColor(
        weaponSprite: WeaponPovSprite,
        world: World,
        position: Comp.Position
    ) {
        const sprite = weaponSprite.material;
        const light = world.level.getVoxelLightAt(position);
        if (!sprite.color.equals(light)) {
            sprite.color.lerp(light, 0.125);
            sprite.needsUpdate = true;
        }
    }

    private getState(entity: Entity<ShooterArchetype>): Animation {
        const shooter = entity.shooter;
        if (shooter.state === WeaponState.Swap) return Animation.Swap;
        if (shooter.state === WeaponState.Shoot) return Animation.Shoot;
        if (shooter.state === WeaponState.Reload) return Animation.Reload;

        const collision = entity.collision;
        if (collision.falg.y !== -1) {
            return Animation.Jump;
        }

        if (this.animation === Animation.Jump) {
            return Animation.Land;
        }

        const velocity = entity.velocity;
        if (Math.abs(velocity.x) > 0.01 || Math.abs(velocity.z) > 0.01) {
            return Animation.Walk;
        }

        return Animation.Idle;
    }

    private getFrame(world: World, shooter: Comp.Shooter): Vector3 {
        const weapon = WeaponSpecs[shooter.weaponIndex];
        const frame = new Vector3(0, 0, 0);
        let elapsed = world.elapsedTime;

        switch (this.animation) {
            case Animation.Walk:
                elapsed *= 10;
                frame.y += Math.abs(Math.sin(elapsed) * 0.05);
                frame.x += Math.cos(elapsed) * 0.05;
                return frame;

            case Animation.Land:
                frame.y -= 0.125;
                return frame;

            case Animation.Jump:
            case Animation.Fall:
                frame.y += 0.0625;
                return frame;

            case Animation.Reload:
                frame.y -= 0.5;
                return frame;

            case Animation.Shoot:
                frame.x += weapon.knockback;
                frame.y -= weapon.knockback;
                return frame;

            case Animation.Swap:
                const swapDelta = world.elapsedTime - shooter.swapTime;
                frame.y = swapDelta / SWAP_SPEED - 1;
                return frame;

            case Animation.Idle:
            default:
                frame.y += Math.sin(elapsed) * 0.05;
                return frame;
        }
    }
}
