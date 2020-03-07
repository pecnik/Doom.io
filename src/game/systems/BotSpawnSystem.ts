import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import { uniqueId } from "lodash";
import {
    AiComponent,
    HealthComponent,
    ControllerComponent,
    ShooterComponent,
    PositionComponent,
    RotationComponent,
    VelocityComponent,
    Object3DComponent,
    MeshComponent,
    SoundComponent,
    FootstepComponent
} from "../Components";

export class BotSpawnSystem extends System {
    private readonly family: Family;
    private spawnTime = 0;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world).include(AiComponent).build();
    }

    public update(world: World) {
        if (this.family.entities.length >= 3) return;
        if (world.elapsedTime - this.spawnTime < 5) return;

        if (this.spawnBot(world)) {
            this.spawnTime = world.elapsedTime;
        }
    }

    public spawnBot(world: World) {
        const x = Math.floor(world.level.cols * Math.random());
        const z = Math.floor(world.level.rows * Math.random());
        const cell = world.level.getCell(x, z);
        if (cell === undefined) return false;
        if (cell.wall) return false;

        const bot = new Entity();
        bot.id = uniqueId(`bot`);

        bot.putComponent(AiComponent);
        bot.putComponent(HealthComponent);
        bot.putComponent(ControllerComponent);
        bot.putComponent(ShooterComponent);
        bot.putComponent(PositionComponent);
        bot.putComponent(RotationComponent);
        bot.putComponent(VelocityComponent);
        bot.putComponent(FootstepComponent);
        bot.putComponent(Object3DComponent);
        bot.putComponent(MeshComponent);
        bot.putComponent(SoundComponent);

        const position = bot.getComponent(PositionComponent);
        position.x = x;
        position.z = z;

        world.addEntity(bot);
        console.log(`> Spawn::bot(${x},${z})`);
        return true;
    }
}
