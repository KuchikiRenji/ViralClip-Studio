import { useState, useEffect, useCallback } from 'react';
import { invokeEdgeFunction } from '@/lib/supabase';
import styles from './AdminDashboard.module.css';
import { Sparkles, Activity, CreditCard, DollarSign, Users, RefreshCw, AlertCircle } from 'lucide-react';

interface OverviewData {
  totalUsers: number;
  totalPayments: number;
  totalRevenueCents: number;
  totalRevenueCAD: string;
  totalCreditsActive: number;
  totalCreditsUsed: number;
  period: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  feature: string;
  description: string;
  balance_after: number;
  created_at: string;
}

interface JobCost {
  count: number;
  credits: number;
  estimatedCostUSD: string;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  transaction_id: string;
  created_at: string;
}

interface DashboardData {
  overview?: OverviewData;
  credits?: {
    recentTransactions: CreditTransaction[];
    totalTransactions: number;
    byType: Record<string, number>;
    byFeature: Record<string, number>;
  };
  costs?: {
    byJobType: Record<string, JobCost>;
    totalJobs: number;
    period: string;
    note: string;
  };
  payments?: {
    recent: Payment[];
    totalCount: number;
    totalAmountCents: number;
  };
  activity?: {
    recentJobs: Array<{
      id: string;
      user_id: string;
      type: string;
      status: string;
      created_at: string;
    }>;
    jobsByStatus: Record<string, number>;
    totalJobsInPeriod: number;
  };
}

export const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'costs' | 'payments' | 'activity'>('overview');
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const jsonData = await invokeEdgeFunction<DashboardData>('admin-dashboard', {
        section: 'all', 
        days 
      });
      
      if (jsonData && jsonData.error) {
        throw new Error(jsonData.error);
      }

      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.backgroundEffects} aria-hidden="true">
          <div className={`${styles.glowOrb} ${styles.glowOrb1}`} />
          <div className={`${styles.glowOrb} ${styles.glowOrb2}`} />
        </div>
        <div className={styles.loading}>
          <RefreshCw className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.backgroundEffects} aria-hidden="true">
          <div className={`${styles.glowOrb} ${styles.glowOrb1}`} />
          <div className={`${styles.glowOrb} ${styles.glowOrb2}`} />
        </div>
        <div className={styles.error}>
          <AlertCircle size={48} />
          <p>Erreur: {error}</p>
          <button onClick={fetchData} className={styles.retryButton}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundEffects} aria-hidden="true">
        <div className={`${styles.glowOrb} ${styles.glowOrb1}`} />
        <div className={`${styles.glowOrb} ${styles.glowOrb2}`} />
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Clash</span> Dashboard
          </h1>
          <div className={styles.controls}>
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className={styles.select}
            >
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
            <button onClick={fetchData} className={styles.refreshButton}>
              Actualiser
            </button>
          </div>
        </header>

        <nav className={styles.tabs}>
          <button onClick={() => setActiveTab('overview')} className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}>
            📊 Vue générale
          </button>
          <button onClick={() => setActiveTab('credits')} className={`${styles.tab} ${activeTab === 'credits' ? styles.tabActive : ''}`}>
            💳 Crédits
          </button>
          <button onClick={() => setActiveTab('costs')} className={`${styles.tab} ${activeTab === 'costs' ? styles.tabActive : ''}`}>
            💰 Coûts
          </button>
          <button onClick={() => setActiveTab('payments')} className={`${styles.tab} ${activeTab === 'payments' ? styles.tabActive : ''}`}>
            🧾 Paiements
          </button>
          <button onClick={() => setActiveTab('activity')} className={`${styles.tab} ${activeTab === 'activity' ? styles.tabActive : ''}`}>
            📈 Activité
          </button>
        </nav>

        <main className={styles.content}>
          {activeTab === 'overview' && data?.overview && (
            <div className={styles.grid}>
              <div className={styles.card}>
                <div className={styles.cardLabel}><Users size={16} style={{display:'inline', marginBottom:-2, marginRight:6}}/> Utilisateurs</div>
                <span className={styles.cardValue}>{data.overview.totalUsers}</span>
              </div>
              <div className={styles.card}>
                <div className={styles.cardLabel}><DollarSign size={16} style={{display:'inline', marginBottom:-2, marginRight:6}}/> Revenus</div>
                <span className={styles.cardValue}>CA${data.overview.totalRevenueCAD}</span>
              </div>
              <div className={styles.card}>
                <div className={styles.cardLabel}><Sparkles size={16} style={{display:'inline', marginBottom:-2, marginRight:6}}/> Crédits actifs</div>
                <span className={styles.cardValue}>{data.overview.totalCreditsActive?.toLocaleString()}</span>
              </div>
              <div className={styles.card}>
                <div className={styles.cardLabel}><Activity size={16} style={{display:'inline', marginBottom:-2, marginRight:6}}/> Crédits utilisés</div>
                <span className={styles.cardValue}>{data.overview.totalCreditsUsed?.toLocaleString()}</span>
              </div>
              <div className={styles.card}>
                <div className={styles.cardLabel}><CreditCard size={16} style={{display:'inline', marginBottom:-2, marginRight:6}}/> Paiements</div>
                <span className={styles.cardValue}>{data.overview.totalPayments}</span>
              </div>
            </div>
          )}

          {activeTab === 'credits' && data?.credits && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Crédits par type</h2>
              <div className={styles.grid}>
                {Object.entries(data.credits.byType || {}).map(([type, count]) => (
                  <div key={type} className={styles.card}>
                    <span className={styles.cardLabel}>{type}</span>
                    <span className={styles.cardValue}>{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <h2 className={styles.sectionTitle}>Par fonctionnalité</h2>
              <div className={styles.grid}>
                {Object.entries(data.credits.byFeature || {}).map(([feature, count]) => (
                  <div key={feature} className={styles.card}>
                    <span className={styles.cardLabel}>{feature}</span>
                    <span className={styles.cardValue}>{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <h2 className={styles.sectionTitle}>Transactions récentes</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Feature</th>
                      <th>Solde après</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.credits.recentTransactions?.slice(0, 20).map((tx) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.created_at).toLocaleString('fr-CA')}</td>
                        <td className={tx.type === 'credit' ? styles.positive : styles.negative}>{tx.type}</td>
                        <td className={tx.amount > 0 ? styles.positive : styles.negative}>{tx.amount}</td>
                        <td>{tx.feature || '-'}</td>
                        <td>{tx.balance_after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'costs' && data?.costs && (
            <div className={styles.section}>
              <div className={styles.note}>
                <AlertCircle size={16} />
                {data.costs.note}
              </div>
              <h2 className={styles.sectionTitle}>Coûts estimés par type de job</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Nombre</th>
                      <th>Crédits</th>
                      <th>Coût estimé (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.costs.byJobType || {}).map(([type, info]) => (
                      <tr key={type}>
                        <td>{type}</td>
                        <td>{info.count}</td>
                        <td>{info.credits}</td>
                        <td>${info.estimatedCostUSD}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.summary}>
                <span><strong>Total jobs:</strong> {data.costs.totalJobs}</span>
                <span><strong>Période:</strong> {data.costs.period}</span>
              </div>
            </div>
          )}

          {activeTab === 'payments' && data?.payments && (
            <div className={styles.section}>
              <div className={styles.grid}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Total paiements</span>
                  <span className={styles.cardValue}>{data.payments.totalCount}</span>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Montant total</span>
                  <span className={styles.cardValue}>CA${((data.payments.totalAmountCents || 0) / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <h2 className={styles.sectionTitle}>Paiements récents</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Status</th>
                      <th>Provider</th>
                      <th>Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.recent?.map((payment) => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.created_at).toLocaleString('fr-CA')}</td>
                        <td>CA${(payment.amount / 100).toFixed(2)}</td>
                        <td className={payment.status === 'succeeded' ? styles.positive : styles.negative}>{payment.status}</td>
                        <td>{payment.provider}</td>
                        <td className={styles.mono}>{payment.transaction_id?.slice(0, 12)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity' && data?.activity && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Jobs par status</h2>
              <div className={styles.grid}>
                {Object.entries(data.activity.jobsByStatus || {}).map(([status, count]) => (
                  <div key={status} className={styles.card}>
                    <span className={styles.cardLabel}>{status}</span>
                    <span className={styles.cardValue}>{count}</span>
                  </div>
                ))}
              </div>

              <h2 className={styles.sectionTitle}>Jobs récents</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.activity.recentJobs?.map((job) => (
                      <tr key={job.id}>
                        <td>{new Date(job.created_at).toLocaleString('fr-CA')}</td>
                        <td>{job.type}</td>
                        <td className={job.status === 'completed' ? styles.positive : job.status === 'failed' ? styles.negative : ''}>{job.status}</td>
                        <td className={styles.mono}>{job.user_id.slice(0, 8)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
