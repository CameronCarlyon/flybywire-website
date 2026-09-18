import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { NavigationButton } from '../Projects/Carousel/CarouselPrimitives';
import useReducedMotion from '../../hooks/useReducedMotion';

type ViewerModalProps = {
    imageSrc: string;
    imageAlt: string;
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
    isClosing: boolean;
    sourceRect?: DOMRect | null;
    sourceIsActive?: boolean;
};

const ViewerModal = ({
    imageSrc,
    imageAlt,
    onClose,
    onPrevious,
    onNext,
    isClosing,
    sourceRect,
    sourceIsActive,
}: ViewerModalProps) => {
    const reducedMotion = useReducedMotion();
    const reducedMotionRef = useRef(reducedMotion);
    reducedMotionRef.current = reducedMotion;

    const [isFullResLoaded, setIsFullResLoaded] = useState(false);
    const [slidingOut, setSlidingOut] = useState<{ src: string; direction: 'left' | 'right' } | null>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mainImgRef = useRef<HTMLImageElement>(null);
    const outgoingRef = useRef<HTMLImageElement>(null);

    // Zoom & pan (ref-based for 60fps DOM updates)
    const zoomWrapperRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const wasDraggedRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });

    const applyZoomPan = useCallback(() => {
        const wrapper = zoomWrapperRef.current;
        const container = containerRef.current;
        if (!wrapper || !container) return;
        const z = zoomRef.current;
        if (z <= 1) {
            panRef.current = { x: 0, y: 0 };
            const noTransition = isDraggingRef.current || reducedMotionRef.current;
            wrapper.style.transition = noTransition ? 'none' : 'transform 150ms ease-out';
            wrapper.style.transformOrigin = '0 0';
            wrapper.style.transform = 'translate(0px, 0px) scale(1)';
        } else {
            const { width, height } = container.getBoundingClientRect();
            panRef.current = {
                x: Math.min(0, Math.max(width * (1 - z), panRef.current.x)),
                y: Math.min(0, Math.max(height * (1 - z), panRef.current.y)),
            };
            const noTransition = isDraggingRef.current || reducedMotionRef.current;
            wrapper.style.transition = noTransition ? 'none' : 'transform 150ms ease-out';
            wrapper.style.transformOrigin = '0 0';
            wrapper.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${z})`;
        }
        container.style.cursor = z > 1 ? (isDraggingRef.current ? 'grabbing' : 'grab') : '';
    }, []);

    const resetZoom = useCallback(() => {
        zoomRef.current = 1;
        panRef.current = { x: 0, y: 0 };
        applyZoomPan();
    }, [applyZoomPan]);

    useEffect(() => {
        setIsFullResLoaded(false);
        resetZoom();
    }, [imageSrc, resetZoom]);

    const getAnimParams = useCallback((rect: DOMRect) => {
        const el = containerRef.current;
        if (!el) return null;
        const target = el.getBoundingClientRect();
        if (target.width === 0 || target.height === 0) return null;

        const scaleX = rect.width / target.width;
        const scaleY = rect.height / target.height;
        const tx = (rect.left + rect.width / 2) - (target.left + target.width / 2);
        const ty = (rect.top + rect.height / 2) - (target.top + target.height / 2);

        return {
            transform: `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY})`,
            borderRadius: `${1.5 / scaleX}rem / ${1.5 / scaleY}rem`,
        };
    }, []);

    // Opening: position at source rect, then animate to center
    useLayoutEffect(() => {
        const backdrop = backdropRef.current;
        const container = containerRef.current;
        if (!backdrop || !container || !sourceRect || reducedMotionRef.current) return;

        const params = getAnimParams(sourceRect);
        if (!params) return;

        backdrop.style.transition = 'none';
        backdrop.style.opacity = '0';
        container.style.transition = 'none';
        container.style.transform = params.transform;
        container.style.borderRadius = params.borderRadius;

        container.getBoundingClientRect();

        backdrop.style.transition = 'opacity 400ms ease-in-out';
        backdrop.style.opacity = '1';
        container.style.transition = 'transform 400ms ease-in-out, border-radius 400ms ease-in-out';
        container.style.transform = 'none';
        container.style.borderRadius = '1rem';
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Closing: animate back to source rect
    useEffect(() => {
        const backdrop = backdropRef.current;
        const container = containerRef.current;
        if (!isClosing || !backdrop || !container) return;

        resetZoom();

        if (reducedMotionRef.current) return;

        backdrop.style.transition = 'opacity 400ms ease-in-out';
        backdrop.style.opacity = '0';

        if (!sourceRect) {
            container.style.transition = 'opacity 400ms ease-in-out';
            container.style.opacity = '0';
            return;
        }

        if (sourceIsActive === false) {
            const cr = container.getBoundingClientRect();
            if (cr.width === 0 || cr.height === 0) return;

            const side = Math.min(cr.width, cr.height);
            const cropX = (cr.width - side) / 2;
            const cropY = (cr.height - side) / 2;
            const scale = sourceRect.width / side;
            const tx = (sourceRect.left + sourceRect.width / 2) - (cr.left + cr.width / 2);
            const ty = (sourceRect.top + sourceRect.height / 2) - (cr.top + cr.height / 2);

            container.style.transition = 'none';
            container.style.clipPath = 'inset(0px 0px 0px 0px round 1rem)';
            container.getBoundingClientRect();

            container.style.transition = 'transform 400ms ease-in-out, clip-path 400ms ease-in-out';
            container.style.clipPath = `inset(${cropY}px ${cropX}px ${cropY}px ${cropX}px round ${1.5 / scale}rem)`;
            container.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        } else {
            const params = getAnimParams(sourceRect);
            if (!params) return;

            container.style.transition = 'transform 400ms ease-in-out, border-radius 400ms ease-in-out';
            container.style.transform = params.transform;
            container.style.borderRadius = params.borderRadius;
        }
    }, [isClosing, sourceRect, getAnimParams, sourceIsActive, resetZoom]);

    // Wheel zoom (non-passive to preventDefault)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            const rect = container.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;

            const oldZoom = zoomRef.current;
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(1, Math.min(oldZoom * factor, 5));

            if (newZoom <= 1) {
                panRef.current = { x: 0, y: 0 };
            } else {
                const ratio = newZoom / oldZoom;
                panRef.current = {
                    x: cursorX - ratio * (cursorX - panRef.current.x),
                    y: cursorY - ratio * (cursorY - panRef.current.y),
                };
            }

            zoomRef.current = newZoom;
            applyZoomPan();
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [applyZoomPan]);

    // Drag to pan
    const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoomRef.current <= 1) return;
        e.preventDefault();
        isDraggingRef.current = true;
        wasDraggedRef.current = false;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        panStartRef.current = { ...panRef.current };
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';

        const handleMouseMove = (ev: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const dx = ev.clientX - dragStartRef.current.x;
            const dy = ev.clientY - dragStartRef.current.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDraggedRef.current = true;
            panRef.current = {
                x: panStartRef.current.x + dx,
                y: panStartRef.current.y + dy,
            };
            applyZoomPan();
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            if (containerRef.current) {
                containerRef.current.style.cursor = zoomRef.current > 1 ? 'grab' : '';
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [applyZoomPan]);

    const handleContainerClick = useCallback(() => {
        if (wasDraggedRef.current) {
            wasDraggedRef.current = false;
            return;
        }
        if (zoomRef.current > 1) {
            zoomRef.current = 1;
            panRef.current = { x: 0, y: 0 };
            isDraggingRef.current = false;
            applyZoomPan();
            return;
        }
        onClose();
    }, [onClose, applyZoomPan]);

    // Slide: animate old image out and new image in simultaneously
    useLayoutEffect(() => {
        if (!slidingOut) return;
        const main = mainImgRef.current;
        const outgoing = outgoingRef.current;
        if (!main || !outgoing) return;

        const { direction } = slidingOut;
        const exitTo = direction === 'left' ? '-100%' : '100%';
        const enterFrom = direction === 'left' ? '100%' : '-100%';

        outgoing.style.transition = 'none';
        outgoing.style.transform = 'translateX(0)';
        main.style.transition = 'none';
        main.style.transform = `translateX(${enterFrom})`;
        main.getBoundingClientRect();

        outgoing.style.transition = 'transform 500ms ease-in-out';
        outgoing.style.transform = `translateX(${exitTo})`;
        main.style.transition = 'transform 500ms ease-in-out';
        main.style.transform = 'translateX(0)';

        const timer = setTimeout(() => {
            main.style.transition = 'none';
            main.style.transform = '';
            setSlidingOut(null);
        }, 500);
        return () => clearTimeout(timer);
    }, [slidingOut]);

    const handlePrev = useCallback(() => {
        if (slidingOut || isClosing) return;
        resetZoom();
        setIsFullResLoaded(false);
        if (!reducedMotionRef.current) {
            setSlidingOut({ src: imageSrc, direction: 'right' });
        }
        onPrevious();
    }, [onPrevious, imageSrc, slidingOut, isClosing, resetZoom]);

    const handleNext = useCallback(() => {
        if (slidingOut || isClosing) return;
        resetZoom();
        setIsFullResLoaded(false);
        if (!reducedMotionRef.current) {
            setSlidingOut({ src: imageSrc, direction: 'left' });
        }
        onNext();
    }, [onNext, imageSrc, slidingOut, isClosing, resetZoom]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handlePrev, handleNext]);

    return (
        <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
        >
            {/* Backdrop */}
            <div
                ref={backdropRef}
                className="absolute inset-0 bg-black/90"
                onClick={onClose}
            />

            {/* Previous Button */}
            <div
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <NavigationButton
                    onClick={handlePrev}
                    direction="previous"
                    className="bg-light/20 hover:bg-light/40 backdrop-blur-sm"
                />
            </div>

            {/* Image Container */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    ref={containerRef}
                    className="relative overflow-hidden rounded-2xl pointer-events-auto cursor-pointer"
                    onClick={handleContainerClick}
                    onMouseDown={handleContainerMouseDown}
                >
                    <div ref={zoomWrapperRef}>
                        {/* Main image */}
                        <img
                            ref={mainImgRef}
                            src={imageSrc}
                            alt={imageAlt}
                            className="block object-contain"
                            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                            draggable={false}
                        />
                        {/* Outgoing image during slide */}
                        {slidingOut && (
                            <img
                                ref={outgoingRef}
                                src={slidingOut.src}
                                alt={imageAlt}
                                className="absolute inset-0 w-full h-full object-contain"
                                draggable={false}
                            />
                        )}
                        {/* Full-resolution image — overlays once loaded */}
                        <Image
                            src={imageSrc}
                            alt={imageAlt}
                            width={1920}
                            height={1080}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{ opacity: isFullResLoaded && !slidingOut ? 1 : 0 }}
                            onLoad={() => setIsFullResLoaded(true)}
                            sizes="90vw"
                            priority
                            draggable={false}
                        />
                    </div>
                </div>
            </div>

            {/* Next Button */}
            <div
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <NavigationButton
                    onClick={handleNext}
                    direction="next"
                    className="bg-light/20 hover:bg-light/40 backdrop-blur-sm"
                />
            </div>
        </div>
    );
};

export default ViewerModal;
