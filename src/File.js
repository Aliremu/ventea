export class File {
    static async load(file) {
        let resp = await fetch(file);
        let src = await resp.text();

        return src;
    }
}