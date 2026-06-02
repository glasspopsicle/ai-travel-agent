
import React, { use, useState, useEffect } from 'react';
import { PromptInputContext } from '../PromptInputProvider';
import { USER_ID, CHAT_CONNECTION } from '../globals';
import FormField from './FormField';
import NumberInput from './NumberInput';
import DateInput from './DateInput';

export default function FormPage({ onSubmit }) {
  const {
    numTravellers, setNumTravellers,
    flyingFrom, setFlyingFrom,
    flyingTo, setFlyingTo,
    fromDate, setFromDate,
    toDate, setToDate,
    budget, setBudget,
  } = use(PromptInputContext);
  const [isFormDisabled, setFormDisabled] = useState(false);
  useEffect(() => {
    // Ensure the "from" date is smaller than or equal to the "to" date
    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      setToDate(fromDate);
    }
  }, [fromDate, toDate, setToDate]);
  const submitHandler = (evt) => {
    setFormDisabled(true);
    (async () => {
      try {
        await CHAT_CONNECTION.connect();
        await CHAT_CONNECTION.sendInitRequest({ userId: USER_ID });
        onSubmit && onSubmit(evt);
      } catch (ex) {
        alert('Failed to connect to server, please try again later');
        console.error(ex);
      } finally {
        setFormDisabled(false);
      }
    })();
    evt.preventDefault();
  };
  useEffect(() => {
    window.addEventListener('beforeunload', (evt) => {
      evt.preventDefault();
    });
  }, []);
  return (
    <form onSubmit={submitHandler} action="#" className="form">
      <FormField
        required
        label="Number of Travellers"
        value={numTravellers}
        setValue={setNumTravellers}
        id="numTravelers"
      >
      <NumberInput
        autoFocus
        disabled={isFormDisabled}
        tabIndex={1}
        min={1}
        specialControls={"increment-buttons"}
      />
      </FormField>
      <FormField value={flyingFrom} setValue={setFlyingFrom} required label="Flying From" id="flyingFrom">
        <input disabled={isFormDisabled} tabIndex={2} type="text" />
      </FormField>
      <FormField value={flyingTo} setValue={setFlyingTo} required label="Flying To" id="flyingTo">
        <input disabled={isFormDisabled} tabIndex={3} type="text" />
      </FormField>
      <FormField value={fromDate} setValue={setFromDate} required label="From Date" id="fromDate">
        <DateInput disabled={isFormDisabled} tabIndex={4} />
      </FormField>
      <FormField value={toDate} setValue={setToDate} required label="To Date" id="toDate">
        <DateInput disabled={isFormDisabled} tabIndex={5} />
      </FormField>
      <FormField
        value={budget}
        setValue={setBudget}
        required={false}
        label="Budget"
        id="budget"
        className="with-currency"
      >
        <NumberInput disabled={isFormDisabled} specialControls="currency" min={0} tabIndex={6} />
      </FormField>
      <button disabled={isFormDisabled} type="submit" className="input-base primary button">
      {isFormDisabled ? 'One Sec…' : 'Plan my Trip!'}
      </button>
    </form>
  );
}

