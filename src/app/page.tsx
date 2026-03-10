'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import VisionSandbox from '@/components/VisionSandbox';
import {
  Users,
  Calendar,
  Activity,
  FileText,
  Settings,
  Shield,
  Clock,
  ChevronRight,
  Brain,
  Zap
} from 'lucide-react';
import styles from './page.module.css';

const navItems = [
  { icon: Users, label: 'Patients', active: false },
  { icon: Calendar, label: 'Sessions', active: false },
  { icon: Activity, label: 'Analysis', active: false },
  { icon: FileText, label: 'Reports', active: false },
];

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

function NavItem({ icon: Icon, label, active }: NavItemProps) {
  return (
    <motion.button
      className={styles.navItem}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        backgroundColor: active ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        color: active ? '#10b981' : '#9ca3af',
        fontSize: '14px',
        fontWeight: 500,
        textAlign: 'left',
        transition: 'all 0.2s ease',
      }}
    >
      <Icon size={20} />
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={16} style={{ opacity: active ? 1 : 0 }} />
    </motion.button>
  );
}

export default function Home() {
  const [patientId] = useState<string>('demo-patient-001');

  const handleSessionComplete = (stats: unknown) => {
    console.log('Session completed:', stats);
  };

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <Brain size={28} color="#10b981" />
            <div>
              <h1 className={styles.logoText}>ClinicalVision</h1>
              <span className={styles.logoSubtext}>Platform</span>
            </div>
          </div>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>Main Menu</span>
            {navItems.map((item) => (
              <NavItem key={item.label} {...item} />
            ))}
          </div>

          <div className={styles.navSection}>
            <span className={styles.navLabel}>System</span>
            <NavItem icon={Settings} label="Settings" />
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.hipaaNotice}>
            <Shield size={16} />
            <div>
              <span className={styles.hipaaTitle}>HIPAA Compliant</span>
              <span className={styles.hipaaDesc}>End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.pageTitle}>Vision Analysis</h2>
            <div className={styles.breadcrumb}>
              <span>Patients</span>
              <ChevronRight size={14} />
              <span>Demo Patient</span>
              <ChevronRight size={14} />
              <span className={styles.breadcrumbActive}>Session</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.sessionInfo}>
              <div className={styles.sessionStat}>
                <Clock size={16} />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className={styles.statusIndicator}>
                <span className={styles.statusDot} />
                <span>System Ready</span>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className={styles.statIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <Activity size={24} color="#10b981" />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>1,247</span>
                <span className={styles.statLabel}>Total Sessions</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={styles.statIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <Users size={24} color="#3b82f6" />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>156</span>
                <span className={styles.statLabel}>Active Patients</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={styles.statIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Zap size={24} color="#f59e0b" />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>99.2%</span>
                <span className={styles.statLabel}>Model Accuracy</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            className={styles.visionContainer}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <VisionSandbox
              patientId={patientId}
              onSessionComplete={handleSessionComplete}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
