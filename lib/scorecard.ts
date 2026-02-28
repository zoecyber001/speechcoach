import type { CoachFeedback, SpeechIntent } from '@/lib/types';

// Architect's Note: This uses the OffscreenCanvas-compatible Canvas 2D API
// to draw a visually branded score card image. The pipeline:
// 1. Create an off-screen canvas at 2x resolution (retina)
// 2. Draw background gradient, text, stats, and branding
// 3. Export to Blob → Object URL for download/share

const CARD_W = 600;
const CARD_H = 800;
const SCALE = 2; // retina

const INTENT_COLORS: Record<SpeechIntent, { from: string; to: string }> = {
    persuade: { from: '#f43f5e', to: '#ec4899' },
    inspire: { from: '#f59e0b', to: '#ea580c' },
    inform: { from: '#0ea5e9', to: '#2563eb' },
    connect: { from: '#10b981', to: '#14b8a6' },
};

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

export function generateScoreCard(
    feedback: CoachFeedback,
    intent: SpeechIntent
): string {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W * SCALE;
    canvas.height = CARD_H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    // --- Background ---
    const colors = INTENT_COLORS[intent];
    const bgGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    bgGrad.addColorStop(0, '#0f172a'); // slate-900
    bgGrad.addColorStop(1, '#1e293b'); // slate-800
    roundRect(ctx, 0, 0, CARD_W, CARD_H, 32);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // --- Accent stripe at top ---
    const stripe = ctx.createLinearGradient(0, 0, CARD_W, 0);
    stripe.addColorStop(0, colors.from);
    stripe.addColorStop(1, colors.to);
    roundRect(ctx, 0, 0, CARD_W, 160, 32);
    ctx.fillStyle = stripe;
    ctx.fill();
    // clip the bottom corners of the stripe
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 130, CARD_W, 30);

    // --- Branding ---
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillText('SpeechCoach', 40, 50);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText(`Goal: ${intent.charAt(0).toUpperCase() + intent.slice(1)}`, 40, 72);

    // --- Score Circle ---
    const cx = CARD_W / 2;
    const cy = 230;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const scoreAngle = (feedback.score / 100) * circumference;

    // track
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // arc
    const scoreColor = feedback.score >= 75 ? '#22c55e' : feedback.score >= 50 ? '#f59e0b' : '#ef4444';
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (feedback.score / 100) * 2 * Math.PI);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // score number
    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${feedback.score}`, cx, cy + 16);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillText('/100', cx, cy + 36);
    ctx.textAlign = 'left';

    // --- Stats Row ---
    const statsY = 360;
    const statW = (CARD_W - 80 - 20) / 2;

    // Filler Words stat card
    roundRect(ctx, 40, statsY, statW, 90, 16);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('FILLER WORDS', 60, statsY + 30);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillText(`${feedback.fillerWordCount}`, 60, statsY + 68);

    // Pace stat card
    roundRect(ctx, 40 + statW + 20, statsY, statW, 90, 16);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('PACE (SYL/MIN)', 40 + statW + 40, statsY + 30);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillText(`${feedback.pacingBpm}`, 40 + statW + 40, statsY + 68);

    // --- Key Insight ---
    const insightY = 490;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('KEY INSIGHT', 40, insightY);

    // wrap the summary text
    const summary = feedback.breakdown?.mechanics || 'Great effort. Keep practicing to refine your delivery.';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px Inter, system-ui, sans-serif';
    wrapText(ctx, summary, 40, insightY + 26, CARD_W - 80, 22);

    // --- Drills recommended ---
    if (feedback.drills?.length > 0) {
        const drillY = 620;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.fillText('RECOMMENDED FOCUS', 40, drillY);

        feedback.drills.slice(0, 2).forEach((drill, i) => {
            const y = drillY + 22 + i * 30;
            ctx.fillStyle = colors.from;
            ctx.font = 'bold 13px Inter, system-ui, sans-serif';
            ctx.fillText(`● ${drill.module.charAt(0).toUpperCase() + drill.module.slice(1)}`, 40, y);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '13px Inter, system-ui, sans-serif';
            const reason = drill.reason.length > 50 ? drill.reason.slice(0, 50) + '...' : drill.reason;
            ctx.fillText(reason, 120, y);
        });
    }

    // --- Footer ---
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, CARD_H - 60, CARD_W - 80, 1);
    ctx.fillStyle = '#475569';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('speechcoach.app • AI-Powered Speaking Practice', CARD_W / 2, CARD_H - 30);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
}

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    maxWidth: number,
    lineHeight: number
) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

// triggers a download of the generated PNG
export function downloadScoreCard(feedback: CoachFeedback, intent: SpeechIntent) {
    const dataUrl = generateScoreCard(feedback, intent);
    const link = document.createElement('a');
    link.download = `speechcoach-report-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
}

// uses the Web Share API if available (mobile), falls back to download
export async function shareScoreCard(feedback: CoachFeedback, intent: SpeechIntent) {
    const dataUrl = generateScoreCard(feedback, intent);

    // convert data URL to blob for sharing
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'speechcoach-report.png', { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
            title: 'My SpeechCoach Report',
            text: `I scored ${feedback.score}/100 on my ${intent} speech!`,
            files: [file],
        });
    } else {
        // fallback to download
        downloadScoreCard(feedback, intent);
    }
}
