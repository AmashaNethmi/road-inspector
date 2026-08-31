import { useState } from 'react'
import './App.css'

// ── Sidebar nav items ──────────────────────────────────────────────────────
const MY_MODULES = [
  { key: 'dashboard',   label: 'Dashboard',          icon: '📊' },
  { key: 'estimation',  label: 'Material Estimation', icon: '✏️', active: true },
  { key: 'analytics',  label: 'Analytics',           icon: '📈' },
  { key: 'history',    label: 'History',             icon: '🗒️' },
  { key: 'settings',   label: 'Settings',            icon: '⚙️' },
]
const TEAM_MODULES = [
  { key: 'segmentation', label: 'Repair Segmentation',  icon: '🔧' },
  { key: 'traffic',      label: 'Traffic Scheduling',   icon: '🚦' },
  { key: 'detection',    label: 'Defect Detection',     icon: '🔍' },
]

// ── Standards data ────────────────────────────────────────────────────────
const STANDARDS = [
  { type: 'HMA AC-20',      temp: '150–165 °C', use: 'High-traffic arterials',  badge: 'badge-amber' },
  { type: 'HMA AC-10',      temp: '145–160 °C', use: 'Residential roads',        badge: 'badge-blue'  },
  { type: 'Cold Mix',       temp: 'Ambient',    use: 'Emergency patching',       badge: 'badge-green' },
  { type: 'Microsurfacing', temp: 'Ambient',    use: 'Surface rejuvenation',     badge: 'badge-green' },
]

const SUPPLIERS = [
  { category: 'Asphalt & Bitumen (Potholes, Rutting)', name: 'Lanka IOC PLC', type: 'Bulk & Drum (156kg/180kg)', products: '60/70, 80/100', status: 'Market Leader' },
  { category: 'Crack Sealants (Alligator, Transverse)', name: 'Bitumix (Pvt) Ltd', type: 'Emulsions, PMB, Sealants', products: 'Hot/Cold Pour Sealants, CSS-1', status: 'Flagship Manufacturer' },
  { category: 'Base/Sub-base (Edge Failure, Subsidence)', name: 'MAGA / ICC / Local Quarries', type: 'Aggregates', products: 'ABC (Aggregate Base Course), Crusher Fines', status: 'Major Contractors/Quarries' },
  { category: 'Geosynthetics (Soil Stabilization, Rutting)', name: 'Maccaferri Sri Lanka', type: 'Geogrids & Geotextiles', products: 'Woven/Non-Woven Geotextiles', status: 'Specialist Supplier' },
  { category: 'Concrete/Rigid Pavement Defects', name: 'INSEE / Tokyo Cement', type: 'Bulk & Bagged Cement', products: 'Portland Cement, Rapid Hardening', status: 'Major Manufacturers' },
  { category: 'Chemicals & Waterproofing', name: 'Lankem Ceylon PLC', type: 'Packed Bitumen & Chemicals', products: 'Road surfacing, Waterproofing', status: 'Manufacturer' },
  { category: 'General Emulsions (Tack/Prime Coat)', name: 'DIMA Lanka (Pvt) Ltd', type: 'Penetration Grade, Emulsions', products: 'RDA Approved Materials', status: 'RDA Approved' },
]

const API_URL = 'http://localhost:8000/api/v1/estimate'

// ── Utility ───────────────────────────────────────────────────────────────
const fmt  = (n, d = 2) => Number(n).toFixed(d)
const fmtK = (n)        => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function App() {
  const [activeNav, setActiveNav] = useState('estimation')
  const [activeTab, setActiveTab] = useState('materials')

  const [form, setForm] = useState({
    area_sqm:             '',
    depth_m:              '',
    ambient_temp_c:       '',
    transport_time_hours: '',
    humidity_pct:         '65',
    execution_mode:       'in-house',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [result,  setResult]  = useState(null)
  const [history, setHistory] = useState([])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const fetchMockData = () => {
    setForm(f => ({
      ...f,
      area_sqm: '24.5',
      depth_m: '0.08',
      ambient_temp_c: '32',
      transport_time_hours: '1.2',
      humidity_pct: '72',
    }))
  }

  const handleSubmit = async () => {
    setError(null)
    // basic validation
    for (const [k, v] of Object.entries(form)) {
      if (v === '' || (k !== 'execution_mode' && isNaN(Number(v)))) {
        setError(`Please enter a valid value for "${k.replace(/_/g, ' ')}".`)
        return
      }
    }
    setLoading(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area_sqm:             Number(form.area_sqm),
          depth_m:              Number(form.depth_m),
          ambient_temp_c:       Number(form.ambient_temp_c),
          transport_time_hours: Number(form.transport_time_hours),
          humidity_pct:         Number(form.humidity_pct),
          execution_mode:       form.execution_mode,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      setHistory(h => [{
        ts:     new Date().toLocaleTimeString(),
        area:   form.area_sqm,
        depth:  form.depth_m,
        temp:   form.ambient_temp_c,
        cost:   data.optimized_cost_lkr,
        method: data.repair_method,
      }, ...h].slice(0, 10))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Labour cost breakdown (derived from result)
  const laborCost    = result ? result.labor_hours * 2500 : 0
  const machineryCost = result ? result.num_trucks * 15000 + result.machinery_list.length * 25000 : 0
  
  // Material cost breakdown
  const hmaCost       = result ? result.hma_tonnes * 15000 : 0
  const bitumenCost   = result ? result.bitumen_liters * 150 : 0
  const aggregateCost = result ? result.aggregate_m3 * 3500 : 0
  const materialCost  = hmaCost + bitumenCost + aggregateCost

  const totalInvestment = laborCost + machineryCost + materialCost

  return (
    <div className="layout">

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🛡️</div>
          <div className="brand-text">
            <div className="brand-name">Road Inspector</div>
            <div className="brand-sub">AI Research Platform</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">My Module</div>
          {MY_MODULES.map(m => (
            <div
              key={m.key}
              className={`nav-item${activeNav === m.key ? ' active' : ''}`}
              onClick={() => setActiveNav(m.key)}
            >
              <span className="nav-icon">{m.icon}</span>
              {m.label}
              {activeNav === m.key && <span className="nav-dot pulse-dot" />}
            </div>
          ))}
        </div>

        <div className="nav-divider" />

        <div className="nav-section">
          <div className="nav-label">Team Modules</div>
          {TEAM_MODULES.map(m => (
            <div
              key={m.key}
              className={`nav-item${activeNav === m.key ? ' active' : ''}`}
              onClick={() => setActiveNav(m.key)}
            >
              <span className="nav-icon">{m.icon}</span>
              {m.label}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────── */}
      <div className="main">

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="topbar-title">
              {activeNav === 'dashboard' && '📊 Dashboard'}
              {activeNav === 'estimation' && '✏️ Material Estimation'}
              {activeNav === 'analytics' && '📈 Analytics'}
              {activeNav === 'history' && '🗒️ History'}
              {activeNav === 'settings' && '⚙️ Settings'}
              {activeNav === 'segmentation' && '🔧 Repair Segmentation'}
              {activeNav === 'traffic' && '🚦 Traffic Scheduling'}
              {activeNav === 'detection' && '🔍 Defect Detection'}
            </div>
            <div className="topbar-sub">
              {activeNav === 'estimation' ? 'Module 3 — Intelligent BoQ Generation System' : 'Road Inspector Platform'}
            </div>
          </div>
          {activeNav === 'estimation' && <div className="topbar-badge">CIDA SCA/5 · RDA HSR · MILP</div>}
        </div>

        <div className="page">
          {activeNav === 'estimation' ? (
            <>
          {/* ── Input Panel ──────────────────────────────── */}
          <div className="input-panel">
            <div className="card fade-up">
              <div className="card-title"><span className="card-title-icon"></span></div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }} className="fade-up-2">
                <button className="btn-generate" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
                  {loading
                    ? <><span className="spin">⟳</span> Computing…</>
                    : <><span>🚀</span> Generate Engineering Estimate 📊</>
                  }
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Repair Area</label>
                <input className="form-input" name="area_sqm" value={form.area_sqm}
                  onChange={handleChange} placeholder="e.g. 12.5" type="number" min="0" step="any" />
                <div className="form-unit">Square metres (m²)</div>
              </div>

              <div className="form-group">
                <label className="form-label">Repair Depth</label>
                <input className="form-input" name="depth_m" value={form.depth_m}
                  onChange={handleChange} placeholder="e.g. 0.05" type="number" min="0" step="any" />
                <div className="form-unit">Metres — e.g. 0.05 = 5 cm</div>
              </div>

              <div className="form-group">
                <label className="form-label">Ambient Temperature</label>
                <input className="form-input" name="ambient_temp_c" value={form.ambient_temp_c}
                  onChange={handleChange} placeholder="e.g. 28" type="number" step="any" />
                <div className="form-unit">Degrees Celsius (°C)</div>
              </div>

              <div className="form-group">
                <label className="form-label">Transport Time</label>
                <input className="form-input" name="transport_time_hours" value={form.transport_time_hours}
                  onChange={handleChange} placeholder="e.g. 0.5" type="number" min="0" step="any" />
                <div className="form-unit">Plant → Site travel time (hours)</div>
              </div>

              <div className="form-group">
                <label className="form-label">Relative Humidity</label>
                <input className="form-input" name="humidity_pct" value={form.humidity_pct}
                  onChange={handleChange} placeholder="65" type="number" min="0" max="100" step="any" />
                <div className="form-unit">Percentage (%) — default 65</div>
              </div>

            </div>

            {error && (
              <div className="error-box fade-up">
                <span>⚠️</span> {error}
              </div>
            )}
          </div>

          {/* ── Results Panel ─────────────────────────────── */}
          <div className="results-panel">

            {!result && !loading && (
              <div className="placeholder">
                <div className="placeholder-icon">📋</div>
                <div>Enter site parameters and generate an estimate</div>
                <div style={{ fontSize: '11px' }}>All 5 computational engines will run automatically</div>
              </div>
            )}

            {result && (
              <>
                {/* ── Cost Breakdown ─────────────────────── */}
                <div className="cost-card fade-up">
                  <div className="cost-row">
                    <div>
                      <div className="cost-label"><span className="cost-label-icon">🧪</span> Raw Material Cost</div>
                      <div className="cost-sub">
                        <div style={{marginTop: '8px', fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6'}}>
                           🪨 <strong>Hot-Mix Asphalt (HMA):</strong> {fmt(result.hma_tonnes)} tonnes (15,000 LKR/t)<br/>
                           🛢️ <strong>Bitumen / Tar:</strong> {fmt(result.bitumen_liters)} L (150 LKR/L)<br/>
                           ⛰️ <strong>Aggregate:</strong> {fmt(result.aggregate_m3)} m³ (3,500 LKR/m³)
                        </div>
                      </div>
                    </div>
                    <div className="cost-value">Rs. {fmtK(materialCost)}</div>
                  </div>

                  <div className="cost-row">
                    <div>
                      <div className="cost-label"><span className="cost-label-icon">👷</span> Labor &amp; Workforce Cost</div>
                      <div className="cost-sub">
                        <div style={{marginTop: '8px', fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6'}}>
                           👨‍💼 <strong>Supervisor / Engineer:</strong> 1 <br/>
                           👷 <strong>General Laborers:</strong> {Math.max(0, result.crew_size - 1)} <br/>
                           ⏱️ <strong>Time Required:</strong> {fmt(result.labor_hours)} hrs (Cost: 2,500 LKR/hr)
                        </div>
                      </div>
                    </div>
                    <div className="cost-value">Rs. {fmtK(laborCost)}</div>
                  </div>

                  <div className="cost-row">
                    <div>
                      <div className="cost-label"><span className="cost-label-icon">🔧</span> Machinery &amp; Equipment Cost (Wet Hire)</div>
                      <div className="cost-sub">
                        <div style={{marginTop: '8px', fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6'}}>
                          🚜 <strong>Machines ({result.machinery_list.length} - 25,000 LKR/ea):</strong> {result.machinery_list.join(', ')} <br/>
                          🚚 <strong>Vehicles ({result.num_trucks} - 15,000 LKR/ea):</strong> Asphalt Transport Trucks <br/>
                          🧰 <strong>Standard Tools:</strong> Rakes, Shovels, Hand Tampers, Wheelbarrows
                        </div>
                      </div>
                    </div>
                    <div className="cost-value">Rs. {fmtK(machineryCost)}</div>
                  </div>

                  <div className="cost-row">
                    <div className="cost-label" style={{ fontWeight: 700, color: '#0ea5e9' }}>
                      <span className="cost-label-icon">📈</span> Total Estimated Investment
                    </div>
                    <div className="cost-value total">Rs. {fmtK(totalInvestment)}</div>
                  </div>
                </div>

                {/* ── Technical Standards ─────────────── */}
                <div className="standards-card fade-up-5">
                  <div className="section-header">
                    <span className="section-header-icon">📖</span>
                    Technical Standards &amp; Research Data Sheet (RDA / SSCM)
                  </div>
                  <div className="tab-row">
                    <div className={`tab${activeTab === 'materials' ? ' active' : ''}`} onClick={() => setActiveTab('materials')}>
                      Material Application Standards 🧪
                    </div>
                    <div className={`tab${activeTab === 'guidelines' ? ' active' : ''}`} onClick={() => setActiveTab('guidelines')}>
                      Engineering Guidelines 📐
                    </div>
                    <div className={`tab${activeTab === 'suppliers' ? ' active' : ''}`} onClick={() => setActiveTab('suppliers')}>
                      Suppliers &amp; Pricing 🏢
                    </div>
                  </div>
                  {activeTab === 'materials' && (
                    <table className="standards-table">
                      <thead>
                        <tr>
                          <th>Material Type</th>
                          <th>Optimal Temp</th>
                          <th>Primary Use Case</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STANDARDS.map((s, i) => (
                          <tr key={i}>
                            <td>{s.type}</td>
                            <td>{s.temp}</td>
                            <td>{s.use}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {activeTab === 'guidelines' && (
                    <table className="standards-table">
                      <thead>
                        <tr><th>Standard</th><th>Requirement</th><th>Value</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>CIDA SCA/5</td><td>Compaction Factor</td><td>+20 %</td></tr>
                        <tr><td>CIDA SCA/5</td><td>Wastage Allowance</td><td>+10 %</td></tr>
                        <tr><td>CIDA SCA/5</td><td>Bitumen Ratio</td><td>5 % by mass</td></tr>
                        <tr><td>RDA HSR</td><td>Labor Norm</td><td>2.5 hrs / m³</td></tr>
                        <tr><td>RDA HSR</td><td>Crew Efficiency</td><td>85 %</td></tr>
                        <tr><td>Fourier</td><td>Min Compaction Temp</td><td>145 °C</td></tr>
                      </tbody>
                    </table>
                  )}
                  {activeTab === 'suppliers' && (
                    <>
                    <table className="standards-table">
                      <thead>
                        <tr>
                          <th>Defect Category & Use Case</th>
                          <th>Company Name</th>
                          <th>Supply Type</th>
                          <th>Products</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SUPPLIERS.map((s, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.category}</td>
                            <td>{s.name}</td>
                            <td>{s.type}</td>
                            <td>{s.products}</td>
                            <td><span className={`badge ${s.status === 'RDA Approved' || s.status === 'Market Leader' ? 'badge-green' : 'badge-blue'}`}>{s.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{marginTop: '15px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: '1.5'}}>
                      <strong>Pricing Note:</strong> Road construction materials are heavily dependent on raw material costs (e.g., global oil prices for Bitumen, transport costs for Aggregates). Rates are guided by the <strong>Ceylon Petroleum Corporation (CPC)</strong> and <strong>Road Development Authority (RDA) Highway Schedule of Rates (HSR)</strong>. Please contact suppliers for exact project-based quotations.
                    </div>
                    </>
                  )}
                  <div className="data-sources">
                    <span>ℹ️</span> Data Sources &amp; Reference Links:
                  </div>
                </div>

                {/* ── Estimation History ─────────────────────── */}
                <div className="history-card fade-up" style={{marginTop: '20px'}}>
                  <div className="history-title">Estimation History 📜 <span style={{fontSize: '11px', color: 'var(--text-3)', fontWeight: 'normal'}}>↺ Refresh</span></div>
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Area (m²)</th>
                        <th>Depth (m)</th>
                        <th>Temp (°C)</th>
                        <th>Method</th>
                        <th>Total Cost (LKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td>{h.ts}</td>
                          <td>{h.area}</td>
                          <td>{h.depth}</td>
                          <td>{h.temp}</td>
                          <td>{h.method}</td>
                          <td className="history-cost">{fmtK(h.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </>
            )}

          </div>
          </>
          ) : (
            <div className="placeholder fade-up" style={{ width: '100%', height: '100%' }}>
              <div className="placeholder-icon" style={{ opacity: 1, fontSize: '64px', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))', marginBottom: '16px' }}>
                {activeNav === 'dashboard' && '📊'}
                {activeNav === 'analytics' && '📈'}
                {activeNav === 'history' && '🗒️'}
                {activeNav === 'settings' && '⚙️'}
                {activeNav === 'segmentation' && '🔧'}
                {activeNav === 'traffic' && '🚦'}
                {activeNav === 'detection' && '🔍'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '6px' }}>
                Module in development
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                This section is currently being integrated into the AI platform.
              </div>
            </div>
          )}
        </div>{/* /page */}
      </div>{/* /main */}
    </div>/* /layout */
  )
}
