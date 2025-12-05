import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader, Mail } from 'lucide-react';
import { GoogleVerifyButton } from './GoogleAuth';

interface LoginScreenProps {
    onLogin: (registrationId: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [registrationId, setRegistrationId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDeviceMismatch, setShowDeviceMismatch] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!registrationId.trim()) {
            setError('يرجى إدخال رقم التسجيل');
            return;
        }

        setLoading(true);
        setError('');
        setShowDeviceMismatch(false);

        try {
            await onLogin(registrationId.trim());
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
            setError(errorMessage);
            
            // Check if this is a device mismatch error
            if (errorMessage.includes('جهاز آخر') || errorMessage.includes('Gmail')) {
                setShowDeviceMismatch(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = () => {
        // Retry login after successful Google verification
        setShowDeviceMismatch(false);
        setError('');
        onLogin(registrationId.trim());
    };

    const handleGoogleError = (errorMsg: string) => {
        setError(errorMsg);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <LogIn size={40} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">تقارير الحصص</h1>
                    <p className="text-white/80 text-sm">نظام متابعة الأداء اليومي</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                        تسجيل الدخول
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                رقم التسجيل
                            </label>
                            <input
                                type="text"
                                value={registrationId}
                                onChange={(e) => setRegistrationId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-center text-lg font-bold"
                                placeholder="أدخل رقم التسجيل"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Show Google Sign-In button for device recovery */}
                        {showDeviceMismatch && registrationId && (
                            <div className="animate-fade-in">
                                <GoogleVerifyButton
                                    registrationId={registrationId.trim()}
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    <span>جاري التحقق...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    <span>الدخول</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                            💡 رقم التسجيل هو الرقم المُعطى لك من قبل الإدارة
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/60 text-xs mt-6">
                    في حال نسيان رقم التسجيل، يرجى التواصل مع الإدارة
                </p>
            </div>
        </div>
    );
};

