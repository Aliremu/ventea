export class UUID {
    private static used: Set<number> = new Set();

    static generateUUID() {
        const buffer = new Uint32Array(1);

        do {
            crypto.getRandomValues(buffer);
        } while(this.used.has(buffer[0]));

        this.used.add(buffer[0]);

        return buffer[0];
    }
}