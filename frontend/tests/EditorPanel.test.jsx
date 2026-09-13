import { describe, expect, test } from 'vitest';
import { monacoLanguage } from '../src/components/EditorPanel.jsx';

describe('Monaco language mapping', () => {
  test('supports JavaScript and Python syntax modes', () => {
    expect(monacoLanguage.javascript).toBe('javascript');
    expect(monacoLanguage.python).toBe('python');
  });
});