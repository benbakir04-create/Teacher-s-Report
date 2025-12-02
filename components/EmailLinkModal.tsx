import React, { useState } from 'react';
import { Mail, X, Shield, AlertCircle } from 'lucide-react';
import { GoogleLinkButton } from './GoogleAuth';

interface EmailLinkModalProps {
    onLink: () => void;
    onLater: () => void;
    canDismiss: boolean; // false if email is required
}

export const EmailLinkModal: React.FC<EmailLinkModalProps> = ({ onLink, onLater, canDismiss }) => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSuccess = () => {
        setLoading(false);
        onLink();
    };

    const handleError = (errorMsg: string) => {
        setLoading(false);
        setError(errorMsg);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl transform scale-100 transition-transform">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-t-3xl relative">
                    <div className="flex items-center justify-center gap-3 text-white">
                        <Shield size={32} />
                        <h3 className="text-2xl font-bold">حماية حسابك</h3>
                    </div>
                    
                    {canDismiss && (
                        <button
                            onClick={onLater}
                            className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
                        >
                            <X size={18} className="text-white" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail size={40} className="text-primary" />
                        </div>
                        
                        <p className="text-gray-700 text-center mb-4 leading-relaxed">
                            {canDismiss ? (
                                <>
                                    لحماية حسابك وبياناتك، يُنصح بربطه بحساب Gmail الخاص بك.
                                    <br />
                                    <span className="text-sm text-gray-500">
                                        سيتيح لك ذلك الدخول من أي جهاز بأمان
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-red-600 font-bold">⚠️ مطلوب</span>
                                    <br />
                                    يجب ربط حسابك بـ Gmail لمتابعة الاستخدام
                                </>
                            )}
                        </p>

                        <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <span className="text-lg">🔒</span>
                                <span>حماية من الاستخدام غير المصرح</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600">
                                <span className="text-lg">📱</span>
                                <span>الدخول من أي جهاز</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600">
                                <span className="text-lg">💾</span>
                                <span>حفظ بياناتك بأمان</span>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm mb-4">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <GoogleLinkButton 
                            mode="link"
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />

                        {canDismiss && (
                            <button
                                onClick={onLater}
                                disabled={loading}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                لاحقاً
                            </button>
                        )}
                    </div>

                    {!canDismiss && (
                        <p className="text-xs text-center text-red-600 mt-3">
                            ⏰ تم تجاوز المدة المسموحة للاستخدام بدون ربط
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
