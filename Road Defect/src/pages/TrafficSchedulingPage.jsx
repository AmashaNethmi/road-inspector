import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Plus, Users } from 'lucide-react';
import styles from './TrafficSchedulingPage.module.css';

export default function TrafficSchedulingPage() {
  const [schedules, setSchedules] = useState([
    { id: 1, location: 'SEC-A2 (Colombo Road)', status: 'Approved', type: 'Lane Closure', team: 'Maintenance Alpha', date: '2026-05-20', time: '22:00 - 04:00' },
    { id: 2, location: 'SEC-B5 (Kandy Road)', status: 'Pending Review', type: 'Full Block', team: 'Maintenance Beta', date: '2026-05-22', time: '00:00 - 05:00' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    location: 'SEC-C1',
    type: 'Lane Closure',
    team: 'Maintenance Alpha',
    date: '2026-05-25',
    time: '23:00 - 05:00'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setSchedules([...schedules, {
      id: Date.now(),
      ...form,
      status: 'Approved'
    }]);
    setShowModal(false);
  };

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Traffic Maintenance Scheduling</h1>
          <p className={styles.subtitle}>Coordinate and approve lane closures, maintenance team dispatches, and active project timelines</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.btnCreate}>
          <Plus size={18} /> Schedule Operation
        </button>
      </header>

      {showModal && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleCreate} className={styles.formContainer}>
            <h3>Schedule Road Operations</h3>
            <div className={styles.formGroup}>
              <label>Location Segment</label>
              <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Operation Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="Lane Closure">Lane Closure</option>
                  <option value="Full Block">Full Block</option>
                  <option value="Shoulder Work">Shoulder Work</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Dispatch Team</label>
                <select value={form.team} onChange={e => setForm({...form, team: e.target.value})}>
                  <option value="Maintenance Alpha">Maintenance Alpha</option>
                  <option value="Maintenance Beta">Maintenance Beta</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Scheduled Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
              <div className={styles.formGroup}>
                <label>Scheduled Hours</label>
                <input type="text" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>Create Schedule</button>
              <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.grid}>
        {schedules.map(s => (
          <div key={s.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardInfo}>
                <h3>{s.location}</h3>
                <span className={styles.typeBadge}>{s.type}</span>
              </div>
              <span className={`${styles.status} ${s.status === 'Approved' ? styles.statusApp : styles.statusPen}`}>
                {s.status}
              </span>
            </div>
            <div className={styles.details}>
              <div className={styles.detail}>
                <Calendar size={14} /> <span>{s.date}</span>
              </div>
              <div className={styles.detail}>
                <Clock size={14} /> <span>{s.time}</span>
              </div>
              <div className={styles.detail}>
                <Users size={14} /> <span>{s.team}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
