import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { sampleDraft } from './features/workspace/data/sampleDraft';

describe('App', () => {
  it('renders the local-only shell on load', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /technical writing assistant/i })).toBeInTheDocument();
    expect(screen.getByText(/single source workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/snapshot is current/i)).toBeInTheDocument();
  });

  it('lets the user replace text and run a fresh local snapshot', async () => {
    const user = userEvent.setup();

    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);

    await user.click(screen.getByRole('button', { name: /clear draft/i }));
    await user.type(editor, 'Ship the release today.');
    await user.click(screen.getByRole('button', { name: /run local snapshot/i }));

    expect(screen.getByText('4 words across 1 sentence and 1 paragraph.')).toBeInTheDocument();
    expect(screen.getAllByText(/nothing leaves this browser tab/i)).toHaveLength(2);
    expect(screen.getByText(/snapshot is current/i)).toBeInTheDocument();
  });

  it('replaces the current draft with the starter memo', async () => {
    const user = userEvent.setup();

    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);

    await user.click(screen.getByRole('button', { name: /clear draft/i }));
    await user.click(screen.getByRole('button', { name: /replace with starter draft/i }));

    expect(editor).toHaveValue(sampleDraft);
    expect(screen.getByText(/draft changed\. run a fresh local snapshot/i)).toBeInTheDocument();
  });
});
