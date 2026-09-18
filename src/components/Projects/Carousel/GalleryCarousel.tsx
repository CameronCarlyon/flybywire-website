import { Children, cloneElement, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { CarouselControls, useCarouselTheme } from './CarouselPrimitives';
import ViewerModal from '../../Utils/ViewerModal';
import useReducedMotion from '../../../hooks/useReducedMotion';

type GalleryCarouselProps = {
    children: ReactNode;
    theme?: 'light' | 'dark';
    className?: string;
};

const INACTIVE_W_REM = 24; // w-96
const GAP_REM = 1; // gap-4

const GalleryCarousel = ({ children, theme = 'dark', className }: GalleryCarouselProps) => {
    const slides = Children.toArray(children);
    const total = slides.length;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [modalSlideIndex, setModalSlideIndex] = useState<number | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const reducedMotion = useReducedMotion();
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
    const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (modalSlideIndex !== null) {
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
        }
        return () => { document.documentElement.style.overflow = ''; };
    }, [modalSlideIndex]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
    }, [total]);

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + total) % total);
    }, [total]);

    const handleGoTo = useCallback((index: number) => {
        setCurrentIndex(index % total);
    }, [total]);

    const handleTileClick = useCallback((index: number) => {
        if (index === currentIndex) {
            const el = slideRefs.current.get(index);
            if (el) setSourceRect(el.getBoundingClientRect());
            setModalSlideIndex(index);
        } else {
            setCurrentIndex(index);
        }
    }, [currentIndex]);

    const handleCloseModal = useCallback(() => {
        let tileVisible = false;
        if (modalSlideIndex !== null) {
            const el = slideRefs.current.get(modalSlideIndex);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.right > 0 && rect.left < window.innerWidth) {
                    setSourceRect(rect);
                    tileVisible = true;
                }
            }
        }
        if (!tileVisible) setSourceRect(null);
        setIsClosing(true);
        setTimeout(() => {
            setModalSlideIndex(null);
            setIsClosing(false);
            setSourceRect(null);
        }, reducedMotion ? 10 : 400);
    }, [modalSlideIndex, reducedMotion]);

    const handleModalNext = useCallback(() => {
        setModalSlideIndex((prev) => (prev !== null ? (prev + 1) % total : null));
    }, [total]);

    const handleModalPrevious = useCallback(() => {
        setModalSlideIndex((prev) => (prev !== null ? (prev - 1 + total) % total : null));
    }, [total]);

    const translateX = -(currentIndex * (INACTIVE_W_REM + GAP_REM));
    const { containerTheme } = useCarouselTheme(theme);

    const modalSlide = modalSlideIndex !== null ? slides[modalSlideIndex] : null;
    const modalImageSrc = (modalSlide as React.ReactElement)?.props?.imageSrc || '';
    const modalImageAlt = (modalSlide as React.ReactElement)?.props?.imageAlt || 'Screenshot';

    return (
        <div className={twMerge('flex flex-col gap-6', containerTheme, className)}>
            {/* Viewport */}
            <div className="relative w-full">
                <div
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Gallery carousel"
                    className="flex h-96 items-center gap-4 motion-safe:will-change-transform motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-in-out"
                    style={{ transform: `translateX(${translateX}rem)`, width: 'max-content' }}
                >
                    {slides.map((slide, index) => {
                        const isActive = index === currentIndex;
                        // Prioritise the first slide for LCP on initial render.
                        const priority = index === 0;
                        return (
                            <div
                                key={index}
                                ref={(el) => {
                                    if (el) slideRefs.current.set(index, el);
                                    else slideRefs.current.delete(index);
                                }}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`Slide ${index + 1} of ${total}`}
                                aria-hidden={!isActive}
                                className={twMerge(
                                    'shrink-0 h-96 cursor-pointer w-96',
                                    isActive && 'md:w-[42.6667rem]',
                                    hasMounted && 'motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-in-out',
                                )}
                                onClick={() => handleTileClick(index)}
                            >
                                {cloneElement(
                                    slide as React.ReactElement<{ onClick?: () => void; isActive?: boolean; priority?: boolean }>,
                                    { onClick: () => handleTileClick(index), isActive, priority },
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <CarouselControls
                total={total}
                currentIndex={currentIndex}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onGoTo={handleGoTo}
                theme={theme}
            />

            {/* Full Screen Modal */}
            {modalSlideIndex !== null && modalImageSrc && (
                <ViewerModal
                    imageSrc={modalImageSrc}
                    imageAlt={modalImageAlt}
                    onClose={handleCloseModal}
                    onPrevious={handleModalPrevious}
                    onNext={handleModalNext}
                    isClosing={isClosing}
                    sourceRect={sourceRect}
                    sourceIsActive={modalSlideIndex === currentIndex}
                />
            )}
        </div>
    );
};

export default GalleryCarousel;
