export class ArrayBufferF32 {
    private readonly unit8: Uint8Array;

    public readonly buffer: Float32Array;

    public constructor(size: number) {
        const data: number[] = [];
        for (let i = 0; i < size; i++) {
            data[i] = 0;
        }
        this.buffer = new Float32Array(data);
        this.unit8 = new Uint8Array(this.buffer.buffer);
    }

    public toStringBuffer(): string {
        let msg = "";
        for (let i = 0; i < this.buffer.length; i++) {
            msg += ArrayBufferF32.float32ToString(this.buffer[i]);
        }
        return msg;
    }

    public readStringBuffer(str: string) {
        const char = this.unit8;
        for (let i = 0; i < char.length; i++) {
            char[i] = str.charCodeAt(i);
        }
    }

    private static readonly float32ToString = (() => {
        const float32 = new Float32Array(1);
        const unit8 = new Uint8Array(float32.buffer);
        return (number: number): string => {
            float32[0] = number;
            return String.fromCharCode(unit8[0], unit8[1], unit8[2], unit8[3]);
        };
    })();
}
