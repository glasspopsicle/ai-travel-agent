
export default function OnboardingPage({ onBeginClick }) {
  return (
    <div className="onboarding">
      <img src="./logo.png" className="logo" alt="" />
      <button
        onClick={() => onBeginClick()}
        className="input-base button primary begin-button"
      >
        Let’s Begin
      </button>
    </div>
  );
}


