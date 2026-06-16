export function adjustColor(color: string, amount: number): string {
    const isHex = color.startsWith('#');
    let r: number, g: number, b: number;

    if (isHex) {
        let hex = color.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        // Fallback or handle rgb
        const rgb = color.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
            r = parseInt(rgb[0], 10);
            g = parseInt(rgb[1], 10);
            b = parseInt(rgb[2], 10);
        } else {
            return color;
        }
    }

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
    if (factor <= 0) return color1;
    if (factor >= 1) return color2;

    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);

    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
