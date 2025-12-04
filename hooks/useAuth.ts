import { useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import { 
    loginWithRegistrationId, 
    getCurrentSession, 
    logout as authLogout, 
    dismissDailyReminder,
    AuthSession 
} from '../services/authService';
import toast from 'react-hot-toast';

export function useAuth() {
    const [authSession, setAuthSession] = useState<AuthSession | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [showEmailLinkModal, setShowEmailLinkModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);

    useEffect(() => {
        // Check authentication session on mount
        const session = getCurrentSession();
        if (session) {
            setAuthSession(session);
            
            // Show email link modal if needed (first use or enforced)
            if (session.needsEmailLink) {
                const canDismiss = !session.teacher.emailRequired || session.daysSinceFirstUse < 14;
                if (!canDismiss) {
                    setShowEmailLinkModal(true);
                } else {
                    setShowEmailLinkModal(true); // Show popup for optional linking
                }
            }
        }
        setIsAuthenticating(false);
    }, []);

    const handleLogin = async (registrationId: string) => {
        try {
            const session = await loginWithRegistrationId(registrationId);
            setAuthSession(session);
            
            // Show email link modal if needed
            if (session.needsEmailLink) {
                setShowEmailLinkModal(true);
            }
            
            return session;
        } catch (error: any) {
            if (error.message === 'DEVICE_MISMATCH') {
                throw new Error('هذا الحساب مربوط بجهاز آخر. يرجى تسجيل الدخول بـ Gmail');
            }
            throw error;
        }
    };

    const handleLogout = () => {
        authLogout();
        googleLogout();
        setAuthSession(null);
        setShowAccountModal(false);
        toast.success('تم تسجيل الخروج بنجاح');
    };

    const handleEmailLinkSuccess = () => {
        setShowEmailLinkModal(false);
        setTimeout(() => {
            const session = getCurrentSession();
            if (session) {
                setAuthSession(session);
            }
        }, 100);
    };

    const handleEmailLinkLater = () => {
        setShowEmailLinkModal(false);
        dismissDailyReminder();
    };

    return {
        authSession,
        setAuthSession,
        isAuthenticating,
        showEmailLinkModal,
        setShowEmailLinkModal,
        showAccountModal,
        setShowAccountModal,
        handleLogin,
        handleLogout,
        handleEmailLinkSuccess,
        handleEmailLinkLater
    };
}
