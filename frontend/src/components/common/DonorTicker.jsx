import React, { useState, useEffect } from 'react';
import { API_BASE, probeBackend } from '../../config';

export default function DonorTicker({ onNavigateCommunity, onOpenDonation }) {
  const [topDonors, setTopDonors] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchTopDonors() {
      try {
        const node = await probeBackend();
        const baseUrl = node.url || API_BASE;
        const res = await fetch(`${baseUrl}/api/donations/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setTopDonors(data);
          }
        }
      } catch {
        // Silent catch: if backend is unavailable or empty, ticker hides cleanly
      }
    }

    fetchTopDonors();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (topDonors.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topDonors.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [topDonors.length]);

  if (!topDonors.length) return null;

  const current = topDonors[currentIndex];

  return (
    <aside className="donor-ticker-bar" aria-label="Top Community Donors">
      <div className="donor-ticker-inner">
        <div className="ticker-item-content">
          <span style={{ fontSize: '13px', flexShrink: 0 }}>👑</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            <strong>{current.name}</strong>
            {current.college ? ` (${current.college})` : ''}
            {' fueled '}
            <strong style={{ color: 'var(--accent)' }}>{current.amount}</strong>
            {current.note ? ` • "${current.note}"` : ''}
          </span>
        </div>

        <div className="ticker-actions-group">
          <span
            className="ticker-cta"
            onClick={onOpenDonation}
            role="button"
            tabIndex={0}
          >
            Support ₹20 →
          </span>
          <span
            className="ticker-wall-link"
            onClick={onNavigateCommunity}
            role="button"
            tabIndex={0}
          >
            Wall of Fame
          </span>
        </div>
      </div>
    </aside>
  );
}
