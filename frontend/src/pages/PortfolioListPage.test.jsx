import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PortfolioListPage from './PortfolioListPage';
import * as portfolioService from '../services/portfolioService';

// Mock react-router-dom useNavigate and Link
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe('PortfolioListPage', () => {
  const mockPortfolios = [
    { portfolio_id: 1, name: 'Retirement Plan' },
    { portfolio_id: 2, name: 'House Fund' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    portfolioService.getPortfolios = jest.fn().mockResolvedValue(mockPortfolios);
    portfolioService.deletePortfolio = jest.fn().mockResolvedValue(true);
  });

  test('renders list of portfolios after loading', async () => {
    render(<PortfolioListPage />);
    // Check loading state
    expect(screen.getByText(/Loading portfolios/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => expect(portfolioService.getPortfolios).toHaveBeenCalled());

    // Verify portfolio names render
    expect(screen.getByText('Retirement Plan')).toBeInTheDocument();
    expect(screen.getByText('House Fund')).toBeInTheDocument();
  });
}); 