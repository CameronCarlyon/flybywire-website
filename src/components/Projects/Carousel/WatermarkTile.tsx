import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

type WatermarkTileProps = {
    title: string;
    imageSrc: string;
    imageAlt?: string;
    watermarkText?: string;
    description?: string;
    className?: string;
    isActive?: boolean;
    priority?: boolean;
    gradient?: boolean;
};

const ARIAL_BOLD_12: Record<string, number> = {
    ' ': 3.3, '!': 4, '"': 5.5, '#': 6.7, '$': 6.7, '%': 10.7, '&': 8.7, "'": 3,
    '(': 4, ')': 4, '*': 4.7, '+': 7, ',': 3.3, '-': 4, '.': 3.3, '/': 3.3,
    '0': 6.7, '1': 6.7, '2': 6.7, '3': 6.7, '4': 6.7, '5': 6.7, '6': 6.7,
    '7': 6.7, '8': 6.7, '9': 6.7, ':': 4, ';': 4, '<': 7, '=': 7, '>': 7, '?': 7.3,
    A: 8.7, B: 8, C: 8, D: 8.7, E: 7.3, F: 6.7, G: 8.7, H: 8.7, I: 3.3, J: 6,
    K: 8, L: 6.7, M: 10, N: 8.7, O: 8.7, P: 7.3, Q: 8.7, R: 8, S: 7.3, T: 7.3,
    U: 8.7, V: 8, W: 11.3, X: 7.3, Y: 8, Z: 7.3,
    a: 6.7, b: 7.3, c: 6, d: 7.3, e: 6.7, f: 4, g: 7.3, h: 7.3, i: 3.3, j: 3.3,
    k: 6.7, l: 3.3, m: 10.7, n: 7.3, o: 7.3, p: 7.3, q: 7.3, r: 4.7, s: 6, t: 4.7,
    u: 7.3, v: 6.7, w: 9.3, x: 6.7, y: 6.7, z: 5.3,
};

function measureText(text: string): number {
    return [...text].reduce((w, ch) => w + (ARIAL_BOLD_12[ch] ?? 7), 0);
}

function buildWatermarkBg(text: string): React.CSSProperties {
    const encoded = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const scale = 12.5 / 12;
    const cellW = Math.ceil(measureText(text) * scale) + 4;
    const halfW = cellW / 2;
    const t = `fill="none" stroke="white" stroke-width="0.5" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="12.5"`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="32"><text x="0" y="12" ${t}>${encoded}</text><text x="${halfW}" y="28" ${t}>${encoded}</text><text x="${halfW - cellW}" y="28" ${t}>${encoded}</text></svg>`;
    return {
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundSize: `${cellW}px 32px`,
        backgroundRepeat: 'repeat',
    };
}

/**
 * Watermark Tile
 * Dark gradient with image, cyan text, and diagonal watermark.
 * 1:1 square on the left, description revealed on the right when active.
 */
const WatermarkTile = ({
    title,
    imageSrc,
    imageAlt = '',
    watermarkText = '',
    description = '',
    className,
    isActive = false,
    priority = false,
    gradient = false,
}: WatermarkTileProps) => (
    <div
        className={twMerge(
            'group relative flex h-full w-full overflow-hidden rounded-3xl',
            className,
        )}
        style={{
            background: gradient
                ? 'radial-gradient(20rem 12rem at 12rem 12rem, rgba(2, 219, 254, 0.18) 0%, transparent 100%), linear-gradient(to top, #0f1620, #172844)'
                : 'linear-gradient(to top, #0f1620, #172844)',
        }}
    >
        {/* Watermark pattern — single tiling SVG with brick offset */}
        {watermarkText && (
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none select-none"
                style={{
                    ...buildWatermarkBg(watermarkText),
                    transform: 'rotate(-45deg) scale(4.5)',
                    transformOrigin: '12rem 12rem',
                }}
            />
        )}

        {/* Content Image */}
        <div
            className={twMerge(
                'absolute left-0 top-0 h-96 w-96 md:w-[42.6667rem] motion-safe:transition-transform motion-safe:duration-300',
                !isActive && 'motion-safe:group-hover:scale-105',
            )}
            style={{ transformOrigin: '12rem center' }}
        >
            <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover object-left"
                sizes="(max-width: 768px) 24rem, 43rem"
                priority={priority}
            />
        </div>

        {/* Gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1620]/75 via-transparent to-transparent" />

        {/* Content overlay */}
        <div className="relative flex h-full w-full items-end">
            {/* Left 1:1 square */}
            <div className="relative flex h-full w-96 shrink-0 items-end rounded-l-3xl">
                <span className="relative z-10 p-4 md:p-6 font-display font-bold text-left text-base md:text-lg lg:text-xl text-[#02dbfe]">
                    {title}
                </span>
            </div>

            {/* Right side — fixed width, overflows outside when inactive */}
            <div className="relative flex h-full min-w-[18.6667rem]">
                {/* Gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f1620]/50 pointer-events-none" />
                {description && (
                    <span className="relative z-10 p-4 md:p-6 font-display text-right text-white" style={{ textShadow: '0 1px 4px #0f1620, 0 0 10px #0f1620, 0 0 30px #0f1620, 0 0 60px #0f1620' }}>
                        {description}
                    </span>
                )}
            </div>
        </div>
    </div>
);

export default WatermarkTile;
