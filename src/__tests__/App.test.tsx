import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the CollabBoard header', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /CollabBoard/i })).toBeInTheDocument();
  });

  it('renders the welcome message', () => {
    render(<App />);

    expect(screen.getByText(/Welcome to CollabBoard/i)).toBeInTheDocument();
  });
});
