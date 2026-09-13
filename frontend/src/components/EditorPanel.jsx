import Editor from '@monaco-editor/react';

export const monacoLanguage = {
  javascript: 'javascript',
  python: 'python',
  java: 'java'
};

export default function EditorPanel({ language, code, onChange }) {
  return <div className="editor-frame"><Editor height="480px" language={monacoLanguage[language] || 'plaintext'} value={code} onChange={(value) => onChange(value || '')} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 14 }} /></div>;
}
