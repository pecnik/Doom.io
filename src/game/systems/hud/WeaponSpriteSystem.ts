import { LocalAvatarArchetype, AvatarArchetype } from "../../ecs/Archetypes";
import { System, World } from "../../ecs";
import { Group, Sprite, Vector3 } from "three";
import { Hud } from "../../data/Hud";
import { HUD_WIDTH, HUD_HEIGHT, SWAP_SPEED } from "../../data/Globals";
import { WEAPON_SPEC_RECORD } from "../../data/Weapon";
import { loadTexture, getWeaponSpec } from "../../Helpers";
import { AvatarState, WeaponState } from "../../data/Types";
import { lerp, ease } from "../../core/Utils";

class Clip {
    public time = 0;
    public weight = 1;
    public play = false;
    public position = new Vector3();

    public update(dt: number) {
        this.time += dt;
        this.animation();
    }

    public animation() {
        // ...
    }
}

class IdleClip extends Clip {
    animation() {
        this.position.y = Math.sin(this.time) * 0.05 - 0.1;
    }
}

class WalkClip extends Clip {
    animation() {
        const elapsed = this.time * 10;
        this.position.x = Math.cos(elapsed) * 0.05;
        this.position.y = Math.abs(Math.sin(elapsed) * 0.05) - 0.1;
    }
}

class JumpClip extends Clip {
    animation() {
        this.position.y = 0.1;
    }
}

class LandClip extends Clip {
    animation() {
        this.position.y = -0.1;
    }
}

class ReloadClip extends Clip {
    animation() {
        const elapsed = this.time;
        this.position.x = Math.cos(elapsed) * 0.05;
        this.position.y = Math.abs(Math.sin(elapsed) * 0.05) - 0.1;
        this.position.y -= 1;
    }
}

export class WeaponSpriteSystem extends System {
    private readonly sprite = new Group();
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    private readonly idleClip = new IdleClip();
    private readonly walkClip = new WalkClip();
    private readonly jumpClip = new JumpClip();
    private readonly landClip = new LandClip();
    private readonly reloadClip = new ReloadClip();
    private readonly animationClips = [
        this.idleClip,
        this.walkClip,
        this.jumpClip,
        this.landClip,
        this.reloadClip,
    ];

    public constructor(world: World, hud: Hud) {
        super(world);

        // Create weapon sprite container
        const container = new Group();
        container.position.x = HUD_WIDTH / 4;
        container.position.y = -HUD_HEIGHT / 3;
        container.renderOrder = 0;
        container.scale.set(2, 1, 1);
        container.scale.multiplyScalar(256);
        container.add(this.sprite);
        hud.scene.add(container);

        // Create individual weapon sprites
        Object.values(WEAPON_SPEC_RECORD).forEach((weaponSpec) => {
            const sprite = new Sprite();
            this.sprite.add(sprite);

            loadTexture(weaponSpec.povSprite).then((map) => {
                sprite.name = weaponSpec.povSprite;
                sprite.material.map = map;
                sprite.material.needsUpdate = true;
            });
        });
    }

    public update(dt: number) {
        const avatar = this.family.first();
        if (avatar === undefined) {
            this.sprite.visible = false;
            return;
        }

        this.sprite.visible = true;
        this.updateClip(avatar);
        this.updatePositionAnimation(avatar, dt);
    }

    private updateClip(avatar: AvatarArchetype) {
        const weaponSpec = getWeaponSpec(avatar);
        const frames = this.sprite.children as Sprite[];
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            frame.visible = frame.name === weaponSpec.povSprite;

            if (frame.visible) {
                const light = this.world.level.getVoxelLightAt(avatar.position);
                if (!frame.material.color.equals(light)) {
                    frame.material.color.lerp(light, 0.125);
                    frame.material.needsUpdate = true;
                }
            }
        }
    }

    private updatePositionAnimation(avatar: AvatarArchetype, dt: number) {
        const astate = avatar.avatar.state;
        const sstate = avatar.shooter.state;

        const stopClips = () => {
            this.animationClips.forEach((clip) => {
                clip.weight = 0;
                clip.play = false;
            });
        };

        const playClip = (loop: Clip, dt = 1 / 30) => {
            for (let i = 0; i < this.animationClips.length; i++) {
                const clip = this.animationClips[i];
                if (clip === loop) {
                    clip.play = true;
                    clip.weight = lerp(clip.weight, 1, dt);
                } else {
                    clip.play = false;
                    clip.weight = 0;
                }
            }
        };

        if (sstate === WeaponState.Shoot) {
            const knockback = 0.125;
            this.sprite.position.x = knockback;
            this.sprite.position.y = -knockback;
            stopClips();
            return;
        }

        if (sstate === WeaponState.Swap) {
            const swapDelta = this.world.elapsedTime - avatar.shooter.swapTime;
            const pos = this.sprite.position;
            pos.y = ease(-1, 0, swapDelta / SWAP_SPEED);
            pos.x = pos.y / 2;
            stopClips();
            return;
        }

        if (sstate === WeaponState.Reload) {
            playClip(this.reloadClip);
        } else if (astate === AvatarState.Walk) {
            playClip(this.walkClip);
        } else if (astate === AvatarState.Jump) {
            playClip(this.jumpClip);
        } else if (astate === AvatarState.Land) {
            playClip(this.landClip, 1);
        } else {
            playClip(this.idleClip);
        }

        // Update clips
        this.animationClips.forEach((clip) => {
            if (clip.play) {
                clip.time += dt;
                clip.animation();

                this.sprite.position.x = ease(
                    this.sprite.position.x,
                    clip.position.x,
                    clip.weight
                );

                this.sprite.position.y = ease(
                    this.sprite.position.y,
                    clip.position.y,
                    clip.weight
                );
            }
        });
    }
}
