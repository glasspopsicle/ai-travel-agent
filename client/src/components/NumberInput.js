
import React, { useRef, useState, useEffect } from 'react';

import HoldableButton from './HoldableButton';

function toNum(val) {
  if (typeof val === "number") {
    return val;
  }
  return parseInt(val);
}

let handleValidityTimeout;
function handleValidityFeedback(elem, inputElem) {
  elem.style.background = "pink none";
  inputElem.style.caretColor = "#000";
  clearTimeout(handleValidityTimeout);
  handleValidityTimeout = setTimeout(() => {
    elem.style.background = "";
    inputElem.style.caretColor = "";
  }, 500);
}

export default function NumberInput({
  value = "",
  setValue,
  specialControls = null,
  className,
  disabled,
  min = null,
  max = null,
  onChange = undefined,
  ...rest
}) {
  const fieldRef = useRef(null);
  const [width, setWidth] = useState("2ch");
  const onChangeHandler = (evt) => {
    let val = String(evt.currentTarget.value);
    evt.currentTarget.checkValidity();
    if (evt.currentTarget.validity.badInput) {
      setValue((prev) => (prev.length === 0 ? 0 : prev));
      evt.preventDefault();
      handleValidityFeedback(
        evt.currentTarget.parentElement,
        evt.currentTarget,
      );
      return;
    }
    const isZeroOnAddChar = val.length === 2 && val[0] === "0";
    if (isZeroOnAddChar) {
      setValue(val.toString().substring(1));
    } else if (!isZeroOnAddChar) {
      setValue(val);
    } else if (onChange) {
      onChange(evt);
    }
  };
  useEffect(() => {
    if (value != null && specialControls === "currency") {
      const len = Math.max(1.5, value.length);
      setWidth(len.toString() + "ch");
    }
  }, [value, specialControls]);
  const incrementHandler = (type) => {
    return (evt) => {
      if (type === "increase") {
        setValue((old) => Math.min(max ?? Infinity, Math.max(min ?? 0, toNum(old || 0) + 1)));
      } else if (type === "decrease") {
        setValue((old) => Math.min(max ?? Infinity, Math.max(min ?? 0, toNum(old || 0) - 1)));
      } else {
        throw new Error("Bad type");
      }
      evt.preventDefault();
      evt.stopPropagation();
    };
  };
  const inputEl = (
    <input
      ref={fieldRef}
      {...rest}
      disabled={disabled}
      className=""
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={onChangeHandler}
      onInput={onChangeHandler}
    />
  );
  const parentProps = { onClick: () => fieldRef.current.focus(), className };
  if (specialControls === "increment-buttons") {
    return (
      <div {...parentProps}>
        <HoldableButton
          onClick={incrementHandler("decrease")}
          className="input-base button increment-button"
        >
          -
        </HoldableButton>
        {inputEl}
        <HoldableButton
          onClick={incrementHandler("increase")}
          disabled={disabled}
          className="input-base button increment-button"
        >
          +
        </HoldableButton>
      </div>
    );
  } else if (specialControls === "currency") {
    return (
      <div {...parentProps}>
        ${React.cloneElement(inputEl, { ...inputEl.props, style: { width } })}
      </div>
    );
  } else {
    console.assert(false);
  }
}

 
