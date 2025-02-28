export function triangular(offset: number, max: number) {
    var value = (performance.now() + offset) % max;

    if (value > max / 2) {
        value = max - value;
    }

    return (2 * value) / max;
}
