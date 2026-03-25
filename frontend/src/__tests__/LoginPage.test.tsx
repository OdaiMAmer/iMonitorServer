import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// Mock dependencies
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      setAuth: vi.fn(),
      isAuthenticated: false,
      user: null,
      accessToken: null,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../lib/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

vi.mock('../stores/useToastStore', () => ({
  toast: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form', () => {
    renderLoginPage();

    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('should render the email input field', () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('admin@example.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should render the password input field', () => {
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should render the Sign In button', () => {
    renderLoginPage();

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render the Remember me checkbox', () => {
    renderLoginPage();

    expect(screen.getByText('Remember me')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should render the application branding', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/iMonitor/i);
    expect(screen.getByText('Server Monitoring Dashboard')).toBeInTheDocument();
  });

  it('should render the Forgot password link', () => {
    renderLoginPage();

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('should render the Email Address label', () => {
    renderLoginPage();

    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('should render the Password label', () => {
    renderLoginPage();

    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('should render the version footer', () => {
    renderLoginPage();

    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });
});
