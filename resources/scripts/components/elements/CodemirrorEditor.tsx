import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import modes from '@/modes';

export interface Props {
    style?: React.CSSProperties;
    initialContent?: string;
    mode: string;
    filename?: string;
    onModeChanged: (mode: string) => void;
    fetchContent: (callback: () => Promise<string>) => void;
    onContentSaved: () => void;
}

const findModeByFilename = (filename: string) => {
    for (let i = 0; i < modes.length; i++) {
        const info = modes[i];

        if (info.file && info.file.test(filename)) {
            return info;
        }
    }

    const dot = filename.lastIndexOf('.');
    const ext = dot > -1 && filename.substring(dot + 1, filename.length);

    if (ext) {
        for (let i = 0; i < modes.length; i++) {
            const info = modes[i];
            if (info.ext) {
                for (let j = 0; j < info.ext.length; j++) {
                    if (info.ext[j] === ext) {
                        return info;
                    }
                }
            }
        }
    }

    return undefined;
};

// monaco.languages.register({ id: 'properties' });

// monaco.languages.setMonarchTokensProvider('properties', {
//     tokenizer: {
//         root: [
//             [/\b(?:true|false)\b/, 'keyword'],
//             [/[a-zA-Z_-][\w-]*/, 'variable'],
//             [/=/, 'operator'],
//             [/#.*$/, 'comment'],
//         ],
//     },
// });

export default ({ initialContent, filename, mode, fetchContent, onContentSaved, onModeChanged }: Props) => {
    const [editorInitialContent, setEditorInitialContent] = useState<string>('');
    const [editorMode, setEditorMode] = useState<string>('text/plain');
    const editorRef = useRef<any>(null);

    const onMount = (editor: any) => (editorRef.current = editor);

    useEffect(() => {
        if (filename === undefined) {
            return;
        }
        const modeData = findModeByFilename(filename)?.mime || 'text/plain';
        setEditorMode(modeData);
        onModeChanged(modeData);
    }, [filename]);

    useEffect(() => {
        setEditorMode(mode);
    }, [mode]);

    useEffect(() => {
        setEditorInitialContent(initialContent || '');
    }, [initialContent]);

    useEffect(() => {
        if (!editorRef.current) {
            fetchContent(() => Promise.reject(new Error('no editor session has been configured')));
            return;
        }
        const editorInstance = editorRef.current;

        editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            onContentSaved();
        });

        fetchContent(() => Promise.resolve(editorInstance.getModel().getValue()));
    }, [editorRef, fetchContent, onContentSaved]);

    return (
        <Editor
            height='72vh'
            width='100%'
            theme='vs-dark'
            language={editorMode}
            value={editorInitialContent}
            options={{ minimap: { enabled: false } }}
            onMount={onMount}
        />
    );
};
