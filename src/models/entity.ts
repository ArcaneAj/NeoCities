import type { UUID } from '../types/uuid.type';
import type { Scene } from './scene';

export abstract class Entity {
    public constructor() {
        this.id = crypto.randomUUID();
    }

    id: UUID;

    ShallowClone(): this {
        return Object.create(this);
    }

    abstract ShouldRender(): boolean;
    abstract IsSolid(): boolean;

    abstract UpdateGameState(
        scene: Scene,
        keyPressed: { [id: string]: boolean },
        maxTop: number
    ): number;
}
