import { LocalAvatarArchetype, AvatarArchetype } from "../../ecs/Archetypes";
import { System, World } from "../../ecs";
import { Group, Sprite, Vector3, Scene } from "three";
import { HUD_WIDTH, HUD_HEIGHT, SWAP_SPEED } from "../../data/Globals";
import { WEAPON_SPEC_RECORD } from "../../data/Weapon";
import { loadTexture, getWeaponSpec, isScopeActive } from "../../Helpers";
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
        this.position.y -= 0.6;
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

    private readonly shootFrames = {
        frame: 0,
        time: 0,
        play: false,
    };

    public constructor(world: World, layer: Scene) {
        super(world);

        // Create weapon sprite container
        const container = new Group();
        container.position.x = HUD_WIDTH / 8;
        container.position.y = -HUD_HEIGHT / 4;
        container.renderOrder = 0;
        container.scale.set(2, 1, 1);
        container.scale.multiplyScalar(380);
        container.add(this.sprite);
        layer.add(container);

        // Create individual weapon sprites
        const createSprite = (src: string) => {
            const exists = this.sprite.getObjectByName(src);
            if (exists !== undefined) {
                return;
            }

            const sprite = new Sprite();
            sprite.name = src;
            this.sprite.add(sprite);
            loadTexture(src).then((map) => {
                sprite.material.map = map;
                sprite.material.needsUpdate = true;
            });
        };

        Object.values(WEAPON_SPEC_RECORD).forEach((weaponSpec) => {
            createSprite(weaponSpec.povSprite);
            weaponSpec.povFireSprites.forEach(createSprite);
        });
    }

    public update(dt: number) {
        const avatar = this.family.first();
        if (avatar === undefined) {
            this.sprite.visible = false;
            return;
        }

        this.sprite.visible = true;
        this.updateFrameAnimation(avatar, dt);
        this.updatePositionAnimation(avatar, dt);

        const scale = isScopeActive(avatar) ? 2 : 1;
        if (this.sprite.scale.x !== scale) {
            this.sprite.scale.lerp(new Vector3(scale, scale, scale), 0.25);
        }
    }

    private updateFrameAnimation(avatar: AvatarArchetype, dt: number) {
        const weaponSpec = getWeaponSpec(avatar);
        const frames = this.sprite.children as Sprite[];

        let activeSprite = weaponSpec.povSprite;
        if (this.shootFrames.play) {
            this.shootFrames.time += dt;
            if (this.shootFrames.time > 1 / 30) {
                this.shootFrames.time = 0;
                this.shootFrames.frame++;
            }

            if (this.shootFrames.frame >= weaponSpec.povFireSprites.length) {
                this.shootFrames.frame = 0;
                this.shootFrames.time = 0;
                this.shootFrames.play = false;
            } else {
                activeSprite =
                    weaponSpec.povFireSprites[this.shootFrames.frame];
            }
        }

        const light = this.world.level.getBlockLightAt(avatar.position);
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            frame.visible = frame.name === activeSprite;

            if (avatar.shooter.state === WeaponState.Shoot) {
                frame.material.color.setRGB(1.25, 1.25, 1.25);
                frame.material.needsUpdate = true;
            } else if (!frame.material.color.equals(light)) {
                frame.material.color.lerp(light, 0.125);
                frame.material.needsUpdate = true;
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
            const weaponSpec = getWeaponSpec(avatar);
            const knockback = weaponSpec.firerate / 8;
            this.sprite.position.x += knockback;
            this.sprite.position.y -= knockback / 0.25;
            stopClips();
            this.shootFrames.frame = 0;
            this.shootFrames.time = 0;
            this.shootFrames.play = true;
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
