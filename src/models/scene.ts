import type { Entity } from './entity';
import type { UniformLocations } from './interfaces/uniform-locations.interface';
import type { RenderableEntity } from './renderable-entity';

export class Scene {
    Draw(gl: WebGLRenderingContext, uniformLocations: UniformLocations) {
        const entities = this.GetEntitiesToDraw();
        for (const entity of entities) {
            entity.Draw(gl, uniformLocations);
        }
    }

    public constructor() {
        this.entities = [];
    }

    entities: Entity[];

    UpdateGameState(keyPressed: { [id: string]: boolean }): void {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            entity.UpdateGameState(this, keyPressed);
        }
    }

    AddEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    GetEntitiesToDraw(): RenderableEntity[] {
        const renderableEntities: RenderableEntity[] = this.entities
            .filter((x) => x.ShouldRender())
            .map((x) => x as RenderableEntity);
        return renderableEntities;
    }
}
