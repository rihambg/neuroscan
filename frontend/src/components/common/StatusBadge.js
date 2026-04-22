// NeuroScan - Status Badge Component
import React from 'react';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    cls: 'badge badge-amber' },
  processing: { label: 'Processing', cls: 'badge badge-blue' },
  analyzed:   { label: 'Analyzed',   cls: 'badge badge-teal' },
  reviewed:   { label: 'Reviewed',   cls: 'badge', style: { background:'#ede9fe', color:'#7c3aed' } },
  completed:  { label: 'Completed',  cls: 'badge badge-green' },
  cancelled:  { label: 'Cancelled',  cls: 'badge badge-red' },
  accepted:   { label: 'Accepted',   cls: 'badge badge-green' },
  rejected:   { label: 'Declined',   cls: 'badge badge-red' },
  normal:     { label: 'Normal',     cls: 'badge badge-green' },
  moderate:   { label: 'Moderate',   cls: 'badge badge-amber' },
  severe:     { label: 'Severe',     cls: 'badge badge-red' },
  glioma:     { label: 'Glioma',     cls: 'badge badge-red' },
  meningioma: { label: 'Meningioma', cls: 'badge badge-amber' },
  pituitary:  { label: 'Pituitary',  cls: 'badge badge-blue' },
  no_tumor:   { label: 'No Tumor',   cls: 'badge badge-green' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'badge badge-gray' };
  return (
    <span className={cfg.cls} style={cfg.style}>
      {cfg.label}
    </span>
  );
}
