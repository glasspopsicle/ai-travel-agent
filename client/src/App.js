import React, { useEffect, useRef } from "react";
import { useLocationHashName } from './hooks';
import { PromptInputProvider } from './PromptInputProvider';
import FormPage from './components/FormPage';
import ResultsPage from './components/ResultsPage';
import OnboardingPage from './components/OnboardingPage';
import { USER_ID, CHAT_CONNECTION } from './globals';

import "./App.css";

function App() {
  const [curPageName, setCurPageName] = useLocationHashName();
  const navigatedAwayFromResultsPageRef = useRef(false);
  useEffect(() => {
    if (curPageName === 'results') {
      navigatedAwayFromResultsPageRef.current = true;
      if (CHAT_CONNECTION.socket == null) {
        setCurPageName('form');
      }
    } else if (navigatedAwayFromResultsPageRef.current) {
      CHAT_CONNECTION.sendCancelRequest(USER_ID);
    }
  }, [curPageName, setCurPageName]);
  if (curPageName === "") {
    return <OnboardingPage onBeginClick={() => setCurPageName("form")} />;
  } else if (curPageName === "form") {
    return (
      <PromptInputProvider>
        <FormPage onSubmit={() => setCurPageName("results")} />
      </PromptInputProvider>
    );
  } else if (curPageName === "results") {
    return (
      <PromptInputProvider>
        <ResultsPage />
      </PromptInputProvider>
    );
  }
}

export default App;
