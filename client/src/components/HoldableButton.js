
import React, { useRef } from "react";

export default function HoldableButton({ onClick, children, ...props }) {
  const buttonRef = useRef(null);
  const intervalRef = useRef(null);
  const handleMouseUp = (evt) => {
    clearInterval(intervalRef.current);
  };
  const handleMouseDown = (evt) => {
    intervalRef.current = setInterval(() => {
      onClick(evt);
    }, 300);
  };
  const handleMouseOut = (evt) => {
    clearInterval(intervalRef.current);
  };
  return <button type="button" ref={buttonRef}
    onClick={onClick}
    onMouseUp={handleMouseUp}
    onMouseDown={handleMouseDown}
    onMouseOut={handleMouseOut}
    {...props}>{children}</button>
}
