import React from 'react';
import { LogIn, Loader } from 'lucide-react';
import { GoogleVerifyButton } from './GoogleAuth';

interface DeviceMismatchModalProps {
    registrationId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const DeviceMismatchModal: React.FC<DeviceMismatchModalProps> = ({ 
    registrationId,
    onSuccess, 
    onCancel 
}) => {
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSuccess = () => {
        setLoading(false);
        onSuccess();
    };

    const handleError = (errorMsg: string) => {
        setLoading(false);
        setError(errorMsg);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn size={40} className="text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">جهاز جديد</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        حسابك محمي ومربوط بـ Gmail.
                        <br />
                        يرجى تسجيل الدخول للمتابعة من هذا الجهاز.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <GoogleVerifyButton
                        registrationId={registrationId}
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />

                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};
