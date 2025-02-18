import { Entity } from './entity';

export class SolidEntity extends Entity {
    public constructor(depth: number) {
        super(depth, true);
    }
}
