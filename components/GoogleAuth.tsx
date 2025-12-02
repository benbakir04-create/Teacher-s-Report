import React from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Mail } from 'lucide-react';
import { linkWithGoogleEmail, verifyGoogleSignIn } from '../services/authService';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface GoogleAuthWrapperProps {
    children: React.ReactNode;
}

// Main Provider Wrapper
export const GoogleAuthWrapper: React.FC<GoogleAuthWrapperProps> = ({ children }) => {
    if (!CLIENT_ID) {
        console.error('Google Client ID not configured');
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
};

// Google Sign-In Button for Linking
interface GoogleLinkButtonProps {
    onSuccess: () => void;
    onError: (error: string) => void;
    mode: 'link' | 'verify';
    registrationId?: string;
}

export const GoogleLinkButton: React.FC<GoogleLinkButtonProps> = ({ 
    onSuccess, 
    onError, 
    mode,
    registrationId 
}) => {
    const login = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                // Fetch user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${response.access_token}` }
                });
                
                const userInfo = await userInfoResponse.json();
                
                if (mode === 'link') {
                    // Link email to teacher account
                    await linkWithGoogleEmail(userInfo);
                    onSuccess();
                } else if (mode === 'verify' && registrationId) {
                    // Verify and update device fingerprint
                    await verifyGoogleSignIn(userInfo, registrationId);
                    onSuccess();
                }
            } catch (err) {
                onError(err instanceof Error ? err.message : 'فشل تسجيل الدخول بـ Gmail');
            }
        },
        onError: () => {
            onError('تم إلغاء تسجيل الدخول');
        },
        scope: 'openid email profile'
    });

    return (
        <button
            onClick={() => login()}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
            <Mail size={20} />
            <span>ربط الحساب بـ Gmail</span>
        </button>
    );
};

// Google Sign-In for Device Switching
interface GoogleVerifyButtonProps {
    registrationId: string;
    onSuccess: () => void;
    onError: (error: string) => void;
}

export const GoogleVerifyButton: React.FC<GoogleVerifyButtonProps> = ({ 
    registrationId,
    onSuccess, 
    onError 
}) => {
    return (
        <GoogleLinkButton 
            mode="verify"
            registrationId={registrationId}
            onSuccess={onSuccess}
            onError={onError}
        />
    );
};
