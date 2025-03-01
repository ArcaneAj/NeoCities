import type { Entity } from './entity';
import type { UniformLocations } from './interfaces/uniform-locations.interface';
import type { RenderableEntity } from './renderable-entity';
import type { SolidRectangleEntity } from './solid-rectangle-entity';

export class Scene {
    Draw(gl: WebGLRenderingContext, uniformLocations: UniformLocations) {
        const entities = this.GetEntitiesToDraw();
        for (const entity of entities) {
            entity.Draw(gl, uniformLocations);
        }
    }

    public constructor(scene: Scene | null = null) {
        this.entities = [];
        this.previous = scene;
        this.next = null;
    }

    private entities: Entity[];
    private previous: Scene | null;
    private next: Scene | null;

    UpdateGameState(
        keyPressed: { [id: string]: boolean },
        maxTop: number
    ): Scene {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            const nextSceneOffset = entity.UpdateGameState(
                this,
                keyPressed,
                maxTop
            );
            if (nextSceneOffset > 0) {
                if (this.next === null) {
                    this.next = new Scene();
                }
                this.entities = this.entities.filter((x) => x !== entity);
                this.next.AddEntity(entity);
                this.next.AddPrevious(this);
                console.log('next');
                return this.next;
            }
            if (nextSceneOffset < 0) {
                if (this.previous === null) {
                    this.previous = new Scene();
                }
                this.entities = this.entities.filter((x) => x !== entity);
                this.previous.AddEntity(entity);
                console.log('previous');
                return this.previous;
            }
        }

        return this;
    }

    AddEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    AddPrevious(scene: Scene) {
        this.previous = scene;
    }

    GetEntitiesToDraw(): RenderableEntity[] {
        const renderableEntities: RenderableEntity[] = this.entities
            .filter((x) => x.ShouldRender())
            .map((x) => x as RenderableEntity);
        return renderableEntities;
    }

    GetSolidEntities(): SolidRectangleEntity[] {
        return this.entities
            .filter((x) => x.IsSolid())
            .map((x) => x as SolidRectangleEntity);
    }

    CollidesWith(state: SolidRectangleEntity): SolidRectangleEntity[] {
        const collisions: SolidRectangleEntity[] = [];

        for (const entity of this.GetSolidEntities()) {
            if (entity.id === state.id) {
                continue;
            }

            if (
                entity.left < state.left + state.width && // entity's left is to the left of state's right
                entity.left + entity.width > state.left && // entity's right is to the right of state's left
                entity.top < state.top + state.height && // entity's top is above state's bottom
                entity.top + entity.height > state.top // entity's bottom is below state's top
            ) {
                collisions.push(entity);
            }
        }

        return collisions;
    }
}
