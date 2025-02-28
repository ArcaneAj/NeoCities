import { triangular } from '../utils/triangle.util';
import { Entity } from './entity';
import type { UniformLocations } from './interfaces/uniform-locations.interface';

export abstract class RenderableEntity extends Entity {
    Draw(gl: WebGLRenderingContext, uniformLocations: UniformLocations) {
        const vertices = this.GetVertices();

        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

        var rainbowPeriod = 1500;

        // Set color.
        gl.uniform4f(
            uniformLocations.colorUniformLocation,
            triangular(0, rainbowPeriod),
            triangular(rainbowPeriod / 3, rainbowPeriod),
            triangular((2 * rainbowPeriod) / 3, rainbowPeriod),
            1
        );

        // Draw the entity.
        gl.drawArrays(this.GetDrawMode(gl), 0, vertices.length / 2);
    }

    abstract GetVertices(): Float32Array;
    abstract GetDrawMode(gl: WebGLRenderingContext): GLenum;

    ShouldRender(): boolean {
        return true;
    }
}
