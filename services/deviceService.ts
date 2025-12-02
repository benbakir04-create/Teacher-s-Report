/**
 * Device Fingerprinting Service
 * 
 * Generates a unique fingerprint for the user's device based on:
 * - Browser characteristics
 * - Screen resolution
 * - Timezone
 * - Language
 */

export interface DeviceFingerprint {
    fingerprint: string;
    generatedAt: string;
}

/**
 * Generate a device fingerprint
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform,
    ];

    const fingerprint = hashString(components.join('|'));

    return {
        fingerprint,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Simple hash function (MurmurHash3-like)
 */
function hashString(str: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Get stored device fingerprint from localStorage
 */
export function getStoredFingerprint(): DeviceFingerprint | null {
    const stored = localStorage.getItem('device_fingerprint');
    if (!stored) return null;
    
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Save device fingerprint to localStorage
 */
export function saveDeviceFingerprint(fingerprint: DeviceFingerprint): void {
    localStorage.setItem('device_fingerprint', JSON.stringify(fingerprint));
}

/**
 * Validate if current device matches stored fingerprint
 */
export function validateDevice(): boolean {
    const stored = getStoredFingerprint();
    if (!stored) return false;
    
    const current = generateDeviceFingerprint();
    return stored.fingerprint === current.fingerprint;
}

/**
 * Get or create device fingerprint
 */
export function getOrCreateFingerprint(): DeviceFingerprint {
    let fingerprint = getStoredFingerprint();
    
    if (!fingerprint) {
        fingerprint = generateDeviceFingerprint();
        saveDeviceFingerprint(fingerprint);
    }
    
    return fingerprint;
}
