import { SolidRectangleEntity } from '../models/solid-rectangle-entity';
import type { TouchModel } from '../models/touch';

function CreateDemoVertexShader(gl: WebGLRenderingContext): WebGLShader {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(
        vertexShader,
        `
precision lowp float;

attribute vec2 a_position; // Flat square on XY plane
attribute float a_startAngle;
attribute float a_angularVelocity;
attribute float a_rotationAxisAngle;
attribute float a_particleDistance;
attribute float a_particleAngle;
attribute float a_particleY;
uniform float u_time; // Global state

varying vec2 v_position;
varying vec3 v_color;
varying float v_overlight;

void main() {
float angle = a_startAngle + a_angularVelocity * u_time;
float vertPosition = 1.1 - mod(u_time * .25 + a_particleY, 2.2);
float viewAngle = a_particleAngle + mod(u_time * .25, 6.28);

mat4 vMatrix = mat4(
1.3, 0.0, 0.0, 0.0,
0.0, 1.3, 0.0, 0.0,
0.0, 0.0, 1.0, 1.0,
0.0, 0.0, 0.0, 1.0
);

mat4 shiftMatrix = mat4(
1.0, 0.0, 0.0, 0.0,
0.0, 1.0, 0.0, 0.0,
0.0, 0.0, 1.0, 0.0,
a_particleDistance * sin(viewAngle), vertPosition, a_particleDistance * cos(viewAngle), 1.0
);

mat4 pMatrix = mat4(
cos(a_rotationAxisAngle), sin(a_rotationAxisAngle), 0.0, 0.0,
-sin(a_rotationAxisAngle), cos(a_rotationAxisAngle), 0.0, 0.0,
0.0, 0.0, 1.0, 0.0,
0.0, 0.0, 0.0, 1.0
) * mat4(
1.0, 0.0, 0.0, 0.0,
0.0, cos(angle), sin(angle), 0.0,
0.0, -sin(angle), cos(angle), 0.0,
0.0, 0.0, 0.0, 1.0
);

gl_Position = vMatrix * shiftMatrix * pMatrix * vec4(a_position * 0.03, 0.0, 1.0);
vec4 normal = vec4(0.0, 0.0, 1.0, 0.0);
vec4 transformedNormal = normalize(pMatrix * normal);

float dotNormal = abs(dot(normal.xyz, transformedNormal.xyz));
float regularLighting = dotNormal / 2.0 + 0.5;
float glanceLighting = smoothstep(0.92, 0.98, dotNormal);
v_color = vec3(
mix((0.5 - transformedNormal.z / 2.0) * regularLighting, 1.0, glanceLighting),
mix(0.5 * regularLighting, 1.0, glanceLighting),
mix((0.5 + transformedNormal.z / 2.0) * regularLighting, 1.0, glanceLighting)
);

v_position = a_position;
v_overlight = 0.9 + glanceLighting * 0.1;
}
`
    );
    gl.compileShader(vertexShader);
    return vertexShader;
}

function CreateDemoFragmentShader(gl: WebGLRenderingContext): WebGLShader {
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(
        fragmentShader,
        `
precision lowp float;
varying vec2 v_position;
varying vec3 v_color;
varying float v_overlight;

void main() {
gl_FragColor = vec4(v_color, 1.0 - smoothstep(0.8, v_overlight, length(v_position)));
}
`
    );
    gl.compileShader(fragmentShader);
    return fragmentShader;
}

export function OcclusionCulling(
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext
) {
    // Create program with basic quad shaders
    const { resolutionUniformLocation, colorUniformLocation } =
        CreateBasicQuadProgram(gl, canvas);

    var maxLeft = gl.canvas.width;
    var maxTop = gl.canvas.height;

    const startQauds: SolidRectangleEntity[] = [];

    startQauds.push(new SolidRectangleEntity(200, 200, 100, 100, 0, true));
    startQauds.push(new SolidRectangleEntity(300, 200, 100, 100, 1, true));
    startQauds.push(new SolidRectangleEntity(275, 225, 50, 50, 2, true));
    startQauds.push(new SolidRectangleEntity(15000, 500, 100, 100, 1, true));

    const quads: SolidRectangleEntity[] = Cull(startQauds, maxLeft, maxTop);

    console.log(quads);

    (function frame(time: number) {
        requestAnimationFrame(frame);

        // RENDER
        // Reconfigure in case of resize
        const shouldResize = ShouldResizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, maxLeft, maxTop);
        // set the resolution
        gl.uniform2f(resolutionUniformLocation, maxLeft, maxTop);

        for (const quad of quads) {
            // draw rectangle
            setRectangle(gl, quad.left, quad.top, quad.width, quad.height);

            // Set color.
            gl.uniform4f(
                colorUniformLocation,
                triangular(0, 1500),
                triangular(500, 1500),
                triangular(1000, 1500),
                1
            );

            // Draw the rectangle.
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    })(0);
}

export function LoadWebGLContext(
    canvas: HTMLCanvasElement
): WebGLRenderingContext {
    const gl = canvas.getContext('webgl');
    if (gl === null) {
        throw new Error('Unable to load webGL');
    }

    console.log('WebGL successfully loaded');
    return gl;
}

export function RunDemoAnimation(
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext
): void {
    var vertexShader = CreateDemoVertexShader(gl);
    var fragmentShader = CreateDemoFragmentShader(gl);
    // Takes the compiled shaders and adds them to the canvas'
    // WebGL context so that can be used:
    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    // We need to get/set the input variables into the shader in a
    // memory-safe way, so the order and the length of their
    // values needs to be stored.

    const attrs = [
        { name: 'a_position', length: 2, offset: 0 }, // e.g. x and y represent 2 spaces in memory
        { name: 'a_startAngle', length: 1, offset: 2 }, // but angle is just 1 value
        { name: 'a_angularVelocity', length: 1, offset: 3 },
        { name: 'a_rotationAxisAngle', length: 1, offset: 4 },
        { name: 'a_particleDistance', length: 1, offset: 5 },
        { name: 'a_particleAngle', length: 1, offset: 6 },
        { name: 'a_particleY', length: 1, offset: 7 },
    ];

    const STRIDE = Object.keys(attrs).length + 1;
    for (var i = 0; i < attrs.length; i++) {
        const name = attrs[i].name;
        const length = attrs[i].length;
        const offset = attrs[i].offset;
        const attribLocation = gl.getAttribLocation(shaderProgram, name);
        gl.vertexAttribPointer(
            attribLocation,
            length,
            gl.FLOAT,
            false,
            STRIDE * 4,
            offset * 4
        );
        gl.enableVertexAttribArray(attribLocation);
    }

    // Then on this line they are bound to an array in memory:

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    // Set up some constants for rendering:

    const NUM_PARTICLES = 200;
    const NUM_VERTICES = 4;

    // Try reducing this one and hitting "Run" again,
    // it represents how many points should exist on
    // each confetti and having an odd number sends
    // it way out of whack.

    const NUM_INDICES = 6;

    // Create the arrays of inputs for the vertex shaders
    const vertices = new Float32Array(NUM_PARTICLES * STRIDE * NUM_VERTICES);
    const indices = new Uint16Array(NUM_PARTICLES * NUM_INDICES);

    for (let i = 0; i < NUM_PARTICLES; i++) {
        const axisAngle = Math.random() * Math.PI * 2;
        const startAngle = Math.random() * Math.PI * 2;
        const groupPtr = i * STRIDE * NUM_VERTICES;

        const particleDistance = Math.sqrt(Math.random());
        const particleAngle = Math.random() * Math.PI * 2;
        const particleY = Math.random() * 2.2;
        const angularVelocity = Math.random() * 2 + 1;

        for (let j = 0; j < 4; j++) {
            const vertexPtr = groupPtr + j * STRIDE;
            vertices[vertexPtr + 2] = startAngle; // Start angle
            vertices[vertexPtr + 3] = angularVelocity; // Angular velocity
            vertices[vertexPtr + 4] = axisAngle; // Angle diff
            vertices[vertexPtr + 5] = particleDistance; // Distance of the particle from the (0,0,0)
            vertices[vertexPtr + 6] = particleAngle; // Angle around Y axis
            vertices[vertexPtr + 7] = particleY; // Angle around Y axis
        }

        // Coordinates
        vertices[groupPtr] = vertices[groupPtr + STRIDE * 2] = -1;
        vertices[groupPtr + STRIDE] = vertices[groupPtr + STRIDE * 3] = +1;
        vertices[groupPtr + 1] = vertices[groupPtr + STRIDE + 1] = -1;
        vertices[groupPtr + STRIDE * 2 + 1] = vertices[
            groupPtr + STRIDE * 3 + 1
        ] = +1;

        const indicesPtr = i * NUM_INDICES;
        const vertexPtr = i * NUM_VERTICES;
        indices[indicesPtr] = vertexPtr;
        indices[indicesPtr + 4] = indices[indicesPtr + 1] = vertexPtr + 1;
        indices[indicesPtr + 3] = indices[indicesPtr + 2] = vertexPtr + 2;
        indices[indicesPtr + 5] = vertexPtr + 3;
    }

    // Pass in the data to the WebGL context
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const timeUniformLocation = gl.getUniformLocation(shaderProgram, 'u_time');
    const startTime = (window.performance || Date).now();

    // Start the background colour as black
    gl.clearColor(0, 0, 0, 1);

    // Allow alpha channels on in the vertex shader
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // Set the WebGL context to be the full size of the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.viewport(0, 0, canvas.width, canvas.height);

    // Create a run-loop to draw all of the confetti
    (function frame() {
        gl.uniform1f(
            timeUniformLocation,
            ((window.performance || Date).now() - startTime) / 1000
        );

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(
            gl.TRIANGLES,
            NUM_INDICES * NUM_PARTICLES,
            gl.UNSIGNED_SHORT,
            0
        );
        requestAnimationFrame(frame);
    })();
}

export function SwipableSquare(
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext
): void {
    // Create program with basic quad shaders
    const { resolutionUniformLocation, colorUniformLocation } =
        CreateBasicQuadProgram(gl, canvas);

    const square: SolidRectangleEntity = new SolidRectangleEntity(
        0,
        0,
        100,
        100,
        0,
        true
    );

    var maxLeft = gl.canvas.width;
    var maxTop = gl.canvas.height;

    var topVelocity: number = 0;
    var leftVelocity: number = 0;

    const cooldown = 0.99;

    square.top = (maxTop - square.height) / 2;
    square.left = (maxLeft - square.width) / 2;

    let curFrameTime = 0;
    const frameRate = 60;
    const frameDelta = 1000 / frameRate;

    (function frame(time: number) {
        requestAnimationFrame(frame);

        maxLeft = gl.canvas.width;
        maxTop = gl.canvas.height;

        // UPDATE
        while (curFrameTime < time) {
            topVelocity = topVelocity * cooldown;
            leftVelocity = leftVelocity * cooldown;

            if (Math.abs(leftVelocity * topVelocity) < 0.1) {
                topVelocity = 0;
                leftVelocity = 0;
            }

            square.top = (square.top + topVelocity + maxTop) % maxTop;
            square.left = (square.left + leftVelocity + maxLeft) % maxLeft;
            curFrameTime += frameDelta;
        }

        // RENDER
        // Reconfigure in case of resize
        const shouldResize = ShouldResizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, maxLeft, maxTop);
        // set the resolution
        gl.uniform2f(resolutionUniformLocation, maxLeft, maxTop);

        for (const segment of ComputeSegments(square, maxTop, maxLeft)) {
            // draw rectangle
            setRectangle(
                gl,
                segment.left,
                segment.top,
                segment.width,
                segment.height
            );

            // Set color.
            gl.uniform4f(
                colorUniformLocation,
                triangular(0, 1500),
                triangular(500, 1500),
                triangular(1000, 1500),
                1
            );

            // Draw the rectangle.
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    })(0);

    var touchPath: TouchModel[] = [];

    canvas.addEventListener(
        'touchmove',
        (event: TouchEvent) => {
            event.preventDefault();
            const x =
                event.changedTouches[0].clientX * window.devicePixelRatio - 50;
            const y =
                event.changedTouches[0].clientY * window.devicePixelRatio - 50;

            const touch: TouchModel = {
                top: y,
                left: x,
                timestamp: performance.now(),
            };

            touchPath.push(touch);
            topVelocity = 0;
            leftVelocity = 0;
            square.top = y;
            square.left = x;
        },
        { passive: false }
    );

    canvas.addEventListener(
        'touchend',
        (event: TouchEvent) => {
            event.preventDefault();

            if (touchPath.length === 0) {
                return;
            }

            const backtrack = Math.min(touchPath.length, 5);

            var leftDiff =
                touchPath[touchPath.length - backtrack].left -
                touchPath[touchPath.length - 1].left;
            var topDiff =
                touchPath[touchPath.length - backtrack].top -
                touchPath[touchPath.length - 1].top;
            var duration =
                (touchPath[touchPath.length - backtrack].timestamp -
                    touchPath[touchPath.length - 1].timestamp) /
                50;

            if (duration === 0) {
                duration = 1000;
            }

            topVelocity += topDiff / duration;
            leftVelocity += leftDiff / duration;

            touchPath = [];
        },
        { passive: false }
    );
}

function CreateBasicQuadProgram(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement
) {
    const vertexShader = CreatePixelSpaceVertexShader(gl);
    const fragmentShader = CreateSingleColourFragmentShader(gl);
    const program = CreateProgram(gl, vertexShader, fragmentShader);

    // Get attributes from above shaders
    const positionAttributeLocation = gl.getAttribLocation(
        program,
        'a_position'
    );
    const resolutionUniformLocation = gl.getUniformLocation(
        program,
        'u_resolution'
    );
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

    // Allocate memory on gpu for position data
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Prepare blank canvas to draw on
    const shouldResize = ShouldResizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const size = 2; // 2 components per iteration (x,y)
    const type = gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation,
        size,
        type,
        normalize,
        stride,
        offset
    );

    // set the resolution in gpu memory
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    return { resolutionUniformLocation, colorUniformLocation };
}

export function MovableSquare(
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext
): void {
    // Create program with basic quad shaders
    const { resolutionUniformLocation, colorUniformLocation } =
        CreateBasicQuadProgram(gl, canvas);

    const square: SolidRectangleEntity = new SolidRectangleEntity(
        0,
        0,
        100,
        100,
        0,
        true
    );

    var maxLeft = gl.canvas.width;
    var maxTop = gl.canvas.height;
    const speed = 10;

    square.top = (maxTop - square.height) / 2;
    square.left = (maxLeft - square.width) / 2;

    var keyPressed: { [id: string]: boolean } = {};

    // Create a run-loop to draw all of the confetti
    (function frame() {
        requestAnimationFrame(frame);

        maxLeft = gl.canvas.width;
        maxTop = gl.canvas.height;
        // Reconfigure in case of resize
        const shouldResize = ShouldResizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, maxLeft, maxTop);
        // set the resolution
        gl.uniform2f(resolutionUniformLocation, maxLeft, maxTop);

        var boost = 1;

        if (keyPressed['Shift']) {
            boost *= 5;
        }

        if (keyPressed['Control']) {
            boost *= 5;
        }

        for (const key in keyPressed) {
            if (!keyPressed[key]) {
                continue;
            }

            switch (key) {
                case 'ArrowUp':
                case 'w':
                    square.top -=
                        speed *
                        boost *
                        duplicateDetection(keyPressed, 'ArrowUp', 'w');
                    break;
                case 'ArrowDown':
                case 's':
                    square.top +=
                        speed *
                        boost *
                        duplicateDetection(keyPressed, 'ArrowDown', 's');
                    break;
                case 'ArrowLeft':
                case 'a':
                    square.left -=
                        speed *
                        boost *
                        duplicateDetection(keyPressed, 'ArrowLeft', 'a');
                    break;
                case 'ArrowRight':
                case 'd':
                    square.left +=
                        speed *
                        boost *
                        duplicateDetection(keyPressed, 'ArrowRight', 'd');
                    break;
                case 'r':
                    square.top = 0;
                    square.left = 0;
                    break;
                case 'c':
                    square.top = (maxTop - square.height) / 2;
                    square.left = (maxLeft - square.width) / 2;
                    break;
            }
        }

        square.top = (square.top + maxTop) % maxTop;
        square.left = (square.left + maxLeft) % maxLeft;

        for (const segment of ComputeSegments(square, maxTop, maxLeft)) {
            // draw rectangle
            setRectangle(
                gl,
                segment.left,
                segment.top,
                segment.width,
                segment.height
            );

            // Set color.
            gl.uniform4f(
                colorUniformLocation,
                triangular(0, 1500 / boost),
                triangular(500 / boost, 1500 / boost),
                triangular(1000 / boost, 1500 / boost),
                1
            );

            // Draw the rectangle.
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    })();

    canvas.addEventListener('keyup', (event: KeyboardEvent) => {
        delete keyPressed[event.key];
    });

    canvas.addEventListener('keydown', (event: KeyboardEvent) => {
        keyPressed[event.key] = true;
    });
}

function triangular(offset: number, max: number) {
    var value = (performance.now() + offset) % max;

    if (value > max / 2) {
        value = max - value;
    }

    return (2 * value) / max;
}

function duplicateDetection(
    keyPressed: { [id: string]: boolean },
    key1: string,
    key2: string
): number {
    if (key1 in keyPressed && key2 in keyPressed) {
        return 0.5;
    }
    return 1;
}

function ComputeSegments(
    square: SolidRectangleEntity,
    maxTop: number,
    maxLeft: number
): SolidRectangleEntity[] {
    const verticalOverlap = Math.max(square.top + square.height - maxTop, 0);
    const horizontalOverlap = Math.max(square.left + square.width - maxLeft, 0);

    const segments: SolidRectangleEntity[] = [square];

    if (horizontalOverlap > 0) {
        const overlap: SolidRectangleEntity = new SolidRectangleEntity(
            0,
            square.top,
            horizontalOverlap,
            square.height,
            0,
            true
        );
        segments.push(overlap);
    }

    if (verticalOverlap > 0) {
        const overlap: SolidRectangleEntity = new SolidRectangleEntity(
            square.left,
            0,
            square.width,
            verticalOverlap,
            0,
            true
        );
        segments.push(overlap);
    }

    if (horizontalOverlap > 0 && verticalOverlap > 0) {
        const overlap: SolidRectangleEntity = new SolidRectangleEntity(
            0,
            0,
            horizontalOverlap,
            verticalOverlap,
            0,
            true
        );
        segments.push(overlap);
    }

    return segments;
}

export function RunAnimation(
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext
): void {
    const vertexShader = CreatePixelSpaceVertexShader(gl);
    const fragmentShader = CreateSingleColourFragmentShader(gl);
    const program = CreateProgram(gl, vertexShader, fragmentShader);
    const positionAttributeLocation = gl.getAttribLocation(
        program,
        'a_position'
    );
    const resolutionUniformLocation = gl.getUniformLocation(
        program,
        'u_resolution'
    );
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const shouldResize = ShouldResizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);

    // set the resolution
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const size = 2; // 2 components per iteration
    const type = gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation,
        size,
        type,
        normalize,
        stride,
        offset
    );

    const fps = 2;

    const fpsInterval = 1000 / fps;
    var then = Date.now();

    (function frame() {
        requestAnimationFrame(frame);

        const now = Date.now();
        const elapsed = now - then;
        if (elapsed < fpsInterval) {
            return;
        }

        const shouldResize = ShouldResizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // draw 5 random rectangles in random colors
        for (var ii = 0; ii < 5; ++ii) {
            then = now - (elapsed % fpsInterval);
            // Setup a random rectangle
            // This will write to positionBuffer because
            // its the last thing we bound on the ARRAY_BUFFER
            // bind point
            const x = randomInt(gl.canvas.width - 1);
            const y = randomInt(gl.canvas.height - 1);
            const width = randomInt(gl.canvas.width - x);
            const height = randomInt(gl.canvas.height - y);
            setRectangle(gl, x, y, width, height);

            // Set a random color.
            gl.uniform4f(
                colorUniformLocation,
                Math.random(),
                Math.random(),
                Math.random(),
                1
            );

            // Draw the rectangle.
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    })();
}

// Returns a random integer from 0 to range - 1.
function randomInt(range: number) {
    return Math.floor(Math.random() * range);
}

// Fills the buffer with the values that define a rectangle.
function setRectangle(
    gl: WebGLRenderingContext,
    x: number,
    y: number,
    width: number,
    height: number
) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;

    // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
    // whatever buffer is bound to the `ARRAY_BUFFER` bind point
    // but so far we only have one buffer. If we had more than one
    // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
        gl.DYNAMIC_DRAW
    );
}

function ShouldResizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const dpr = window.devicePixelRatio;
    const displayWidth = Math.round(canvas.clientWidth * dpr);
    const displayHeight = Math.round(canvas.clientHeight * dpr);

    // Check if the canvas is not the same size.
    const needResize =
        canvas.width !== displayWidth || canvas.height !== displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}

function CreateProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram {
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    const logInfo = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);

    throw new Error(logInfo ?? 'Program failed to compile');
}

function CreateShader(
    gl: WebGLRenderingContext,
    type: GLenum,
    source: string
): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    const logInfo = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);

    throw new Error(logInfo ?? 'Shader failed to compile');
}

function CreatePixelSpaceVertexShader(gl: WebGLRenderingContext): WebGLShader {
    return CreateShader(
        gl,
        gl.VERTEX_SHADER,
        `
// an attribute will receive data from a buffer
    attribute vec2 a_position;

    uniform vec2 u_resolution;

// all shaders have a main function
void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;
 
    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
 
    // convert from 0->2 to -1->+1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;
 
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`
    );
}

function CreateSingleColourFragmentShader(
    gl: WebGLRenderingContext
): WebGLShader {
    return CreateShader(
        gl,
        gl.FRAGMENT_SHADER,
        `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

uniform vec4 u_color;

void main() {
    gl_FragColor = u_color;
}
`
    );
}

function Cull(
    startQauds: SolidRectangleEntity[],
    maxLeft: number,
    maxTop: number
): SolidRectangleEntity[] {
    // Frustum culling
    const frustum: SolidRectangleEntity[] = startQauds.filter((x) => {
        if (
            x.left > maxLeft ||
            x.top > maxTop ||
            x.left < -x.width ||
            x.top < -x.height
        ) {
            return false;
        }
        return true;
    });

    // Occlusion culling
    const sorted: SolidRectangleEntity[] = frustum.sort((a, b) =>
        a.depth < b.depth ? -1 : a.depth > b.depth ? 1 : 0
    );

    // First culls if entirely occluded by a single other quad
    for (let i = 0; i < sorted.length; i++) {
        const quad = sorted[i];
        for (let j = 0; j < i; j++) {
            const occluder = sorted[j];
            if (
                quad.top >= occluder.top &&
                quad.top + quad.height <= occluder.top + occluder.height &&
                quad.left >= occluder.left &&
                quad.left + quad.width <= occluder.left + occluder.width
            ) {
                sorted.splice(i, 1);
                break;
            }
        }
    }

    // Then check if the remaining quads are occluded by a combination of quads in front of it.
    const grid: Uint8Array = new Uint8Array(maxLeft * maxTop);
    for (let i = 0; i < sorted.length; i++) {
        const quad = sorted[i];
        var occluded = true;
        for (let y = quad.top; y < quad.top + quad.height; y++) {
            for (let x = quad.left; x < quad.left + quad.width; x++) {
                if (grid[x + maxLeft * y] === 0) {
                    occluded = false;
                    grid[x + maxLeft * y] = 1;
                }
            }
        }

        if (occluded) {
            sorted.splice(i, 1);
            i -= 1;
        }
    }

    return sorted;
}
