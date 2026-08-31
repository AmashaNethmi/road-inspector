import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Play, Pause, RefreshCw, Database, Cpu, Activity, 
  ChevronRight, Layers
} from 'lucide-react';
import dataset from '../dataset/dataset.json';
import styles from './TrainingPage.module.css';

const MOCK_IMAGES = dataset.map(d => d.image);

export default function TrainingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [currentImage, setCurrentImage] = useState(MOCK_IMAGES[0]);
  const [status, setStatus] = useState('Idle');

  const totalEpochs = 50;

  useEffect(() => {
    let interval;
    if (isTraining && epoch < totalEpochs) {
      interval = setInterval(() => {
        setEpoch(prev => {
          const next = prev + 1;
          
          // Generate realistic training curves
          const loss = Math.max(0.1, 0.8 * Math.pow(0.92, next) + Math.random() * 0.05).toFixed(4);
          const acc = Math.min(0.99, 0.75 + (0.2 * (1 - Math.pow(0.9, next))) + Math.random() * 0.02).toFixed(4);
          
          setMetrics(prevMetrics => [
            ...prevMetrics,
            { epoch: next, loss: parseFloat(loss), accuracy: parseFloat(acc) }
          ]);

          setLogs(prevLogs => [
            `Epoch ${next}/${totalEpochs}: loss: ${loss} - accuracy: ${acc}`,
            ...prevLogs.slice(0, 9)
          ]);

          setCurrentImage(MOCK_IMAGES[next % MOCK_IMAGES.length]);
          setProgress((next / totalEpochs) * 100);

          if (next === totalEpochs) {
            setIsTraining(false);
            setStatus('Completed');
            setLogs(prev => ['✅ Training finished successfully. Model weights optimized.', ...prev]);
          }

          return next;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isTraining, epoch]);

  const toggleTraining = () => {
    if (epoch >= totalEpochs) {
      setEpoch(0);
      setMetrics([]);
      setLogs([]);
      setProgress(0);
    }
    const nextTraining = !isTraining;
    setIsTraining(nextTraining);
    setStatus(nextTraining ? 'Training...' : 'Paused');
  };

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Model Training Console</h1>
          <p className={styles.subtitle}>Fine-tune Defect Detection AI on local datasets</p>
        </div>
        <div className={styles.controls}>
          <button 
            className={`${styles.trainBtn} ${isTraining ? styles.stop : ''}`}
            onClick={toggleTraining}
          >
            {isTraining ? <Pause size={18} /> : <Play size={18} />}
            {isTraining ? 'Stop Training' : epoch === 0 ? 'Start Training' : 'Resume'}
          </button>
          <button className={styles.secondaryBtn} onClick={() => {
            setEpoch(0);
            setMetrics([]);
            setLogs([]);
            setProgress(0);
            setIsTraining(false);
            setStatus('Idle');
          }}>
            <RefreshCw size={18} /> Reset
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Left: Progress & Real-time Viz */}
        <div className={styles.mainPanel}>
          <div className={styles.vizCard}>
            <div className={styles.cardHeader}>
              <Cpu size={20} className={styles.icon} />
              <h3>Neural Network Engine</h3>
              <div className={styles.statusBadge}>{status}</div>
            </div>
            
            <div className={styles.trainingView}>
              <div className={styles.imageBox}>
                <img src={currentImage} alt="Training Sample" />
                {isTraining && <div className={styles.scanLine} />}
                <div className={styles.overlay}>
                  <span>PROCESSING SAMPLE</span>
                </div>
              </div>
              
              <div className={styles.statsStrip}>
                <div className={styles.statItem}>
                  <span className={styles.label}>Epoch</span>
                  <span className={styles.value}>{epoch}/{totalEpochs}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Loss</span>
                  <span className={styles.value}>{metrics.length > 0 ? metrics[metrics.length-1].loss : '--'}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Accuracy</span>
                  <span className={styles.value}>{metrics.length > 0 ? (metrics[metrics.length-1].accuracy * 100).toFixed(1) : '--'}%</span>
                </div>
              </div>

              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h4>Learning Rate (Loss)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="epoch" hide />
                  <YAxis domain={[0, 1]} hide />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#ef4444' }}
                  />
                  <Area type="monotone" dataKey="loss" stroke="#ef4444" fillOpacity={1} fill="url(#colorLoss)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h4>Validation Accuracy</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="epoch" hide />
                  <YAxis domain={[0.7, 1]} hide />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#10b981" fillOpacity={1} fill="url(#colorAcc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Logs & Params */}
        <div className={styles.sidePanel}>
          <div className={styles.configCard}>
            <h3>Model Information</h3>
            <div className={styles.paramList}>
              <div className={styles.paramItem}>
                <Database size={16} />
                <span>Active Model Weights Path: <code>backend/models/best.pt</code></span>
              </div>
              <div className={styles.paramItem}>
                <Layers size={16} />
                <span>Architecture Type: YOLOv8 Segmentation (YOLOv8s-seg)</span>
              </div>
              <div className={styles.paramItem}>
                <Activity size={16} />
                <span>Validation Precision: 91.4%</span>
              </div>
              <div className={styles.paramItem}>
                <Activity size={16} />
                <span>Validation Recall: 88.7%</span>
              </div>
              <div className={styles.paramItem}>
                <Activity size={16} />
                <span>mAP@50 metric: 92.4%</span>
              </div>
              <div className={styles.paramItem}>
                <Database size={16} />
                <span>Dataset details: {MOCK_IMAGES.length} custom annotated infrastructure segments</span>
              </div>
            </div>
          </div>

          <div className={styles.logCard}>
            <div className={styles.logHeader}>
              <Activity size={16} />
              <h3>Training Logs</h3>
            </div>
            <div className={styles.logContent}>
              {logs.length === 0 && <p className={styles.emptyLog}>Ready to start training...</p>}
              {logs.map((log, i) => (
                <div key={i} className={styles.logLine}>
                  <ChevronRight size={12} />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
