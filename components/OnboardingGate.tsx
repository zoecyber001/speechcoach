'use client';

import { useState, useEffect } from 'react';
import Onboarding from '@/components/Onboarding';

// Wraps children with the onboarding check.
// On first visit (no localStorage flag), shows the 3-screen flow.
// After completion or skip, sets the flag and renders children normally.
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const alreadyDone = localStorage.getItem('speechcoach_onboarded');
        if (!alreadyDone) {
            setShowOnboarding(true);
        }
        setChecked(true);
    }, []);

    if (!checked) return null; // avoid flash

    if (showOnboarding) {
        return <Onboarding onComplete={() => setShowOnboarding(false)} />;
    }

    return <>{children}</>;
}
