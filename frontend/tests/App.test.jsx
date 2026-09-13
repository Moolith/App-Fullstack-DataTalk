import { render, screen } from '@testing-library/react';
import App from '../src/App.jsx';

test('renders session creation screen', () => {
  render(<App />);
  expect(screen.getByText(/Make the interview/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create session link/i })).toBeInTheDocument();
});
