import React, { useEffect, useRef } from 'react';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  Decoration,
  DecorationSet
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { SupportedLanguage } from '../../types/trace';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  activeLine?: number | null;
  errorLine?: number | null;
  executedLines?: number[];
  readOnly?: boolean;
}

// State effects for updating line decorations
const setActiveLineEffect = StateEffect.define<number | null>();
const setErrorLineEffect = StateEffect.define<number | null>();
const setTrailEffect = StateEffect.define<number[]>();

const lineHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    let activeLine: number | null = null;
    let errorLine: number | null = null;
    let trailLines: number[] = [];

    for (let e of tr.effects) {
      if (e.is(setActiveLineEffect)) activeLine = e.value;
      if (e.is(setErrorLineEffect)) errorLine = e.value;
      if (e.is(setTrailEffect)) trailLines = e.value;
    }

    if (activeLine === null && errorLine === null && trailLines.length === 0) {
      return decorations;
    }

    const decoList: any[] = [];
    const doc = tr.state.doc;

    // Faint trail
    for (const lno of trailLines) {
      if (lno > 0 && lno <= doc.lines && lno !== activeLine) {
        const line = doc.line(lno);
        decoList.push(
          Decoration.line({
            attributes: { class: 'cm-line-trail' }
          }).range(line.from)
        );
      }
    }

    // Active line
    if (activeLine && activeLine > 0 && activeLine <= doc.lines) {
      const line = doc.line(activeLine);
      decoList.push(
        Decoration.line({
          attributes: { class: 'cm-line-executing' }
        }).range(line.from)
      );
    }

    // Error line
    if (errorLine && errorLine > 0 && errorLine <= doc.lines) {
      const line = doc.line(errorLine);
      decoList.push(
        Decoration.line({
          attributes: { class: 'cm-line-error' }
        }).range(line.from)
      );
    }

    // Sort decorations by `from` position
    decoList.sort((a, b) => a.from - b.from);
    return Decoration.set(decoList);
  },
  provide: f => EditorView.decorations.from(f)
});

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  activeLine,
  errorLine,
  executedLines = [],
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const getLanguageExtension = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'java':
        return java();
      case 'cpp':
        return cpp();
      case 'python':
      default:
        return python();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        indentUnit.of('    '),
        getLanguageExtension(language),
        oneDark,
        lineHighlightField,
        EditorState.readOnly.of(readOnly),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
            backgroundColor: '#121417'
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace"
          },
          '.cm-gutters': {
            backgroundColor: '#0f1115',
            color: '#4e5564',
            borderRight: '1px solid #1e2229'
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#1b1f27',
            color: '#cbd5e1'
          },
          '.cm-line-executing': {
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            borderLeft: '3px solid #eab308'
          },
          '.cm-line-trail': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderLeft: '2px solid rgba(148, 163, 184, 0.25)'
          },
          '.cm-line-error': {
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderLeft: '3px solid #ef4444'
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Sync external code changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== code) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code }
      });
    }
  }, [code]);

  // Sync activeLine, errorLine, trail
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        setActiveLineEffect.of(activeLine ?? null),
        setErrorLineEffect.of(errorLine ?? null),
        setTrailEffect.of(executedLines)
      ]
    });

    // Scroll active line into view smoothly
    if (activeLine && activeLine > 0 && activeLine <= view.state.doc.lines) {
      const line = view.state.doc.line(activeLine);
      view.dispatch({
        effects: EditorView.scrollIntoView(line.from, { y: 'center' })
      });
    }
  }, [activeLine, errorLine, executedLines]);

  return <div ref={containerRef} className="editor-container w-full h-full" />;
};

