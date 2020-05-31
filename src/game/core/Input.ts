export enum MouseBtn {
    Left = 0,
    Mid = 1,
    Right = 2,
}

export enum KeyCode {
    W = 87,
    S = 83,
    A = 65,
    B = 66,
    D = 68,
    E = 69,
    R = 82,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    L = 76,
    M = 77,
    N = 78,
    Q = 81,
    T = 84,
    Y = 89,
    Z = 90,
    SHIFT = 16,
    SPACE = 32,
    CTRL = 17,
    ALT = 18,
    DEL = 46,
    TAB = 9,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
    NUM_1 = 49,
    NUM_2 = 50,
    NUM_3 = 51,
}

export class Input {
    private readonly el: HTMLElement;
    private readonly keys: boolean[] = [];
    private readonly prev: boolean[] = [];
    public readonly mouse = {
        btns: [false, false, false],
        prev: [false, false, false],
        dx: 0,
        dy: 0,
        scroll: 0,
    };

    public readonly destroy: () => void;

    public constructor(config: {
        requestPointerLock: boolean;
        element?: HTMLElement;
    }) {
        const { requestPointerLock, element = document.body } = config;

        this.el = element;

        const handler = <T extends Event>(handler: (ev: T) => void) => {
            if (!requestPointerLock) {
                return (ev: T) => {
                    handler(ev);
                    return true;
                };
            }

            return (ev: T) => {
                if ((document as any).pointerLockElement !== this.el) {
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
            this.mouse.btns[ev.button] = true;
        });

        const onmouseup = handler((ev: MouseEvent) => {
            this.mouse.btns[ev.button] = false;
        });

        const onkeydown = handler((ev: KeyboardEvent) => {
            this.keys[ev.keyCode] = true;
        });

        const onkeyup = handler((ev: KeyboardEvent) => {
            this.keys[ev.keyCode] = false;
        });

        const requestlock = () => {
            (this.el as any).requestPointerLock();
        };

        let wasLcoked = false;
        const onLockChange = () => {
            if (wasLcoked !== this.isLocked()) {
                wasLcoked = this.isLocked();

                // Reset input
                for (let i = 0; i < 255; i++) this.keys[i] = false;
                for (let i = 0; i < 3; i++) this.mouse.btns[i] = false;
            }
        };

        const reset = () => {
            for (let i = 0; i < 255; i++) {
                this.keys[i] = false;
            }

            for (let i = 0; i < 3; i++) {
                this.mouse.btns[i] = false;
                this.mouse.prev[i] = false;
            }
        };

        if (requestPointerLock) {
            this.el.addEventListener("click", requestlock, false);
            document.addEventListener("pointerlockchange", onLockChange, false);
        }

        window.addEventListener("keyup", onkeyup, false);
        window.addEventListener("keydown", onkeydown, false);

        this.el.addEventListener("mousemove", onmousemove, false);
        this.el.addEventListener("mousedown", onmousedown, false);
        this.el.addEventListener("mouseup", onmouseup, false);
        this.el.addEventListener("wheel", onmousescroll, {
            passive: false,
        });

        window.addEventListener("focus", reset);
        reset();

        document.oncontextmenu = (ev) => {
            if (ev.target === this.el) {
                ev.preventDefault();
            }
        };

        this.destroy = () => {
            if (requestPointerLock) {
                this.el.removeEventListener("click", requestlock);
                document.removeEventListener("pointerlockchange", onLockChange);
            }

            document.oncontextmenu = () => {};

            window.removeEventListener("focus", reset);
            window.removeEventListener("keyup", onkeyup);
            window.removeEventListener("keydown", onkeydown);

            this.el.removeEventListener("mousemove", onmousemove);
            this.el.removeEventListener("mousedown", onmousedown);
            this.el.removeEventListener("mouseup", onmouseup);
            this.el.removeEventListener("wheel", onmousescroll);
        };
    }

    public isLocked(): boolean {
        return (document as any).pointerLockElement === this.el;
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
        return this.mouse.btns[btn] === true;
    }

    public isMousePresed(btn: MouseBtn): boolean {
        return this.mouse.btns[btn] === true && this.mouse.prev[btn] === false;
    }

    public isMouseReleased(btn: MouseBtn): boolean {
        return this.mouse.btns[btn] === false && this.mouse.prev[btn] === true;
    }

    public isAnyMouseDown(): boolean {
        for (let btn = 0; btn < this.mouse.btns.length; btn++) {
            if (this.isMouseDown(btn)) return true;
        }
        return false;
    }

    public isAnyMousePresed(): boolean {
        for (let btn = 0; btn < this.mouse.btns.length; btn++) {
            if (this.isMousePresed(btn)) return true;
        }
        return false;
    }

    public isAnyMousReleased(): boolean {
        for (let btn = 0; btn < this.mouse.btns.length; btn++) {
            if (this.isMouseReleased(btn)) return true;
        }
        return false;
    }

    public clear() {
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        this.mouse.scroll = 0;
        Object.assign(this.prev, this.keys);
        Object.assign(this.mouse.prev, this.mouse.btns);
    }
}
