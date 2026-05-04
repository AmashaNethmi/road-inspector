import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Loader, ShieldAlert } from 'lucide-react';

const IoTDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setDetectionResults(null); // Reset previous results
    }
  };

  const runDetection = () => {
    if (!selectedImage) return;
    
    setIsDetecting(true);
    
    // Simulate AI inference delay (e.g. YOLOv8 running on Edge Node)
    setTimeout(() => {
      setIsDetecting(false);
      
      // Mock detection result
      setDetectionResults({
        defects: [
          { type: 'Pothole', confidence: 0.94, severity: 'Critical', bbox: { top: '30%', left: '20%', width: '40%', height: '35%' } },
          { type: 'Longitudinal Crack', confidence: 0.81, severity: 'High', bbox: { top: '70%', left: '60%', width: '30%', height: '10%' } }
        ],
        processingTime: '142ms',
        gps: '6.9271° N, 79.8612° E'
      });
    }, 1500);
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <h1>IoT Edge Detection (Manual Upload)</h1>
        <p>Lead Researcher: Nethmi I.W.D.A (IT22082756)</p>
        <span className="badge badge-success" style={{marginTop: '0.5rem', display: 'inline-block'}}>Module Active</span>
      </div>
      
      <div className="dashboard-grid">
        <div className="glass-panel" style={{gridColumn: '1 / -1'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2>Defect Detection Simulator</h2>
            <div style={{display: 'flex', gap: '1rem'}}>
              <label style={{
                cursor: 'pointer', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', 
                border: '1px solid var(--border-light)', borderRadius: '6px', 
                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
              }}>
                <Upload size={18} />
                Upload Road Image
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
              </label>
              
              <button 
                onClick={runDetection}
                disabled={!selectedImage || isDetecting}
                style={{
                  padding: '0.5rem 1.5rem', background: 'var(--accent-gradient)', 
                  border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold',
                  cursor: (!selectedImage || isDetecting) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedImage || isDetecting) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                {isDetecting ? <><Loader size={18} className="spin" /> Analyzing...</> : 'Run YOLOv8 Model'}
              </button>
            </div>
          </div>

          <div style={{
            position: 'relative', marginTop: '1.5rem', minHeight: '400px', 
            background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px dashed var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {!selectedImage && (
              <div style={{textAlign: 'center', color: 'var(--text-muted)'}}>
                <ImageIcon size={48} style={{opacity: 0.5, marginBottom: '1rem'}} />
                <p>Upload a road image to simulate edge node detection</p>
              </div>
            )}
            
            {selectedImage && (
              <img src={selectedImage} alt="Uploaded road" style={{maxWidth: '100%', maxHeight: '600px', borderRadius: '8px'}} />
            )}

            {/* Simulated Bounding Boxes */}
            {detectionResults && detectionResults.defects.map((defect, idx) => (
              <div key={idx} style={{
                position: 'absolute',
                top: defect.bbox.top,
                left: defect.bbox.left,
                width: defect.bbox.width,
                height: defect.bbox.height,
                border: defect.severity === 'Critical' ? '3px solid #ff4b4b' : '3px solid #f5a623',
                backgroundColor: defect.severity === 'Critical' ? 'rgba(255, 75, 75, 0.2)' : 'rgba(245, 166, 35, 0.2)',
                display: 'flex', flexDirection: 'column'
              }}>
                <span style={{
                  background: defect.severity === 'Critical' ? '#ff4b4b' : '#f5a623',
                  color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px',
                  alignSelf: 'flex-start', transform: 'translateY(-100%)'
                }}>
                  {defect.type} {(defect.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h3>Inference Results</h3>
          {detectionResults ? (
            <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>
                <span style={{color: 'var(--text-secondary)'}}>Processing Time (Edge)</span>
                <span>{detectionResults.processingTime}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>
                <span style={{color: 'var(--text-secondary)'}}>Spatio-Temporal Tag (GPS)</span>
                <span>{detectionResults.gps}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>
                <span style={{color: 'var(--text-secondary)'}}>Defects Found</span>
                <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{detectionResults.defects.length}</span>
              </div>
            </div>
          ) : (
            <div style={{marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>
              <ShieldAlert size={32} style={{opacity: 0.5, marginBottom: '0.5rem'}} />
              <p>Run the detection model to view metadata results.</p>
            </div>
          )}
        </div>
        
        <div className="glass-panel">
          <h3>Spatio-Temporal Edge Consensus</h3>
          {detectionResults ? (
            <ul style={{listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              {detectionResults.defects.map((def, idx) => (
                <li key={idx} style={{
                  padding: '0.75rem', 
                  background: def.severity === 'Critical' ? 'rgba(255,75,75,0.1)' : 'rgba(245,166,35,0.1)', 
                  borderLeft: def.severity === 'Critical' ? '3px solid var(--danger)' : '3px solid var(--warning)',
                  borderRadius: '0 6px 6px 0', 
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <span>{def.type}</span>
                  <span className={`badge ${def.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>{def.severity}</span>
                </li>
              ))}
            </ul>
          ) : (
             <p style={{marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem'}}>
               Awaiting new detections to perform spatial deduplication filtering and confirmation.
             </p>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
};

export default IoTDetection;
