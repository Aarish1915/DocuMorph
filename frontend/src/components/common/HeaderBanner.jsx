import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const FALLBACK_TICKER = [
  { name: 'Rohan S.', amount: '₹50', college: 'Kota', message: 'Saved ₹240 Xerox' },
  { name: 'IIT Delhi Hostel', amount: '₹100', college: 'IIT Delhi', message: 'Saved ₹1,200 printing' },
  { name: 'Ananya K.', amount: '₹20', college: 'UPSC Delhi', message: 'Cleaned dark scans' },
  { name: 'Dr. Priya V.', amount: '₹50', college: 'AIIMS Bhopal', message: 'Kept diagrams crisp' },
  { name: 'Aman Verma', amount: '₹20', college: 'B.Tech CS', message: 'LaTeX intact' },
  { name: 'Siddharth M.', amount: '₹100', college: 'GATE Prep', message: '55% fewer pages' }
];

export default function HeaderBanner({ onNavigateBackers, onOpenDonation }) {
  const [donors, setDonors] = useState(FALLBACK_TICKER);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadLiveStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/donations/stats`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.ticker && data.ticker.length > 0) {
            setDonors(data.ticker);
          }
        }
      } catch (err) {
        // Fallback already active
      }
    };
    loadLiveStats();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (donors.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % donors.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [donors]);

  const donor = donors[currentIndex] || donors[0];

  return (
    <aside className="top-live-banner" aria-label="Live Server Fuel Status">
      <div className="top-banner-inner">
        {/* Left Ticker Group */}
        <div className="top-banner-left">
          <span className="live-pulse-badge">
            <span className="live-pulse-dot" />
            <span className="live-badge-text">LIVE FUEL</span>
          </span>
          <div className="donor-rotator" key={donor.name}>
            <span className="donor-highlight">☕ {donor.name}</span>
            <span className="donor-amount-pill">{donor.amount}</span>
            {donor.college && <span className="donor-college">• {donor.college}</span>}
            {donor.message && <span className="donor-quote">"{donor.message}"</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="top-banner-actions">
          <button
            type="button"
            className="banner-action-btn hall-of-fame-btn"
            onClick={onNavigateBackers}
            title="View Wall of Fame & Server Fuel Tank"
          >
            <span>🏆</span>
            <span className="btn-label-text">Wall of Fame</span>
          </button>
          <button
            type="button"
            className="banner-action-btn fuel-btn"
            onClick={onOpenDonation}
            title="Scan UPI QR or pay ₹20 chai to keep servers free"
          >
            <span>☕</span>
            <span className="btn-label-text">Fuel ₹20</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
