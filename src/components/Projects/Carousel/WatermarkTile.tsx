import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import { BOTTOM_GRADIENT, DESCRIPTION_BACKDROP } from './CarouselPrimitives';

type WatermarkTileProps = {
    title: string;
    imageSrc: string;
    imageAlt?: string;
    watermarkText?: string;
    description?: string;
    className?: string;
    isActive?: boolean;
    gradient?: boolean;
};

// Approximate Arial Bold glyph widths at 12px, grouped by width.
const ARIAL_BOLD_12_WIDTHS: [number, string][] = [
    [3, "'"],
    [3.3, ' ,./Iijl'],
    [4, '!():;-f'],
    [4.7, '*rt'],
    [5.3, 'z'],
    [5.5, '"'],
    [6, 'Jcs'],
    [6.7, '#$0123456789FLaekvxy'],
    [7, '+<=>'],
    [7.3, '?EPSTXZbdghnopqu'],
    [8, 'BCKRVY'],
    [8.7, '&ADGHNOQU'],
    [9.3, 'w'],
    [10, 'M'],
    [10.7, '%m'],
    [11.3, 'W'],
];

const ARIAL_BOLD_12 = new Map(ARIAL_BOLD_12_WIDTHS.flatMap(([width, chars]) => Array.from(chars).map((char) => [char, width] as const)));

function measureText(text: string): number {
    return Array.from(text).reduce((w, ch) => w + (ARIAL_BOLD_12.get(ch) ?? 7), 0);
}

function buildWatermarkBg(text: string): React.CSSProperties {
    const encoded = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const scale = 12.5 / 12;
    const cellW = Math.ceil(measureText(text) * scale) + 4;
    const halfW = cellW / 2;
    const t = 'fill="none" stroke="white" stroke-width="0.5" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="12.5"';
    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="32">`,
        `<text x="0" y="12" ${t}>${encoded}</text>`,
        `<text x="${halfW}" y="28" ${t}>${encoded}</text>`,
        `<text x="${halfW - cellW}" y="28" ${t}>${encoded}</text>`,
        '</svg>',
    ].join('');
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
            />
        </div>

        {/* Bottom gradient for text readability (static) */}
        <div className={`absolute inset-0 pointer-events-none ${BOTTOM_GRADIENT}`} />

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
                {description && (
                    <p
                        className={twMerge('relative z-10 p-4 md:p-6 text-right text-white', DESCRIPTION_BACKDROP, isActive && 'md:before:opacity-100')}
                    >
                        {description}
                    </p>
                )}
            </div>
        </div>
    </div>
);

export default WatermarkTile;
