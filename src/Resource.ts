import { Resources } from "./index"; //TODO: Ugly solution?
import { UUID } from "./Core/UUID";

export class Resource<T> {
    public handle: number;

    constructor() {
        this.handle = UUID.generateUUID();;

        Resources.add<T>(this.handle, this);
    }
}