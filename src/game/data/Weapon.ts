export enum WeaponType {
    Pistol,
    Shotgun,
    Machinegun,
}

export class WeaponSpec {
    public type = WeaponType.Pistol;

    public scope = false;

    public spread = 0;
    public bulletDamage = 1;
    public bulletsPerShot = 1;
    public firerate = 0; // sec
    public reloadSpeed = 0; // Sec

    public maxLoadedAmmo = 1;
    public maxReservedAmmo = 1;

    // Assets
    public povSprite = "";
    public povFireSprites: string[] = [];
    public fireSound = "";
    public reloadSound = "";
    public ammoPickupMesh = "";
}

export class WeaponSpecBuilder {
    private readonly weaponSpec = new WeaponSpec();

    public type(type: WeaponType) {
        this.weaponSpec.type = type;
        return this;
    }

    public ammo(maxLoadedAmmo: number, maxReservedAmmo: number) {
        this.weaponSpec.maxLoadedAmmo = maxLoadedAmmo;
        this.weaponSpec.maxReservedAmmo = maxReservedAmmo;
        return this;
    }

    public accuracy(accuracy: number) {
        this.weaponSpec.spread = 0.3 * (1 - accuracy);
        return this;
    }

    public damage(damage: number, count = 1) {
        this.weaponSpec.bulletDamage = damage;
        this.weaponSpec.bulletsPerShot = count;
        return this;
    }

    public roundsPerSec(rps: number) {
        this.weaponSpec.firerate = 1 / rps;
        return this;
    }

    public reloadSpeed(speed: number) {
        this.weaponSpec.reloadSpeed = speed;
        return this;
    }

    public povSprite(sprite: string, povFireSprites = [sprite]) {
        this.weaponSpec.povSprite = sprite;
        this.weaponSpec.povFireSprites = povFireSprites;
        return this;
    }

    public ammoPickupMesh(mesh: string) {
        this.weaponSpec.ammoPickupMesh = mesh;
        return this;
    }

    public sound(sound: { fire: string; reload: string }) {
        this.weaponSpec.fireSound = sound.fire;
        this.weaponSpec.reloadSound = sound.reload;
        return this;
    }

    public scope() {
        this.weaponSpec.scope = true;
        return this;
    }

    public build() {
        return Object.freeze(this.weaponSpec);
    }
}

export const WEAPON_SPEC_RECORD: Record<WeaponType, Readonly<WeaponSpec>> = {
    [WeaponType.Pistol]: new WeaponSpecBuilder()
        .type(WeaponType.Pistol)
        .ammo(8, 256)
        .damage(20)
        .accuracy(0.9)
        .roundsPerSec(6)
        .reloadSpeed(1)
        .povSprite("/assets/sprites/Pistol/PIS001.png", [
            "/assets/sprites/Pistol/PIS002.png",
            "/assets/sprites/Pistol/PIS003.png",
            "/assets/sprites/Pistol/PIS004.png",
            "/assets/sprites/Pistol/PIS001.png",
        ])
        .ammoPickupMesh("__AMMO_GUN__")
        .sound({
            fire: "/assets/sounds/fire-gun.wav",
            reload: "/assets/sounds/reload.wav",
        })
        .scope()
        .build(),

    [WeaponType.Shotgun]: new WeaponSpecBuilder()
        .type(WeaponType.Shotgun)
        .ammo(3, 128)
        .damage(25, 4)
        .accuracy(0.1)
        .roundsPerSec(2)
        .reloadSpeed(1.25)
        .povSprite("/assets/sprites/Shotgun/SHT001.png", [
            "/assets/sprites/Shotgun/SHT002.png",
            "/assets/sprites/Shotgun/SHT003.png",
            "/assets/sprites/Shotgun/SHT004.png",
            "/assets/sprites/Shotgun/SHT005.png",
            "/assets/sprites/Shotgun/SHT006.png",
        ])
        .ammoPickupMesh("__AMMO_SHOTGUN__")
        .sound({
            fire: "/assets/sounds/fire-shotgun.wav",
            reload: "/assets/sounds/reload.wav",
        })
        .build(),

    [WeaponType.Machinegun]: new WeaponSpecBuilder()
        .type(WeaponType.Machinegun)
        .ammo(32, 512)
        .damage(15)
        .accuracy(0.75)
        .roundsPerSec(8)
        .reloadSpeed(1.5)
        .povSprite("/assets/sprites/Machinegun/MG0001.png", [
            "/assets/sprites/Machinegun/MG0002.png",
            "/assets/sprites/Machinegun/MG0003.png",
            "/assets/sprites/Machinegun/MG0004.png",
        ])
        .ammoPickupMesh("__AMMO_MACHINEGUN__")
        .sound({
            fire: "/assets/sounds/fire-machine-gun.wav",
            reload: "/assets/sounds/reload.wav",
        })
        .build(),
};
