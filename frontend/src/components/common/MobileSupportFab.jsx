import React from 'react';

export default function MobileSupportFab({ onOpenDonation }) {
  return (
    <button
      type="button"
      className="mobile-support-fab"
      onClick={onOpenDonation}
      aria-label="Support Server Fuel"
      title="Support CleanNotes"
    >
      <span style={{ fontSize: '16px' }}>☕</span>
      <span>Support</span>
    </button>
  );
}
