export enum MouseBtn {
    Left = 0,
    Mid = 1,
    Right = 2
}

export enum KeyCode {
    W = 87,
    S = 83,
    A = 65,
    D = 68,
    R = 82,
    F = 70,
    Q = 81,
    SHIFT = 16,
    SPACE = 32,
    CTRL = 17,
    DEL = 46,
    TAB = 9,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
    NUM_1 = 49,
    NUM_2 = 50,
    NUM_3 = 51
}

export class Input {
    private readonly keys: boolean[] = [];
    private readonly prev: boolean[] = [];
    public readonly mouse = {
        btn: [false, false, false],
        dx: 0,
        dy: 0,
        scroll: 0
    };

    public readonly destroy: () => void;

    public constructor(config: { requestPointerLock: boolean }) {
        const { requestPointerLock } = config;

        const handler = <T extends Event>(handler: (ev: T) => void) => {
            if (!requestPointerLock) {
                return (ev: T) => {
                    handler(ev);
                    return true;
                };
            }

            return (ev: T) => {
                if ((document as any).pointerLockElement !== document.body) {
                    return true;
                }

                handler(ev);
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            };
        };

        const onmousescroll = handler((ev: WheelEvent) => {
            this.mouse.scroll = ev.deltaY;
        });

        const onmousemove = handler((ev: MouseEvent) => {
            this.mouse.dx += ev.movementX;
            this.mouse.dy += ev.movementY;
        });

        const onmousedown = handler((ev: MouseEvent) => {
            this.mouse.btn[ev.button] = true;
        });

        const onmouseup = handler((ev: MouseEvent) => {
            this.mouse.btn[ev.button] = false;
        });

        const onkeydown = handler((ev: KeyboardEvent) => {
            this.keys[ev.keyCode] = true;
        });

        const onkeyup = handler((ev: KeyboardEvent) => {
            this.keys[ev.keyCode] = false;
        });

        const requestlock = () => {
            (document.body as any).requestPointerLock();
        };

        if (requestPointerLock) {
            document.body.addEventListener("click", requestlock, false);
        }

        window.addEventListener("keyup", onkeyup, false);
        window.addEventListener("keydown", onkeydown, false);

        document.body.addEventListener("mousemove", onmousemove, false);
        document.body.addEventListener("mousedown", onmousedown, false);
        document.body.addEventListener("mouseup", onmouseup, false);
        document.body.addEventListener("wheel", onmousescroll, {
            passive: false
        });

        this.destroy = () => {
            if (requestPointerLock) {
                document.body.removeEventListener("click", requestlock);
            }

            window.removeEventListener("keyup", onkeyup);
            window.removeEventListener("keydown", onkeydown);

            document.body.removeEventListener("mousemove", onmousemove);
            document.body.removeEventListener("mousedown", onmousedown);
            document.body.removeEventListener("mouseup", onmouseup);
        };

        for (let i = 0; i < 255; i++) {
            this.keys[i] = false;
        }

        for (let i = 0; i < 3; i++) {
            this.mouse.btn[i] = false;
        }
    }

    public isKeyUp(key: KeyCode): boolean {
        return this.keys[key] === false;
    }

    public isKeyDown(key: KeyCode): boolean {
        return this.keys[key] === true;
    }

    public isKeyPressed(key: KeyCode): boolean {
        return this.keys[key] === true && this.prev[key] === false;
    }

    public isKeyReleased(key: KeyCode): boolean {
        return this.keys[key] === false && this.prev[key] === true;
    }

    public isMouseDown(btn: MouseBtn): boolean {
        return this.mouse.btn[btn] === true;
    }

    public clear() {
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        this.mouse.scroll = 0;
        Object.assign(this.prev, this.keys);
    }
}