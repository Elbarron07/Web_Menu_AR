// @ts-nocheck
import '@google/model-viewer';



interface ARViewerProps {
    src: string;
    poster?: string;
    alt: string;
    hotspots?: Array<{ position: string; name: string; detail?: string }>;
}

const ARViewer = ({ src, poster, alt, hotspots }: ARViewerProps) => {
    return (
        <div className="w-full h-full min-h-[500px] relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            <model-viewer
                src={src}
                // ios-src="" // Placeholder for USDZ
                poster={poster}
                alt={alt}
                shadow-intensity="1"
                camera-controls
                auto-rotate
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="fixed"
                style={{ width: '100%', height: '100%', minHeight: '500px' } as any}
            >
                {hotspots?.map((hotspot, idx) => (
                    <button
                        key={idx}
                        className="hotspot bg-white/90 backdrop-blur-md text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg transform transition-all hover:scale-105 hover:bg-white"
                        slot={`hotspot-${idx}`}
                        data-position={hotspot.position}
                        data-normal="0m 1m 0m"
                    >
                        <span className="w-2 h-2 bg-blue-600 rounded-full inline-block mr-2 animate-pulse"></span>
                        {hotspot.name}
                    </button>
                ))}

                <div slot="ar-button" className="absolute bottom-6 right-6 z-10">
                    <button className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors">
                        <span>View in AR</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                    </button>
                </div>
            </model-viewer>
        </div>
    );
};

export default ARViewer;
