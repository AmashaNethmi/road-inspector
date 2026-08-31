import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Sliders, FileText, Database } from 'lucide-react';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    const defaults = {
      pixelScale: 0.01,
      confidenceThreshold: 0.15,
      reportFormat: 'pdf',
      modelPath: 'backend/models/best.pt',
      autoSaveResults: true
    };
    try {
      const savedSettings = localStorage.getItem('roadInspectorSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaults;
    } catch {
      return defaults;
    }
  });
  
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('roadInspectorSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Configuration</h1>
          <p className={styles.subtitle}>Fine-tune computer vision scale parameters, inference metrics, and outputs</p>
        </div>
      </header>

      <form onSubmit={handleSave} className={styles.formGrid}>
        {/* CV Metrics Group */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Sliders className={styles.icon} />
            <h3>Inference Parameters</h3>
          </div>
          <div className={styles.formGroup}>
            <label>Pixel-to-Meter Scale ($m/px$)</label>
            <input 
              type="number" 
              step="0.0001" 
              value={settings.pixelScale} 
              onChange={e => setSettings({ ...settings, pixelScale: parseFloat(e.target.value) })}
              required 
            />
            <p className={styles.helpText}>Conversion factor used to scale pixel count calculations into real-world square meters.</p>
          </div>
          <div className={styles.formGroup}>
            <label>Confidence Threshold (YOLOv8)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01" 
              max="1" 
              value={settings.confidenceThreshold} 
              onChange={e => setSettings({ ...settings, confidenceThreshold: parseFloat(e.target.value) })}
              required 
            />
            <p className={styles.helpText}>Minimum boundary required to register a segmented contour bounding region (lower value increases recall).</p>
          </div>
        </div>

        {/* System Settings Group */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Database className={styles.icon} />
            <h3>Model & Storage</h3>
          </div>
          <div className={styles.formGroup}>
            <label>Weights Asset Path</label>
            <input 
              type="text" 
              value={settings.modelPath} 
              onChange={e => setSettings({ ...settings, modelPath: e.target.value })}
              required 
            />
            <p className={styles.helpText}>Absolute or relative directory target pointing to the trained YOLOv8 PyTorch model.</p>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={settings.autoSaveResults} 
                onChange={e => setSettings({ ...settings, autoSaveResults: e.target.checked })} 
              />
              <span>Auto-save inference runs to MongoDB</span>
            </label>
          </div>
        </div>

        {/* Reporting Customization */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FileText className={styles.icon} />
            <h3>Reporting Standards</h3>
          </div>
          <div className={styles.formGroup}>
            <label>Preferred Export Format</label>
            <select 
              value={settings.reportFormat} 
              onChange={e => setSettings({ ...settings, reportFormat: e.target.value })}
            >
              <option value="pdf">Professional PDF Report</option>
              <option value="json">Raw Research JSON</option>
              <option value="both">Both (PDF + JSON)</option>
            </select>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button type="submit" className={styles.saveBtn}>
            <Save size={18} />
            Save Configuration
          </button>
          {saved && <span className={styles.savedAlert}>✓ Settings updated successfully</span>}
        </div>
      </form>
    </motion.div>
  );
}
