import { useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type TutorialStep = {
  id: string;
  title: string;
  body: string;
};

type FirstRunTutorialProps = {
  isOpen: boolean;
  stepIndex: number;
  steps: TutorialStep[];
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
};

export function FirstRunTutorial({ isOpen, stepIndex, steps, onNext, onSkip, onFinish }: FirstRunTutorialProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const skipButtonRef = useRef<HTMLButtonElement | null>(null);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const descriptionId = useMemo(() => `tutorial-step-${step.id}-description`, [step.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    skipButtonRef.current?.focus();
  }, [isOpen, stepIndex]);

  if (!isOpen) {
    return null;
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onSkip();
      return;
    }

    if (event.key !== 'Tab' || !dialogRef.current) {
      return;
    }

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="tutorial-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="tutorial-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-heading"
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
      >
        <div className="tutorial-progress-row">
          <p className="eyebrow">Quick tutorial</p>
          <p className="panel-meta">
            Step {stepIndex + 1} of {steps.length}
          </p>
        </div>

        <h2 id="tutorial-heading">{step.title}</h2>
        <p id={descriptionId} className="tutorial-copy">
          {step.body}
        </p>

        <ol className="tutorial-step-dots" aria-label="tutorial progress">
          {steps.map((tutorialStep, index) => (
            <li key={tutorialStep.id} className={index === stepIndex ? 'tutorial-step-dot is-active' : 'tutorial-step-dot'}>
              <span className="sr-only">{tutorialStep.title}</span>
            </li>
          ))}
        </ol>

        <div className="tutorial-actions">
          <button ref={skipButtonRef} type="button" className="button-secondary" onClick={onSkip}>
            Skip tutorial
          </button>
          {isLastStep ? (
            <button type="button" className="button-primary" onClick={onFinish}>
              Finish tutorial
            </button>
          ) : (
            <button type="button" className="button-primary" onClick={onNext}>
              Next tip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
