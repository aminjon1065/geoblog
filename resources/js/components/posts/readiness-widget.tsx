import { AlertCircle, Check, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Check as ReadinessCheck } from './types';

/**
 * The post's readiness score (khf-site-cms' traffic light): a percentage,
 * a coloured bar, a verdict and the checklist behind it.
 */
export function ReadinessWidget({ checks }: { checks: ReadinessCheck[] }) {
    const done = checks.filter((check) => check.ok).length;
    const score =
        checks.length === 0 ? 0 : Math.round((done / checks.length) * 100);
    const tier = score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low';
    const verdict =
        tier === 'high'
            ? 'Запись готова к публикации'
            : tier === 'mid'
              ? 'Черновик сформирован — дополните детали'
              : 'Заполнены не все ключевые поля';

    return (
        <div className="wp-readiness-widget">
            <div className="wp-readiness-header">
                <div className="wp-readiness-title">
                    <Sparkles size={15} aria-hidden />
                    <span>Готовность записи</span>
                </div>
                <div className={cn('wp-readiness-score-tag', `is-${tier}`)}>
                    {score}%
                </div>
            </div>
            <div
                className="wp-readiness-bar"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Готовность записи"
            >
                <div
                    className={cn('wp-readiness-fill', `is-${tier}`)}
                    style={{ width: `${Math.max(score, 4)}%` }}
                />
            </div>
            <div className={cn('wp-readiness-status', `is-${tier}`)}>
                {tier === 'high' ? (
                    <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden />
                ) : (
                    <AlertCircle size={14} strokeWidth={2.2} aria-hidden />
                )}
                <span>{verdict}</span>
            </div>
            <ul className="wp-readiness-checklist">
                {checks.map((check) => (
                    <li
                        key={check.id}
                        className={cn(
                            'wp-readiness-check-item',
                            check.ok ? 'is-done' : 'is-pending',
                        )}
                    >
                        <span className="wp-readiness-check-icon" aria-hidden>
                            {check.ok ? (
                                <Check size={11} strokeWidth={3} />
                            ) : (
                                <span className="wp-readiness-check-dot" />
                            )}
                        </span>
                        <span>
                            {check.label}
                            <span className="wp-screen-reader-text">
                                {check.ok ? ' — готово' : ' — не готово'}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
