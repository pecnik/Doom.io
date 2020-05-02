import { Vector2, Group, Sprite, SpriteMaterial, Vector3 } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { SWAP_SPEED, HUD_WIDTH, HUD_HEIGHT } from "../../data/Globals";
import { System, World } from "../../ecs";
import { Hud } from "../../data/Hud";
import { WeaponSpecs, WeaponState } from "../../data/Types";
import { lerp } from "../../core/Utils";
import { isScopeActive } from "../../Helpers";
import { AvatarState } from "../../data/Types";

export type AnimationName =
    | "idle"
    | "walk"
    | "jump"
    | "fire"
    | "swap"
    | "land"
    | "reload";

abstract class WeaponSpriteAnimation {
    public weight = 0;
    public offset = new Vector2();
    public abstract readonly name: AnimationName;
    public abstract update(elapsed: number, avatar: LocalAvatarArchetype): void;
}

class IdleAnimation extends WeaponSpriteAnimation {
    public readonly name = "idle";
    public update(elapsed: number): void {
        this.offset.y = Math.sin(elapsed) * 0.05 - 0.1;
    }
}

class LandAnimation extends WeaponSpriteAnimation {
    public readonly name = "land";
    public update(_: number, avatar: LocalAvatarArchetype): void {
        if (avatar.avatar.prevVelocityY < 0) {
            this.offset.y = (avatar.avatar.prevVelocityY / 16) * 0.5;
        }
    }
}

class WalkAnimation extends WeaponSpriteAnimation {
    public readonly name = "walk";
    public update(elapsed: number): void {
        elapsed *= 10;
        this.offset.x = Math.cos(elapsed) * 0.05;
        this.offset.y = Math.abs(Math.sin(elapsed) * 0.05) - 0.1;
    }
}

class JumpAnimation extends WeaponSpriteAnimation {
    public readonly name = "jump";
    public update(): void {
        this.offset.y = 0.0625;
    }
}

class FireAnimation extends WeaponSpriteAnimation {
    public readonly name = "fire";
    public update() {
        const knockback = 0.125;
        this.offset.x = knockback;
        this.offset.y = -knockback;
    }
}

class SwapAnimation extends WeaponSpriteAnimation {
    public readonly name = "swap";
    public update(el: number, avatar: LocalAvatarArchetype): void {
        const swapDelta = el - avatar.shooter.swapTime;
        this.offset.y = swapDelta / SWAP_SPEED - 1;
        this.offset.y -= 0.25;
        this.offset.x = this.offset.y / 2;
    }
}

class ReloadAnimation extends WeaponSpriteAnimation {
    public readonly name = "reload";
    public update(): void {
        this.offset.y = -1;
    }
}

export class WeaponSpriteSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    private readonly origin: Group;
    private readonly sprites: Sprite[];
    private readonly offset = new Vector2();
    private readonly animations = [
        new IdleAnimation(),
        new WalkAnimation(),
        new JumpAnimation(),
        new FireAnimation(),
        new SwapAnimation(),
        new LandAnimation(),
        new ReloadAnimation(),
    ];

    public constructor(world: World, hud: Hud) {
        super(world);

        this.origin = new Group();
        this.sprites = this.origin.children as Sprite[];

        this.origin.position.x = HUD_WIDTH / 4;
        this.origin.position.y = -HUD_HEIGHT / 3;
        this.origin.renderOrder = 0;
        this.origin.scale.set(2, 1, 1);
        this.origin.scale.multiplyScalar(256);

        WeaponSpecs.forEach((spec) => {
            const material = new SpriteMaterial({ map: spec.povSpriteTexture });
            const sprite = new Sprite(material);
            this.origin.add(sprite);
        });

        hud.scene.add(this.origin);
    }

    public update() {
        for (let i = 0; i < this.sprites.length; i++) {
            this.sprites[i].visible = false;
        }

        const avatar = this.family.first();
        if (avatar === undefined) {
            return;
        }

        const sprite = this.sprites[avatar.shooter.weaponIndex];
        if (sprite === undefined) {
            return;
        }

        // Update animation
        this.setActiveAnimation(avatar);
        this.offset.setScalar(0);
        this.animations.forEach((loop) => {
            if (loop.weight > 0) {
                loop.update(this.world.elapsedTime, avatar);
                this.offset.x += loop.offset.x * loop.weight;
                this.offset.y += loop.offset.y * loop.weight;
            }
        });

        // Scale sprite up when scope is active
        const scale = isScopeActive(avatar) ? 2 : 1;
        if (sprite.scale.x !== scale) {
            sprite.scale.lerp(new Vector3(scale, scale, scale), 0.25);
        }

        // Update light color
        const light = this.world.level.getVoxelLightAt(avatar.position);
        if (!sprite.material.color.equals(light)) {
            sprite.material.color.lerp(light, 0.125);
            sprite.material.needsUpdate = true;
        }

        // Update position
        sprite.visible = true;
        sprite.position.x = this.offset.x;
        sprite.position.y = this.offset.y;
    }

    private playLoop(name: AnimationName) {
        this.animations.forEach((loop) => {
            const weight = loop.name === name ? 1 : 0;
            loop.weight = lerp(loop.weight, weight, 0.1);
        });
    }

    private playAction(name: AnimationName) {
        this.animations.forEach((loop) => {
            loop.weight = loop.name === name ? 1 : 0;
        });
    }

    private setActiveAnimation(avatar: LocalAvatarArchetype) {
        const stateS = avatar.shooter.state;
        const stateA = avatar.avatar.state;

        if (stateS === WeaponState.Reload) return this.playLoop("reload");
        if (stateS === WeaponState.Shoot) return this.playAction("fire");
        if (stateS === WeaponState.Swap) return this.playAction("swap");

        if (stateA === AvatarState.Land) return this.playAction("land");

        if (stateA === AvatarState.Idle) return this.playLoop("idle");
        if (stateA === AvatarState.Jump) return this.playLoop("jump");
        if (stateA === AvatarState.Walk) return this.playLoop("walk");
    }
}
