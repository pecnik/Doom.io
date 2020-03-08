import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import {
    TextureLoader,
    Sprite,
    SpriteMaterial,
    AdditiveBlending,
    NearestFilter
} from "three";
import { PovSpritesComponent, PositionComponent } from "../Components";

export class PovSystem extends System {
    public readonly family: Family;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(PovSpritesComponent)
            .include(PositionComponent)
            .build();

        world.addEntityListener({
            onEntityAdded: entity => {
                if (this.family.includesEntity(entity)) {
                    this.loadSprites(entity, world);
                }
            },
            onEntityRemoved: entity => {
                if (this.family.includesEntity(entity)) {
                    const pov = entity.getComponent(PovSpritesComponent);
                    world.camera.remove(pov.crosshair);
                    world.camera.remove(pov.weapon);
                }
            }
        });
    }

    private loadSprites(entity: Entity, world: World) {
        const pov = entity.getComponent(PovSpritesComponent);

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
            const pov = entity.getComponent(PovSpritesComponent);
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
}
