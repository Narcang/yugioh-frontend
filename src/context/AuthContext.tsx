"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            console.log("Fetching profile for:", userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);

                // Self-healing: If profile missing (PGRST116), try to create it from user metadata
                if (error.code === 'PGRST116') {
                    console.log("Profile missing, attempting auto-creation...");
                    const userMeta = (await supabase.auth.getUser()).data.user?.user_metadata;
                    const username = userMeta?.username || userMeta?.email?.split('@')[0] || 'Duelist';

                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: userId,
                            username: username,
                            full_name: userMeta?.full_name || '',
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .single();

                    if (createError) {
                        console.error("Auto-creation failed:", createError);
                    } else {
                        console.log("Auto-created profile:", newProfile);
                        setProfile(newProfile);
                    }
                }

            } else {
                console.log("Profile loaded:", data);

                // Self-healing: If profile exists but username is NULL/Empty
                if (!data.username) {
                    console.log("Profile exists but username is empty. Repairing...");
                    const userMeta = (await supabase.auth.getUser()).data.user?.user_metadata;
                    const emailName = (await supabase.auth.getUser()).data.user?.email?.split('@')[0];
                    const defaultUsername = userMeta?.username || emailName || 'Duelist';

                    const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({ username: defaultUsername })
                        .eq('id', userId)
                        .select()
                        .single();

                    if (!updateError && updatedProfile) {
                        console.log("Repaired profile:", updatedProfile);
                        setProfile(updatedProfile);
                    } else {
                        setProfile(data);
                    }
                } else {
                    setProfile(data);
                }
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
