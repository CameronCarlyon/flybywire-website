import useScrollReveal from '../../hooks/useScrollReveal';
import useReducedMotion from '../../hooks/useReducedMotion';

interface VideoSectionProps {
    videoId: string;
    title: string;
    theme: 'light' | 'dark';
}

const VideoSection = (props: VideoSectionProps) => {
    const { ref, revealed, shouldAnimate } = useScrollReveal<HTMLDivElement>();
    const reducedMotion = useReducedMotion();

    return (
        <div ref={ref} className="flex flex-col gap-4 items-center">
            <h2
                className={!revealed ? 'motion-safe:opacity-0' : ''}
                style={shouldAnimate && !reducedMotion ? { animation: 'reveal-fade-in 0.5s ease-out both' } : undefined}
            >
                {props.title}
            </h2>
            <div
                className={`w-full md:w-3/4${!revealed ? ' motion-safe:opacity-0' : ''}`}
                style={{
                    boxShadow: '0 0 60px 20px rgba(34, 211, 238, 0.15)',
                    ...(shouldAnimate && !reducedMotion ? { animation: 'fade-scale-in 0.5s ease-out 0.2s both' } : {}),
                }}
            >
                <iframe
                    src={`https://www.youtube.com/embed/${props.videoId}`}
                    title={props.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="aspect-video w-full relative z-10"
                />
            </div>
        </div>
    );
};

export default VideoSection;
