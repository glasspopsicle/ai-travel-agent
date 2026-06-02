
import React, { use, useEffect } from 'react';
import { PromptInputContext } from '../PromptInputProvider';
import { InfoSection } from './InfoSection';
import { MONTH_NAMES } from '../globals';

function formatDate(date) {
  const day = date.getDate();
  let dayPostfix = 'th';
  if (day === 1) dayPostfix = 'st';
  else if (day === 2) dayPostfix = 'nd';
  else if (day === 3) dayPostfix = 'rd';
  const monthName = MONTH_NAMES[date.getMonth()];
  let year = date.getFullYear().toString();
  year = year.substring(year.length - 2);
  return `${day}${dayPostfix} ${monthName} ${year}`;
}

export default function ResultsPage() {
  const { fromDate, toDate, flyingFrom, flyingTo } = use(PromptInputContext);
  useEffect(() => {
    window.addEventListener('beforeunload', (evt) => {
      evt.preventDefault();
    });
  }, []);
  return (
    <div className="results">
      <h1 className="heading">Your Trip</h1>
      <header className="section trip-info">
        <div className="group date">→ {formatDate(new Date(fromDate))}</div>
        <div className="group date">{formatDate(new Date(toDate))} ←</div>
        <div className="group destination">
          {flyingFrom} → {flyingTo}
        </div>
      </header>
      <InfoSection hasAction={false} title="Activities" id="activities" />
      <InfoSection hasAction={false} title="Weather" id="weather" />
      <InfoSection hasAction={true} title="Flights" id="flights" />
      <InfoSection hasAction={true} title="Hotel" id="hotel" />
    </div>
  );
}
