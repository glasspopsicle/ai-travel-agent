
import { CHAT_CONNECTION, USER_ID } from '../globals';
import React, { useEffect, useState, useRef, use } from 'react';
import { PromptInputContext } from '../PromptInputProvider';

export function InfoSection({ title, id, hasAction }) {
  const [body, setBody] = useState('');
  const [bookAction, setBookAction] = useState('');
  const isSentRef = useRef(false);
  const {
    numTravellers,
    flyingFrom,
    flyingTo,
    fromDate,
    toDate,
    budget,
  } = use(PromptInputContext);
  useEffect(() => {
    if (isSentRef.current) {
      return;
    }
    const conn = CHAT_CONNECTION;
    const addBodyTokenEl = (token, counter) => {
      return (prev) =>
      (<>{prev}<span className="token-in"
        style={{ '--inc-factor': counter }}>{token}</span></>);
    };
    const addToken = token => {
      return (prev) => prev + token;
    };
    conn.initMessageHandler(id, {
      'Message': (token, counter) => setBody(addBodyTokenEl(token, counter)),
      'URL_for_booking_for_flight': token => setBookAction(addToken(token)),
      'URL_for_booking_for_hotel': token => setBookAction(addToken(token)),
    });
    const inputData = {
      "number_of_travellers": numTravellers,
      "flying_from": flyingFrom,
      "flying_to": flyingTo,
      "from_date": fromDate,
      "to_date": toDate,
      "budget": '$' + budget,
    };
    const prompt = JSON.stringify({
      user_id: USER_ID,
      prompt_id: id,
      prompt_message: inputData,
    });
    isSentRef.current = true;
    conn.socket?.send(prompt);
  }, [budget, fromDate, toDate, flyingFrom, flyingTo, numTravellers, id]);
  return (
    <section
      className="section"
    >
      <h2 className="subheading">{title}</h2>
      <div className={`group${!body ? ' loading' : ''}`}>
        <p>{body ? body : (<>&nbsp;</>)}</p>
        {hasAction && <a
          hidden={!bookAction}
          aria-hidden={bookAction ? "false" : "true"}
          href={bookAction}
          target="_blank"
          rel="noopener noreferrer"
          className={`input-base button primary${bookAction ? ' fly-in' : ''}`}
        >
          Book
        </a>}
      </div>
    </section>
  );
}


