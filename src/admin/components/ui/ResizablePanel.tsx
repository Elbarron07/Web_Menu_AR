import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizablePanelProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    defaultHeight?: number;
    minHeight?: number;
    className?: string;
}

export const ResizablePanel = ({
    title,
    subtitle,
    children,
    defaultHeight = 340,
    minHeight = 200,
    className = '',
}: ResizablePanelProps) => {
    const panelKey = `panel-h-${title.replace(/\s+/g, '-').toLowerCase()}`;
    const [height, setHeight] = useState(() => {
        try {
            const saved = localStorage.getItem(panelKey);
            return saved ? Number(saved) : defaultHeight;
        } catch { return defaultHeight; }
    });
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Persist height
    useEffect(() => {
        localStorage.setItem(panelKey, String(height));
    }, [height, panelKey]);

    // Vertical resize from bottom handle
    const startResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startY = e.clientY;
        const startH = height;

        const onMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientY - startY;
            setHeight(Math.max(minHeight, startH + delta));
        };

        const onMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [height, minHeight]);

    return (
        <div
            ref={panelRef}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden group relative ${className}`}
            style={{ height }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-hidden min-h-0">
                {children}
            </div>

            {/* Bottom resize handle */}
            <div
                onMouseDown={startResize}
                className={`
          absolute bottom-0 left-0 right-0 h-3 cursor-s-resize flex items-end justify-center
          transition-opacity
          ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
            >
                <div className={`
          w-10 h-1 rounded-full mb-1 transition-all
          ${isResizing
                        ? 'bg-primary-500 w-16'
                        : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-primary-400 dark:group-hover:bg-primary-500'}
        `} />
            </div>

            {/* Prevent text selection during resize */}
            {isResizing && (
                <div className="fixed inset-0 z-50 cursor-s-resize" style={{ pointerEvents: 'all' }} />
            )}
        </div>
    );
};
