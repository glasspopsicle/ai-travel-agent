
import React from 'react';

export default function FormField({
  label,
  required,
  className,
  value,
  setValue,
  id,
  children: inputField,
}) {
  const onChange = (evt) => {
    setValue(evt.currentTarget.value);
  };
  const fieldWithExtraProps = (extraProps) => (
    React.cloneElement(inputField, {
        ...inputField.props,
        value,
        id,
        name: id,
        required,
        className: `${className ? className + " " : ""}input input-base`,
        onChange,
        ...extraProps,
      })
  );
  return (
    <div className="form-field">
      <label className="label" htmlFor={id}>
        {label}{" "}
      </label>
      {inputField.type === 'input' ? fieldWithExtraProps() : fieldWithExtraProps({ setValue })}
    </div>
  );
}

