import { Play, Eye, Users, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { ViewType } from '../../../../types';
import styles from '../LandingPage.module.css';

interface StatisticsSectionProps {
  onNavigate: (view: ViewType) => void;
}

export const StatisticsSection = ({ onNavigate }: StatisticsSectionProps) => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Play,
      value: t('landing.statistics.videosCreated'),
      label: t('landing.statistics.videosCreatedLabel'),
    },
    {
      icon: Eye,
      value: t('landing.statistics.viewsGenerated'),
      label: t('landing.statistics.viewsGeneratedLabel'),
    },
    {
      icon: Users,
      value: t('landing.statistics.users'),
      label: t('landing.statistics.usersLabel'),
    },
  ];

  return (
    <section id="statistics" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.statisticsTag}>
          {t('landing.statistics.tag')}
        </div>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleWhite}>{t('landing.statistics.title1')}</span>
          <br />
          <span className={styles.sectionTitleGradient}>{t('landing.statistics.title2')}</span>
        </h2>
        <p className={styles.sectionSubtitle}>{t('landing.statistics.subtitle')}</p>
        <div className={styles.statisticsGrid}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <article key={index} className={styles.statisticsCard}>
                <div className={styles.statisticsIcon}>
                  <IconComponent size={20} aria-hidden="true" />
                </div>
                <div className={styles.statisticsValue}>{stat.value}</div>
                <div className={styles.statisticsLabel}>{stat.label}</div>
              </article>
            );
          })}
        </div>
        <div className={styles.statisticsCta}>
          <button
            onClick={() => onNavigate('home')}
            className={styles.statisticsButton}
            type="button"
            aria-label={t('landing.statistics.cta')}
          >
            {t('landing.statistics.cta')}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};

