import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ShoppingBag, Truck, Users, Landmark, RotateCw } from 'lucide-react';
import styles from './MaterialEstimationPage.module.css';

export default function MaterialEstimationPage() {
  const [data, setData] = useState(() => {
    try {
      const rawData = localStorage.getItem('materialEstimationData');
      return rawData ? JSON.parse(rawData) : null;
    } catch {
      return null;
    }
  });
  const [depth, setDepth] = useState(() => {
    try {
      const rawData = localStorage.getItem('materialEstimationData');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.estimatedDepth) return parsed.estimatedDepth;
      }
    } catch {
      // Fallback
    }
    return 0.05; // 5cm default depth
  });
  const [asphaltRate, setAsphaltRate] = useState(38000); // LKR per Ton
  const [emulsionRate, setEmulsionRate] = useState(450); // LKR per Liter
  const [aggregateRate, setAggregateRate] = useState(12000); // LKR per Ton

  // Material Calculations
  const area = data ? parseFloat(data.repairArea) : 25.4; // default dummy fallback if no scan run
  const volume = area * depth; // m³
  
  // Asphalt: ~2.4 Tons per m³
  const asphaltTons = volume * 2.4;
  const asphaltCost = asphaltTons * asphaltRate;

  // Tack coat emulsion: ~0.6 Liters per m²
  const emulsionLiters = area * 0.6;
  const emulsionCost = emulsionLiters * emulsionRate;

  // Base Aggregate: ~2.0 Tons per m³
  const aggregateTons = volume * 2.0;
  const aggregateCost = aggregateTons * aggregateRate;

  // Labor: ~1.5 labor hours per m²
  const laborHours = area * 1.5;
  const laborCost = laborHours * 850; // LKR 850/hour

  // Machinery: roller & burner hours
  const rollerHours = Math.max(1, Math.ceil(area / 15));
  const machineryCost = rollerHours * 4500; // LKR 4500/hour

  const totalCost = asphaltCost + emulsionCost + aggregateCost + laborCost + machineryCost;

  const handleClear = () => {
    localStorage.removeItem('materialEstimationData');
    setData(null);
  };

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Material Estimation & Bill of Quantities</h1>
          <p className={styles.subtitle}>Calculate exact asphalt volumes, emulsion quantities, labor costs, and project pricing</p>
        </div>
        {data && (
          <button onClick={handleClear} className={styles.clearBtn}>
            <RotateCw size={14} /> Clear Telemetry
          </button>
        )}
      </header>

      {data ? (
        <div className={styles.telemetryAlert}>
          <strong>✓ Active Telemetry Loaded from Segment: {data.locationID || 'SEC-A2'}</strong>
          <p>The calculations below are dynamically synchronized based on the repair area scan of <strong>{data.repairArea} m²</strong>.</p>
        </div>
      ) : (
        <div className={styles.noTelemetry}>
          <p>⚠️ No active scan telemetry found in localStorage. Displaying representative standard segment values (25.4 m²). Run a repair area scan to sync live data.</p>
        </div>
      )}

      <div className={styles.grid}>
        {/* Left Column: Parameter controls */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Calculator className={styles.icon} />
            <h3>Project Dimension Parameters</h3>
          </div>
          <div className={styles.formGroup}>
            <label>Calculated Surface Area (m²)</label>
            <input type="number" value={area.toFixed(2)} readOnly className={styles.readOnly} />
          </div>
          <div className={styles.formGroup}>
            <label>Average Excavation Depth (meters)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.02" 
              max="0.2" 
              value={depth} 
              onChange={e => setDepth(parseFloat(e.target.value))} 
            />
            <p className={styles.helpText}>Excavation depth determines volumetric totals for base aggregates and asphalt concrete.</p>
          </div>
          
          <div className={styles.cardHeader} style={{ marginTop: '1rem' }}>
            <Landmark className={styles.icon} />
            <h3>Standard Market Pricing (LKR)</h3>
          </div>
          <div className={styles.formGroup}>
            <label>Asphalt Concrete (per Ton)</label>
            <input type="number" value={asphaltRate} onChange={e => setAsphaltRate(parseInt(e.target.value) || 0)} />
          </div>
          <div className={styles.formGroup}>
            <label>Tack Coat Emulsion (per Liter)</label>
            <input type="number" value={emulsionRate} onChange={e => setEmulsionRate(parseInt(e.target.value) || 0)} />
          </div>
          <div className={styles.formGroup}>
            <label>Base Aggregate (per Ton)</label>
            <input type="number" value={aggregateRate} onChange={e => setAggregateRate(parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Right Column: Calculated Bill of Quantities */}
        <div className={styles.resultsCard}>
          <div className={styles.resultsHeader}>
            <h3>Bill of Quantities (BOQ) Summary</h3>
            <span className={styles.totalPrice}>LKR {totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
          </div>

          <div className={styles.boqList}>
            <div className={styles.boqItem}>
              <div className={styles.boqIcon}><ShoppingBag size={18} /></div>
              <div className={styles.boqInfo}>
                <strong>Asphalt Concrete (Wearing Course)</strong>
                <span>Density 2.4t/m³ • {asphaltTons.toFixed(2)} Tons required</span>
              </div>
              <span className={styles.itemCost}>LKR {asphaltCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>

            <div className={styles.boqItem}>
              <div className={styles.boqIcon}><ShoppingBag size={18} /></div>
              <div className={styles.boqInfo}>
                <strong>Tack Coat Binder (CSS-1h Emulsion)</strong>
                <span>Coverage rate 0.6L/m² • {emulsionLiters.toFixed(1)} Liters required</span>
              </div>
              <span className={styles.itemCost}>LKR {emulsionCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>

            <div className={styles.boqItem}>
              <div className={styles.boqIcon}><Truck size={18} /></div>
              <div className={styles.boqInfo}>
                <strong>Granular Base Aggregate</strong>
                <span>Density 2.0t/m³ • {aggregateTons.toFixed(2)} Tons required</span>
              </div>
              <span className={styles.itemCost}>LKR {aggregateCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>

            <div className={styles.boqItem}>
              <div className={styles.boqIcon}><Users size={18} /></div>
              <div className={styles.boqInfo}>
                <strong>Site Operations & Civil Labor</strong>
                <span>Standard factor 1.5h/m² • {laborHours.toFixed(1)} Labor Hours</span>
              </div>
              <span className={styles.itemCost}>LKR {laborCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>

            <div className={styles.boqItem}>
              <div className={styles.boqIcon}><Truck size={18} /></div>
              <div className={styles.boqInfo}>
                <strong>Excavation & Machinery Lease</strong>
                <span>Pneumatic rollers & cutters • {rollerHours} roller hours</span>
              </div>
              <span className={styles.itemCost}>LKR {machineryCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
