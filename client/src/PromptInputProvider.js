
import React, { useState, useMemo, createContext } from "react";
import { TODAY } from './globals';
export const PromptInputContext = createContext();

function dateToInputStr(date, { monthOffset = 0, dayOffset = 0 } = {}) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1 + monthOffset).padStart(2, '0');
  const day = String(date.getDate() + dayOffset).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PromptInputProvider({ children }) {
  const [numTravellers, setNumTravellers] = useState(1);
  const [flyingFrom, setFlyingFrom] = useState('');
  const [flyingTo, setFlyingTo] = useState('');
  const [fromDate, setFromDate] = useState(dateToInputStr(TODAY));
  const [toDate, setToDate] = useState(dateToInputStr(TODAY, { monthOffset: 0, dayOffset: 2 }));
  const [budget, setBudget] = useState('1000');
  const contextValue = useMemo(() => ({
    numTravellers, setNumTravellers,
    flyingFrom, setFlyingFrom,
    flyingTo, setFlyingTo,
    fromDate, setFromDate,
    toDate, setToDate,
    budget, setBudget,
  }), [
    numTravellers,
    flyingFrom,
    flyingTo,
    fromDate,
    toDate,
    budget,
  ]);
  return (
    <PromptInputContext value={contextValue}>
      {children}
    </PromptInputContext>
  );
}

