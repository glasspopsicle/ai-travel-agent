
import React, {useState, useEffect, useRef} from 'react';
import './App.css';

function useLocationHashName() {
    const [hash, setHash] = useState(window.location.hash);
    useEffect(() => {
        const onHashChange = () => {
            console.log(window.location.hash)
            setHash(window.location.hash.substring(window.location.hash.lastIndexOf('#') + 1));
        };
        window.addEventListener('hashchange', onHashChange);
        onHashChange();
        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, []);
    useEffect(() => {
        window.location.hash = '#' + hash.substring(hash.lastIndexOf('#') + 1);
    }, [hash]);
    return [hash, setHash];
}

function OnboardingPage({ onBeginClick }) {
    return (
        <div className="onboarding">
            <img src="./logo.png" className="onboarding__logo" alt="" />
            <button onClick={() => onBeginClick()} className="button button--primary onboarding__beginButton">Let’s Begin</button>
        </div>
    );
}
function FormField({ label, required, className, value: defaultValue = '', id, children: inputField }) {
    const [value, setValue] = useState(defaultValue);
    const onChange = (evt) => {
        setValue(evt.currentTarget.value);
    };
    return (
        <div className="formField">
            <label className="formField__label" htmlFor={id}>{label} </label>
            {React.cloneElement(inputField, {
                ...inputField.props,
                value,
                id,
                name: id,
                required,
                className: `${className ? className + ' ' : ''}formField__input`,
                setValue, onChange
            })}
        </div>
    );
}

function toNum(val) {
    if (typeof val === 'number') {
        return val;
    }
    return parseInt(val);
}

let handleValidityTimeout;
function handleValidityFeedback(elem, inputElem) {
    elem.style.background = 'pink none';
    inputElem.style.caretColor = '#000';
    clearTimeout(handleValidityTimeout);
    handleValidityTimeout = setTimeout(() => {
        elem.style.background = '';
        inputElem.style.caretColor = '';
    }, 500);
}

function NumberInput({ value = '', specialControls = null, className, setValue, onChange = undefined, ...rest}) {
    const fieldRef = useRef(null);
    const [width, setWidth] = useState('2ch');
    const onChangeHandler = evt => {
        let val = String(evt.currentTarget.value);
        if (!evt.currentTarget.checkValidity()) {
            setValue(prev => prev.length === 0 ? 0 : prev);
            evt.preventDefault();
            if (evt.currentTarget.parentElement.className === 'formField__input') {
                handleValidityFeedback(evt.currentTarget.parentElement, evt.currentTarget);
            } else {
                handleValidityFeedback(evt.currentTarget, evt.currentTarget);
            }
            return;
        }
        if (specialControls === 'currency') {
            const len = Math.max(1.5, val.length);
            setWidth(len.toString() + 'ch');
        }
        const isZeroOnAddChar = (val.length === 2 && val[0] === '0');
        if (isZeroOnAddChar) {
            setValue(val.toString().substring(1));
        } else if (!isZeroOnAddChar) {
            setValue(val);
        } else if (onChange) {
            onChange(evt);
        }
    }
    const incrementHandler = (type) => {
        return evt => {
            if (type === 'increase') {
                setValue(old => Math.max(0, toNum(old || 0) + 1));
            } else if (type !== 'decrease') {
                throw new Error('Bad type');
            } else {
                setValue(old => Math.max(0, toNum(old || 0) - 1));
            }
            evt.preventDefault();
            evt.stopPropagation();
        }
    };
    const inputEl = (
        <input
            ref={fieldRef}
            {...rest} className="" type="number" value={value}
            onChange={onChangeHandler} onInput={onChangeHandler}
        />
    );
    const parentProps = { onClick: () => fieldRef.current.focus(), className };
    if (specialControls === 'incrementButtons') {
        return (
            <div {...parentProps}>
                <button onClick={incrementHandler('decrease')} className="button formField__incrementButton">-</button>
                {inputEl}
                <button onClick={incrementHandler('increase')} className="button formField__incrementButton">+</button>
            </div>
        );
    } else if (specialControls === 'currency') {
        return (
            <div {...parentProps}>
                ${React.cloneElement(inputEl, { ...inputEl.props, style: { width } })}
            </div>
        );
    } else {
        console.assert(false);
    }
}

function DateField(props) {
    const dateInputRef = useRef(null);
    return (
        <div onClick={() => dateInputRef.current.focus()} className="formField__input">
            <input ref={dateInputRef} {...props} className="" type="date" />
        </div>
    );
}

async function openConnection(url, {
    onRetry = null,
    timeout = null,
    retryCount = 0,
    maxRetries = 5
} = {}) {
    const socket = new WebSocket(url);
    return new Promise((resolve, reject) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            retryCount++;
            if (retryCount > 5) {
                reject('Failed to connect to socket');
            } else {
                let res;
                onRetry && onRetry(retryCount);
                try {
                    const updatedParams = { onRetry, timeout, retryCount, maxRetries };
                    res = await openConnection(url, updatedParams);
                } catch (ex) {
                    reject(res);
                } finally {
                    resolve(res);
                }
            }
        }, 5000);
        socket.addEventListener('open', evt => {
            resolve(socket);
        });
    });
}

async function useWebSocket(url, { onData, onRetry = null, onClose = null }) {
    let socket;
    let res;
    try {
        res = await openConnection(url, { onRetry });
    } catch (ex) {
        throw ex;
    } finally {
        socket = res;
        const messageHandler = evt => {
            onData(evt.data);
        };
        const closeHandler = () => {
            onClose && onClose();
            socket.removeEventListener('message', messageHandler);
            socket.removeEventListener('close', closeHandler);
        };
        socket.addEventListener('message', messageHandler);
        socket.addEventListener('close', closeHandler);
    }
    return socket.close;
}

function InfoSection({ title }) {
    const [body, setBody] = useState(null);
    const [bookAction, setBookAction] = useState(null);
    const [isContentReady, setIsContentReady] = useState(false);
    const data = useWebSocket('ws://localhost:8080');

    return (
        <section className={`infoSection ${isContentReady ? 'infoSection--enter' : ''}`}>
            {title && body && bookAction && <h2 className="results__subheading">{title}</h2>}
            {(body || bookAction) && <div className="infoSection__group">
                {body && <p>{body}</p>}
                {bookAction && <a href={bookAction} target="_blank" rel="noopener noreferrer" className="button button--primary">Book</a>}
            </div>}
        </section>
    );
}

function App() {
    const [curPageName, setCurPageName] = useLocationHashName();
    if (curPageName === '') {
        return (
            <div className="results">
                <h1 className="results__heading">Your Trip</h1>
                <header className="infoSection tripInfo">
                    <div className="infoSection__group tripInfo__date tripInfo__group">→ 25th Nov 23</div>
                    <div className="infoSection__group tripInfo__date tripInfo__group">25th Nov 23 ←</div>
                    <div className="infoSection__group tripInfo__destination tripInfo__group"><span className="tripInfo__startPlace">New York City</span> → <span className="tripInfo__endPlace">Paris</span></div>
                </header>
                <InfoSection title="Weather" />
                <InfoSection title="Flights" />
                <InfoSection title="Hotel" />
            </div>
        );
        return (
            <OnboardingPage onBeginClick={() => setCurPageName('form')} />
        );
    } else if (curPageName === 'form') {
        const submitHandler = (evt) => {
            setCurPageName('results');
        };
        return (
            <form onSubmit={submitHandler} action="#" className="form">
                <FormField required label="Number of Travellers" value="1" id="numTravelers">
                    <NumberInput autoFocus tabIndex={1} min={0} specialControls={'incrementButtons'} />
                </FormField>
                <FormField required label="Flying From" id="flyingFrom">
                    <input tabIndex={2} type="text" />
                </FormField>
                <FormField required label="Flying To" id="flyingTo">
                    <input tabIndex={3} type="text" />
                </FormField>
                <FormField required label="From Date" id="fromDate">
                    <DateField tabIndex={4} />
                </FormField>
                <FormField required label="To Date" id="toDate">
                    <DateField tabIndex={5} />
                </FormField>
                <FormField required={false} label="Budget" id="budget" className="formField__input--withCurrency">
                    <NumberInput specialControls="currency" min={0} tabIndex={6} />
                </FormField>
                <button type="submit" className="button--primary button">Plan my Trip!</button>
            </form>
        );
    } else if (curPageName === 'results') {

    }
}

export default App;
