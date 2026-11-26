import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { BottomNav } from '@/components/navigation/bottom-nav';

const location = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('@tanstack/react-router', () => ({
  useLocation: ({ select }: { select: (value: typeof location) => string }) => select(location),
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => <a href={to} {...props}>{children}</a>,
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); location.pathname = '/'; });

it('opens the library from Home', () => {
  render(<BottomNav />);
  expect(screen.getByRole('link', { name: 'Home — Library' })).toHaveAttribute('href', '/');
});

it('opens Movies from Entertainment and marks that section active', () => {
  location.pathname = '/movies/search';
  render(<BottomNav />);
  const entertainment = screen.getByRole('link', { name: 'Entertainment' });
  expect(entertainment).toHaveAttribute('href', '/movies');
  expect(entertainment).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Home — Library' })).not.toHaveAttribute('aria-current');
});

it('opens and toggles the existing install dialog', () => {
  render(<BottomNav />);
  const install = screen.getByRole('button', { name: 'Install the app' });
  fireEvent.click(install);
  expect(screen.getByRole('dialog', { name: 'Install the app' })).toBeInTheDocument();
  fireEvent.click(install);
  expect(screen.queryByRole('dialog', { name: 'Install the app' })).not.toBeInTheDocument();
});

it('keeps the existing WhatsApp recipient and desktop message behavior', () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Desktop Chrome');
  render(<BottomNav />);
  fireEvent.click(screen.getByRole('button', { name: 'WhatsApp Help' }));
  expect(screen.getByRole('dialog', { name: 'Chat with Fresh Teacher' })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), { target: { value: 'Please help me find notes' } });
  const url = new URL(screen.getByRole('button', { name: 'Send message on WhatsApp' }).getAttribute('href') ?? '');
  expect(url.origin).toBe('https://web.whatsapp.com');
  expect(url.searchParams.get('phone')).toBe('+256786812837');
  expect(url.searchParams.get('text')).toBe('Please help me find notes');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('button', { name: 'WhatsApp Help' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('button', { name: 'WhatsApp Help' })).toHaveFocus();
});

it('keeps the mobile WhatsApp app handoff', () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Android');
  render(<BottomNav />);
  fireEvent.click(screen.getByRole('button', { name: 'WhatsApp Help' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), { target: { value: 'Hello' } });
  const url = new URL(screen.getByRole('button', { name: 'Send message on WhatsApp' }).getAttribute('href') ?? '');
  expect(url.protocol).toBe('whatsapp:');
  expect(url.searchParams.get('phone')).toBe('+256786812837');
  expect(url.searchParams.get('text')).toBe('Hello');
});