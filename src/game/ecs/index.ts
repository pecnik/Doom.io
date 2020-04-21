import {
    Vector2,
    Object3D,
    Geometry,
    MeshBasicMaterial,
    BufferGeometry,
    Box2,
    PositionalAudio,
    Vector3,
    Group,
    Scene,
    PerspectiveCamera,
} from "three";
import { PLAYER_RADIUS, PLAYER_HEIGHT } from "../data/Globals";
import { WeaponState, WeaponAmmo, WeaponSpecs } from "../data/Weapon";

export module Comp {
    export class Position extends Vector3 {}

    export class Velocity extends Vector3 {}

    export class Rotation2D extends Vector2 {}

    export class Collider extends Box2 {}

    export class Collision {
        public readonly prev = new Vector3();
        public readonly next = new Vector3();
        public readonly falg = new Vector3();
        public radius = PLAYER_RADIUS;
        public height = PLAYER_HEIGHT;
    }

    export class PlayerInput {
        public movey = 0;
        public movex = 0;
        public lookHor = 0;
        public lookVer = 0;
        public weaponIndex = 0;
        public jump = false;
        public crouch = false;
        public shoot = false;
        public scope = false;
        public reload = false;
    }

    export class Shooter {
        public state = WeaponState.Idle;
        public swapTime = 0;
        public shootTime = 0;
        public reloadTime = 0;
        public weaponIndex = 0;
        public ammo: WeaponAmmo[] = WeaponSpecs.map((spec) => {
            return {
                loaded: spec.maxLoadedAmmo,
                reserved: spec.maxReservedAmmo,
            };
        });
    }

    export class Render {
        public static Geo: Geometry | BufferGeometry = new Geometry();
        public static Mat: MeshBasicMaterial = new MeshBasicMaterial();
        public obj = new Object3D();
        public geo = Render.Geo;
        public mat = Render.Mat;
    }

    export class RenderDecalTag {}

    export class Footstep {
        public audio?: PositionalAudio;
    }

    export class Gunshot {
        public audio?: PositionalAudio;
        public origin = new Object3D();
    }

    export class Health {
        public value = 100;
    }

    export class Jump {
        public triggerTime = 0;
        public coyoteTime = 0;
    }
}

export type AllComponents = {
    renderdecaltag: Comp.RenderDecalTag;
    position: Comp.Position;
    velocity: Comp.Velocity;
    rotation: Comp.Rotation2D;
    collider: Comp.Collider;
    collision: Comp.Collision;
    input: Comp.PlayerInput;
    shooter: Comp.Shooter;
    render: Comp.Render;
    footstep: Comp.Footstep;
    gunshot: Comp.Gunshot;
    health: Comp.Health;
    jump: Comp.Jump;
};

export type AnyComponents = Partial<AllComponents>;

export type Entity<T = AnyComponents> = { id: string } & T & AnyComponents;

export abstract class System {
    protected readonly engine: Engine;

    public constructor(engine: Engine) {
        this.engine = engine;
    }

    public abstract update(world: Engine, _: number): void;

    protected createEntityFamily<T extends AnyComponents>(props: {
        archetype: T;
        onEntityAdded?: (e: Entity<T>) => void;
        onEntityRemvoed?: (e: Entity<T>) => void;
    }) {
        const family = new Family(this.engine, props.archetype);

        if (props.onEntityAdded !== undefined) {
            family.onEntityAdded.push(props.onEntityAdded);
        }

        if (props.onEntityRemvoed !== undefined) {
            family.onEntityRemvoed.push(props.onEntityRemvoed);
        }

        return family;
    }

    protected createSceneGroup() {
        const group = new Group();
        this.engine.scene.add(group);
        return group;
    }
}

export class Family<T extends AnyComponents> {
    public readonly entities = new Map<string, Entity<T>>();
    public readonly onEntityAdded = new Array<(e: Entity<T>) => void>();
    public readonly onEntityRemvoed = new Array<(e: Entity<T>) => void>();

    public constructor(engine: Engine, archetype: T) {
        const comps = Object.keys(archetype) as Array<keyof AllComponents>;
        const check = (entity: Entity): boolean => {
            for (let i = 0; i < comps.length; i++) {
                const key = comps[i];
                if (entity[key] === undefined) return false;
            }
            return true;
        };

        engine.onEntityAdded.push((entity: Entity) => {
            if (check(entity)) {
                this.entities.set(entity.id, entity as Entity<T>);
                this.onEntityAdded.forEach((fn) => fn(entity as Entity<T>));
            }
        });

        engine.onEntityRemvoed.push((entity: Entity) => {
            this.onEntityRemvoed.forEach((fn) => fn(entity as Entity<T>));
            this.entities.delete(entity.id);
        });
    }
}

export class Engine {
    private readonly systems = new Array<System>();
    private readonly entities = new Map<string, Entity>();
    public readonly onEntityAdded = new Array<(e: Entity) => void>();
    public readonly onEntityRemvoed = new Array<(e: Entity) => void>();

    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);

    public addSystem(system: System) {
        this.systems.push(system);
    }

    public addEntity(entity: Entity) {
        this.entities.set(entity.id, entity);
        this.onEntityAdded.forEach((fn) => fn(entity));
    }

    public removeEntity(id: string) {
        const entity = this.entities.get(id);
        if (entity !== undefined) {
            this.onEntityRemvoed.forEach((fn) => fn(entity));
            this.entities.set(entity.id, entity);
        }
    }

    public update(dt: number) {
        this.systems.forEach((system: System) => {
            system.update(this, dt);
        });
    }
}
