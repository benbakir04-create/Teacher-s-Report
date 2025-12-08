import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { dbService } from '../services/db.service';
import { User } from '../types';

export function useUser() {
    const { authSession } = useAuth();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchUser() {
            if (!authSession) {
                if (mounted) {
                    setCurrentUser(null);
                    setIsLoading(false);
                }
                return;
            }

            try {
                // Fetch user linked to this teacher registration ID
                const user = await dbService.getUserByTeacherId(authSession.teacher.registrationId);
                
                if (mounted) {
                    setCurrentUser(user);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
                if (mounted) {
                    setError('فشل تحميل بيانات المستخدم');
                    setIsLoading(false);
                }
            }
        }

        fetchUser();

        return () => {
            mounted = false;
        };
    }, [authSession]);

    return { currentUser, isLoading, error };
}
