import {
    Group,
    AdditiveBlending,
    NearestFilter,
    TextureLoader,
    SpriteMaterial,
    Sprite
} from "three";

export enum PovState {
    Walk,
    Idle,
    Jump,
    Fall,
    Shoot
}

export class Pov {
    public readonly scene = new Group();
    public crosshair = new Sprite();
    public weapon = new Sprite();
    public state = PovState.Idle;
    public transition = 0;

    public load() {
        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const material = new SpriteMaterial({
                depthTest: false,
                depthWrite: false,
                blending: AdditiveBlending,
                map
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            this.crosshair = new Sprite(material);
            this.crosshair.renderOrder = 100;

            this.crosshair.position.z = -4;
            this.scene.add(this.crosshair);
        });

        new TextureLoader().load("/assets/sprites/pov-gun.png", map => {
            const material = new SpriteMaterial({
                depthTest: false,
                depthWrite: false,
                map
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            this.weapon = new Sprite(material);
            this.weapon.renderOrder = 100;

            this.weapon.position.x = 0.75;
            this.weapon.position.y = -0.5;
            this.weapon.position.z = -1;
            this.scene.add(this.weapon);
        });
    }
}
