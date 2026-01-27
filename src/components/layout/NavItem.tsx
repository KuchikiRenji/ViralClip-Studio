import { LucideIcon } from 'lucide-react';
import { ViewType } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './NavItem.module.css';

interface NavItemProps {
  icon: LucideIcon;
  labelKey: string;
  view: ViewType;
  isActive: boolean;
  onClick: () => void;
}

export const NavItem = ({ icon: Icon, labelKey, isActive, onClick }: NavItemProps) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={`${styles.item} ${isActive ? styles.active : ''}`}
      aria-current={isActive ? 'page' : undefined}
      type="button"
    >
      <Icon size={26} className={styles.icon} strokeWidth={isActive ? 2.5 : 2.25} aria-hidden="true" />
      <span className={styles.label}>{t(labelKey)}</span>
    </button>
  );
};
