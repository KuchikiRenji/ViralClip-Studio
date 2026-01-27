import { StatProps } from '../../types';
import styles from './UsageBar.module.css';

const TOTAL_DOTS = 16;

export const UsageBar = ({ label, current, max, unit = '' }: StatProps) => {
  const filledDots = max > 0 ? Math.round((current / max) * TOTAL_DOTS) : 0;
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  const displayUnit = unit ? ` ${unit}` : '';
  const severity = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warn' : 'ok';

  return (
    <div
      className={`${styles.root} ${severity === 'warn' ? styles.warn : severity === 'danger' ? styles.danger : ''}`}
      role="progressbar"
      aria-valuenow={Math.min(current, max)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${label}: ${current} of ${max}${displayUnit}`}
    >
      <div className={styles.meta}>
        <div className={styles.count}>
          {current}/{max}{displayUnit}
        </div>
        <div className={styles.label}>{label}</div>
      </div>
      <div className={styles.dots} aria-hidden="true">
        {Array.from({ length: TOTAL_DOTS }).map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${index < filledDots ? styles.dotFilled : ''}`}
          />
        ))}
      </div>
    </div>
  );
};
