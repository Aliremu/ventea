import { Vector3Proxy } from "../Scene/Components";

export class Vector2 {
    public buffer: Float32Array;

    constructor(...values: number[]) {
        switch (values.length) {
            case 2: this.buffer = new Float32Array(values); break;
            case 1: this.buffer = new Float32Array([values[0], values[0]]); break;
            default: this.buffer = new Float32Array(2); break;
        }
    }

    clone() {
        return new Vector3(this.x, this.y);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const length = this.length();

        if(length != 0) {
            this.x /= length;
            this.y /= length;
        }
        
        return this;
    }

    get normalized() {
        const ret = new Vector2(this.x, this.y);
        return ret.normalize();
    }

    add(other: Vector2 | number, y?: number) {
        if(other instanceof Vector2) {
            this.x += other.x;
            this.y += other.y;
        } else {
            this.x += other;
            this.y += y ?? other;
        }

        return this;
    }

    sub(other: Vector2 | number, y?: number) {
        if(other instanceof Vector2) {
            this.x -= other.x;
            this.y -= other.y;
        } else {
            this.x -= other;
            this.y -= y ?? other;
        }

        return this;
    }

    mul(other: Vector2 | number, y?: number) {
        if(other instanceof Vector2) {
            this.x *= other.x;
            this.y *= other.y;
        } else {
            this.x *= other;
            this.y *= y ?? other;
        }

        return this;
    }

    div(other: Vector2 | number, y?: number) {
        if(other instanceof Vector2) {
            this.x /= other.x;
            this.y /= other.y;
        } else {
            this.x /= other;
            this.y /= y ?? other;
        }

        return this;
    }

    reset() {
        this.x = 0;
        this.y = 0;
    }

    set(x: number, y: number) {
        this.buffer[0] = x;
        this.buffer[1] = y;
    }

    get x() { return this.buffer[0]; }
    set x(value) { this.buffer[0] = value; }

    get y() { return this.buffer[1]; }
    set y(value) { this.buffer[1] = value; }
}

export class Vector3 {
    public buffer: Float32Array;

    constructor(...values: number[]) {
        switch (values.length) {
            case 3: this.buffer = new Float32Array(values); break;
            case 2: this.buffer = new Float32Array([values[0], values[1], 0]); break;
            case 1: this.buffer = new Float32Array([values[0], values[0], values[0]]); break;
            default: this.buffer = new Float32Array(3); break;
        }
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        this.x /= this.length();
        this.y /= this.length();
        this.z /= this.length();

        return this;
    }

    get normalized() {
        const ret = new Vector3(this.x, this.y, this.z);
        return ret.normalize();
    }

    add(other: Vector3 | Vector3Proxy | Vector2 | number) {
        if(other instanceof Vector3 || other instanceof Vector3Proxy) {
            this.x += other.x;
            this.y += other.y;
            this.z += other.z;
        } else if(other instanceof Vector2) {
            this.x += other.x;
            this.y += other.y;
        } else {
            this.x += other;
            this.y += other;
            this.z += other;
        }

        return this;
    }

    sub(other: Vector3 | Vector3Proxy | Vector2 | number) {
        if(other instanceof Vector3 || other instanceof Vector3Proxy) {
            this.x -= other.x;
            this.y -= other.y;
            this.z -= other.z;
        } else if(other instanceof Vector2) {
            this.x -= other.x;
            this.y -= other.y;
        } else {
            this.x -= other;
            this.y -= other;
            this.z -= other;
        }

        return this;
    }

    mul(other: Vector3 | Vector3Proxy | Vector2 | number) {
        if(other instanceof Vector3 || other instanceof Vector3Proxy) {
            this.x *= other.x;
            this.y *= other.y;
            this.z *= other.z;
        } else if(other instanceof Vector2) {
            this.x *= other.x;
            this.y *= other.y;
        } else {
            this.x *= other;
            this.y *= other;
            this.z *= other;
        }

        return this;
    }

    div(other: Vector3 | Vector3Proxy | Vector2 | number) {
        if(other instanceof Vector3 || other instanceof Vector3Proxy) {
            this.x /= other.x;
            this.y /= other.y;
            this.z /= other.z;
        } else if(other instanceof Vector2) {
            this.x /= other.x;
            this.y /= other.y;
        } else {
            this.x /= other;
            this.y /= other;
            this.z /= other;
        }

        return this;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    set(x: number, y: number, z: number) {
        this.buffer[0] = x;
        this.buffer[1] = y;
        this.buffer[2] = z;
    }

    get x() { return this.buffer[0]; }
    set x(value) { this.buffer[0] = value; }

    get y() { return this.buffer[1]; }
    set y(value) { this.buffer[1] = value; }

    get z() { return this.buffer[2]; }
    set z(value) { this.buffer[2] = value; }
}

export class Vector4 {
    public buffer: Float32Array;

    constructor(...values: number[]) {
        switch (values.length) {
            case 4: this.buffer = new Float32Array(values); break;
            case 3: this.buffer = new Float32Array([values[0], values[1], values[2], 0]); break;
            case 2: this.buffer = new Float32Array([values[0], values[1], 0, 0]); break;
            case 1: this.buffer = new Float32Array([values[0], values[0], values[0]]); break;
            default: this.buffer = new Float32Array(3); break;
        }
    }

    set(x: number, y: number, z: number, w: number) {
        this.buffer[0] = x;
        this.buffer[1] = y;
        this.buffer[2] = z;
        this.buffer[3] = w;
    }

    get x() { return this.buffer[0]; }
    set x(value) { this.buffer[0] = value; }

    get y() { return this.buffer[1]; }
    set y(value) { this.buffer[1] = value; }

    get z() { return this.buffer[2]; }
    set z(value) { this.buffer[2] = value; }
    
    get w() { return this.buffer[3]; }
    set w(value) { this.buffer[3] = value; }
}