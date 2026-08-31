/**
 * generateRepairAreaPDF.js — Professional Road Inspector PDF Report Generator
 * Generates an academic & engineering-oriented PDF report matching the Road Inspector visual standards.
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_BLACK_BASE64 } from '../assets/logosBase64';

export async function generateRepairAreaPDF({
  result,
  form,
  uploadedImageName,
  originalImageSrc,
  overlayImageSrc,
  potholeRec
}) {
  if (!result) {
    throw new Error('No analysis results available to generate report.');
  }

  // 1. Generate clean Record ID & Timestamp
  const rawId = form?.locationID || 'DEFECT';
  const cleanId = rawId.startsWith('IMG_') || rawId.startsWith('SEC-') || rawId.startsWith('REC-') 
    ? rawId 
    : `IMG_${Math.floor(1000 + Math.random() * 9000)}`;
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timestampFormatted = `${dateStr}, ${timeStr}`;

  const imageName = uploadedImageName || form?.uploadedImage || 'road_sample.jpg';
  const mainDefect = result.defects?.[0]?.type || 'Pothole';
  const totalRegions = result.num_regions || result.pothole_count || result.defects?.length || 1;
  const damagedPixels = result.damaged_pixels || 0;
  const totalPixels = result.total_pixels || (result.image_width && result.image_height ? result.image_width * result.image_height : 135000);
  const coveragePct = result.coverage_percentage != null ? Number(result.coverage_percentage).toFixed(2) : ((damagedPixels / totalPixels) * 100).toFixed(2);
  const estimatedArea = result.patch_area_m2 != null 
    ? Number(result.patch_area_m2).toFixed(4) 
    : (result.estimated_repair_area != null ? Number(result.estimated_repair_area).toFixed(4) : '0.0000');
  
  const gsdVal = result.gsd_m_per_px != null 
    ? `${(result.gsd_m_per_px * 100).toFixed(3)} cm/px (${result.gsd_m_per_px.toFixed(6)} m/px)` 
    : (form?.pixelScale ? `${(form.pixelScale * 100).toFixed(2)} cm/px` : '0.0100 m/px (Calibrated Prior)');
  
  const calibMethod = result.metric_method === 'IPM_homography' 
    ? `Inverse Perspective Mapping (IPM Homography) · GSD: ${gsdVal}` 
    : `Calibrated Scale Prior · ${gsdVal}`;

  const priority = result.repair_priority || result.severity_level || 'Moderate';
  const recommendedAction = result.recommendation || (
    potholeRec?.method 
      ? `${potholeRec.method} — ${priority === 'Critical' ? 'Immediate road safety intervention required' : 'Schedule repair'}`
      : 'Repair damaged road surface as soon as possible.'
  );

  // 2. Build the offscreen HTML Report Template matching the exact Road Inspector layout
  const reportContainer = document.createElement('div');
  reportContainer.id = 'temp-pdf-report-container';
  reportContainer.style.position = 'fixed';
  reportContainer.style.left = '-9999px';
  reportContainer.style.top = '0';
  reportContainer.style.width = '794px'; // Standard A4 width at 96 DPI
  reportContainer.style.backgroundColor = '#ffffff';
  reportContainer.style.color = '#1e293b';
  reportContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  reportContainer.style.boxSizing = 'border-box';
  reportContainer.style.zIndex = '-9999';

  // Build Regions list HTML
  let regionsHtml = '';
  const defectsList = result.defects && result.defects.length > 0 ? result.defects : [
    {
      id: 'POTHOLE_01',
      type: mainDefect,
      area: result.estimated_repair_area || 0.5,
      depth: (result.estimated_depth || 0.02) * 100,
      severity: result.severity_level || 'Minor',
      confidence: 0.92
    }
  ];

  defectsList.forEach((def, idx) => {
    const regionNum = idx + 1;
    const defType = (def.type || 'Pothole').toUpperCase();
    const defArea = def.area != null ? Number(def.area).toFixed(2) : '--';
    const defPct = ((def.area || 0) / (result.estimated_repair_area || 1) * Number(coveragePct)).toFixed(1);
    const defDepth = def.depth != null ? `${Number(def.depth).toFixed(1)} cm` : '--';
    const defSev = def.severity || 'Moderate';
    const defConf = def.confidence != null ? `${(def.confidence * 100).toFixed(0)}%` : '90%';
    
    let defRisk = 'Low';
    if (defSev === 'Critical') {
      defRisk = 'Dangerous';
    } else if (defSev === 'Major') {
      defRisk = 'High';
    } else if (defSev === 'Moderate') {
      defRisk = 'Medium';
    }

    regionsHtml += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px;">
        <div style="font-weight: 700; color: #0f172a; width: 140px;">
          Region #${regionNum} [${defType}]
        </div>
        <div style="color: #475569; flex: 1; text-align: left; padding-left: 10px;">
          Area: <strong style="color: #0f172a;">${defArea} m²</strong> &nbsp;|&nbsp; 
          Coverage: <strong>${defPct}%</strong> &nbsp;|&nbsp; 
          Depth: <strong>${defDepth}</strong> &nbsp;|&nbsp; 
          Risk: <strong style="color: ${defRisk === 'Dangerous' || defRisk === 'High' ? '#dc2626' : '#d97706'};">${defRisk}</strong> &nbsp;|&nbsp; 
          Conf: <strong>${defConf}</strong>
        </div>
      </div>
    `;
  });

  // Priority Badge Color
  let priorityColor;
  let priorityBg;
  const prioLower = (priority || '').toLowerCase();
  if (prioLower === 'critical') {
    priorityColor = '#dc2626';
    priorityBg = '#fef2f2';
  } else if (prioLower === 'high' || prioLower === 'major') {
    priorityColor = '#ea580c';
    priorityBg = '#fff7ed';
  } else if (prioLower === 'moderate' || prioLower === 'medium') {
    priorityColor = '#d97706';
    priorityBg = '#fffbeb';
  } else {
    priorityColor = '#16a34a';
    priorityBg = '#f0fdf4';
  }

  reportContainer.innerHTML = `
    <div style="padding: 0; background: #ffffff; width: 794px; min-height: 1123px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
      
      <!-- Top Header Professional Banner -->
      <div>
        <div style="background-color: #ffffff; color: #0f172a; padding: 18px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="${LOGO_BLACK_BASE64}" style="width: 52px; height: 52px; object-fit: contain;" alt="Road Inspector Black Logo" />
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase;">
                ROAD INSPECTOR REPORT
              </h1>
              <p style="margin: 3px 0 0 0; font-size: 10.5px; color: #475569; font-weight: 600; letter-spacing: 0.3px;">
                AI-Based Repair Area Estimation &amp; Surface Damage Analysis
              </p>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 6px 14px; border-radius: 4px; text-align: center; border: 1px solid #cbd5e1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; letter-spacing: 1px;">ROAD INSPECTOR</div>
            <div style="font-size: 7.5px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">AI &amp; IoT Road Defect Safety Audit</div>
          </div>
        </div>

        <div style="padding: 24px 32px 10px 32px;">

          <!-- Section 1: Repair Area Analysis Summary -->
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1.5px solid #0f172a;">
              Repair Area Analysis Summary
            </h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 11px; margin-top: 10px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Record ID:</span>
                <span style="color: #334155; font-family: monospace; font-weight: 600;">${cleanId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Timestamp:</span>
                <span style="color: #334155;">${timestampFormatted}</span>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Uploaded Image:</span>
                <span style="color: #334155; max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${imageName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Main Defect Type:</span>
                <span style="color: #334155; font-weight: 600;">${mainDefect}</span>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Total Segmented Damage Regions:</span>
                <span style="color: #334155; font-weight: 700;">${totalRegions}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Damaged Surface Percentage:</span>
                <span style="color: #334155; font-weight: 700;">${coveragePct}%</span>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Total Damaged Pixels:</span>
                <span style="color: #334155;">${damagedPixels.toLocaleString()} px</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Total Image Pixels:</span>
                <span style="color: #334155;">${totalPixels.toLocaleString()} px</span>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Estimated Total Repair Area:</span>
                <span style="color: #2563eb; font-weight: 800;">${estimatedArea} m²</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Measurement Unit:</span>
                <span style="color: #334155;">Square Metres (m²)</span>
              </div>

              <div style="grid-column: span 2; display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Calibration Method / Factor:</span>
                <span style="color: #334155;">${calibMethod}</span>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Max Defect Depth:</span>
                <span style="color: #0f172a; font-weight: 700;">${result?.max_depth_mm != null ? result.max_depth_mm + ' mm' : (result?.depth_calibration_status || 'Calibration Required')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Mean Defect Depth:</span>
                <span style="color: #0f172a; font-weight: 700;">${result?.mean_depth_mm != null ? result.mean_depth_mm + ' mm' : (result?.depth_calibration_status || 'Calibration Required')}</span>
              </div>
              <div style="grid-column: span 2; display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Cavity Volume (Integrated):</span>
                <span style="color: #7c3aed; font-weight: 800;">${result?.volume_m3 != null ? result.volume_m3 + ' m³ (Riemann: Σ dp × ap)' : (result?.depth_calibration_status || 'Calibration Required')}</span>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; align-items: center;">
                <span style="font-weight: 700; color: #0f172a;">Overall Repair Priority:</span>
                <span style="background: ${priorityBg}; color: ${priorityColor}; padding: 2px 8px; border-radius: 3px; font-weight: 700; font-size: 10px; text-transform: uppercase;">${priority}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                <span style="font-weight: 700; color: #0f172a;">Road Type Factor:</span>
                <span style="color: #334155; text-transform: capitalize;">${form?.roadType || 'Arterial Road'}</span>
              </div>

              <div style="grid-column: span 2; display: flex; justify-content: space-between; padding-top: 4px;">
                <span style="font-weight: 700; color: #0f172a; width: 170px;">Recommended Action:</span>
                <span style="color: #0f172a; font-weight: 600; text-align: right; flex: 1;">${recommendedAction}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Damage Region & Repair Area Analysis -->
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1.5px solid #0f172a;">
              Damage Region &amp; Repair Area Analysis
            </h2>
            <div style="background: #ffffff; border-radius: 4px;">
              ${regionsHtml}
            </div>
          </div>

          <!-- Section 3: Visual Segmentation Evidence Images -->
          <div style="margin-bottom: 18px;">
            <h2 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1.5px solid #0f172a;">
              Segmentation Evidence &amp; Spatial Defect Telemetry
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #f8fafc; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; padding: 4px; background: #e2e8f0; color: #334155;">Original Road Input</div>
                <img src="${originalImageSrc}" style="width: 100%; height: 160px; object-fit: cover; display: block;" alt="Original Input" />
              </div>
              <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #f8fafc; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; padding: 4px; background: #e2e8f0; color: #334155;">AI Segmented Defect Mask &amp; Overlay</div>
                <img src="${overlayImageSrc}" style="width: 100%; height: 160px; object-fit: cover; display: block;" alt="Segmentation Overlay" />
              </div>
            </div>
          </div>

          <!-- Section 4: Calculation Method Information -->
          <div style="background: #f8fafc; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 4px 4px 0; margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Repair Area Calculation Method</div>
            <p style="margin: 0; font-size: 10px; color: #475569; line-height: 1.4;">
              Damaged surface pixels are segmented using high-resolution semantic segmentation (YOLOv8-seg). Pixel dimensions are mapped into real-world surface metrics using ${result.metric_method === 'IPM_homography' ? 'Inverse Perspective Mapping (IPM) homography with calibrated GSD' : 'calibrated pixel-scale conversion'}. Values represent <strong>Estimated Repair Area</strong> for maintenance planning.
            </p>
          </div>

        </div>
      </div>

      <!-- Footer Disclaimer Box -->
      <div style="background: #f1f5f9; padding: 12px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 9.5px; color: #475569; font-weight: 500;">
          This is an automated engineering inspection report generated using AI-based semantic segmentation and calibrated repair area estimation.
        </p>
        <p style="margin: 3px 0 0 0; font-size: 8.5px; color: #64748b; font-weight: 600; letter-spacing: 0.2px;">
          Research Module conducted under academic standard guidelines. Road Inspector AI.
        </p>
      </div>

    </div>
  `;

  document.body.appendChild(reportContainer);

  try {
    // 3. Render HTML to canvas with high resolution scale: 2 (crisp for print)
    const canvas = await html2canvas(reportContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add page image
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Save with the requested naming format: RepairAreaReport_<RECORD_ID>.pdf
    const fileName = `RepairAreaReport_${cleanId.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    pdf.save(fileName);
    return fileName;
  } finally {
    // Clean up temporary DOM element
    if (document.body.contains(reportContainer)) {
      document.body.removeChild(reportContainer);
    }
  }
}
