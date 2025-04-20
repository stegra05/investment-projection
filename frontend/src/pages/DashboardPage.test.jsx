import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from './DashboardPage';

test('renders Dashboard heading', () => {
  render(<DashboardPage />);
  const heading = screen.getByRole('heading', { name: /dashboard/i });
  expect(heading).toBeInTheDocument();
}); 