/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace JSX {
    interface IntrinsicElements {
        'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
            src?: string;
            'ios-src'?: string;
            poster?: string;
            alt?: string;
            'shadow-intensity'?: string;
            'shadow-softness'?: string;
            'camera-controls'?: boolean;
            'auto-rotate'?: boolean;
            ar?: boolean;
            'ar-modes'?: string;
            'ar-scale'?: string;
            'ar-placement'?: string;
            'xr-environment'?: boolean;
            'interaction-policy'?: string;
            'interaction-prompt'?: string;
            'interaction-prompt-style'?: string;
            'touch-action'?: string;
            reveal?: string;
            scale?: string;
            slot?: string;
            'disable-zoom'?: boolean;
            'disable-pan'?: boolean;
            'disable-tap'?: boolean;
            'auto-rotate-delay'?: string;
            'rotation-per-second'?: string;
            'camera-orbit'?: string;
            'min-camera-orbit'?: string;
            'max-camera-orbit'?: string;
            'min-field-of-view'?: string;
            'max-field-of-view'?: string;
            'field-of-view'?: string;
            'interpolation-decay'?: string;
            'orbit-sensitivity'?: string;
            bounds?: string;
            'environment-image'?: string;
            exposure?: string;
        }, HTMLElement>;
    }
}

// Types WebXR
interface Navigator {
    xr?: XRSystem;
}

interface XRSystem {
    isSessionSupported(mode: string): Promise<boolean>;
    requestSession(mode: string, options?: XRSessionInit): Promise<XRSession>;
}

interface XRSessionInit {
    requiredFeatures?: string[];
    optionalFeatures?: string[];
}

interface XRSession extends EventTarget {
    requestReferenceSpace(type: string): Promise<XRReferenceSpace>;
    requestHitTestSource?(space: XRReferenceSpace): Promise<XRHitTestSource>;
    updateRenderState(state: XRRenderStateInit): void;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    end(): Promise<void>;
    addEventListener(type: string, listener: EventListener): void;
}

interface XRReferenceSpace {
    // Base interface
}

interface XRHitTestSource {
    cancel(): void;
}

interface XRFrame {
    getHitTestResults(source: XRHitTestSource): XRHitTestResultSet;
}

interface XRHitTestResultSet {
    [Symbol.iterator](): Iterator<XRHitTestResult>;
    length: number;
}

interface XRHitTestResult {
    getPose(space: XRReferenceSpace): XRPose | null;
}

interface XRPose {
    transform: XRRigidTransform;
}

interface XRRigidTransform {
    position: DOMPointReadOnly;
    orientation: DOMPointReadOnly;
}

interface XRRenderStateInit {
    baseLayer?: XRWebGLLayer;
}

declare var XRWebGLLayer: {
    new (session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext): XRWebGLLayer;
};

interface XRWebGLLayer {
    // Interface pour XRWebGLLayer
}

type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;