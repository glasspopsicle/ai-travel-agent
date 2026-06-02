import React, { useRef } from 'react';

export default function DateInput({ setValue: _, ...props }) {
  const dateInputRef = useRef(null);
  return (
    <div onClick={() => dateInputRef.current.focus()} className="input input-base">
      <input ref={dateInputRef} {...props} className="" type="date" />
    </div>
  );
}
