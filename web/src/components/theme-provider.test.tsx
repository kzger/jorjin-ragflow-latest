import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeEnum } from '@/constants/common';
import {
  ThemeProvider,
  useSyncThemeFromParams,
  useTheme,
} from './theme-provider';

let dark = false;
let listeners: Set<() => void>;
const OriginalMatchMedia = window.matchMedia;

function Controls() {
  const { theme, preference, setTheme } = useTheme();
  return (
    <>
      <output>
        {preference}:{theme}
      </output>
      <button onClick={() => setTheme(ThemeEnum.Light)}>Light</button>
    </>
  );
}

function Embed() {
  useSyncThemeFromParams('dark');
  return null;
}

beforeEach(() => {
  localStorage.clear();
  dark = false;
  listeners = new Set();
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() {
      return dark;
    },
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
});

afterAll(() => {
  window.matchMedia = OriginalMatchMedia;
});

it('follows live system changes until the user selects a theme', () => {
  const { unmount } = render(
    <ThemeProvider storageKey="test-theme">
      <Controls />
    </ThemeProvider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('system:light');
  act(() => {
    dark = true;
    listeners.forEach((listener) => listener());
  });
  expect(document.documentElement).toHaveClass('dark');
  expect(localStorage.getItem('test-theme')).toBe('system');
  fireEvent.click(screen.getByText('Light'));
  act(() => listeners.forEach((listener) => listener()));
  expect(screen.getByRole('status')).toHaveTextContent('light:light');
  expect(document.documentElement).toHaveClass('light');
  unmount();
  expect(listeners.size).toBe(0);
});

it('restores system preference after leaving an embedded dark page', () => {
  const { rerender } = render(
    <ThemeProvider storageKey="test-theme">
      <Controls />
    </ThemeProvider>,
  );
  rerender(
    <ThemeProvider storageKey="test-theme">
      <Controls />
      <Embed />
    </ThemeProvider>,
  );
  expect(document.documentElement).toHaveClass('dark');
  expect(localStorage.getItem('test-theme')).toBe('system');
  rerender(
    <ThemeProvider storageKey="test-theme">
      <Controls />
    </ThemeProvider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('system:light');
});
