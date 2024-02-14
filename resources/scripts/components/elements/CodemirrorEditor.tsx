import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
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

export default ({ initialContent, filename, mode, fetchContent, onContentSaved, onModeChanged }: Props) => {
    const [editorInitialContent, setEditorInitialContent] = useState<string>('');
    const [editorMode, setEditorMode] = useState<string>('text/plain');
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    function onMount(editor: any, monaco: any) {
        editorRef.current = editor;
        monacoRef.current = monaco;
    }

    useEffect(() => {
        if (filename === undefined) {
            return;
        }

        setEditorMode(findModeByFilename(filename)?.mime || 'text/plain');
    }, [filename]);

    useEffect(() => {
        setEditorMode(mode);
    }, [mode]);

    useEffect(() => {
        setEditorInitialContent(initialContent || '');
    }, [initialContent]);

    useEffect(() => {
        if (editorRef.current) {
            const editorInstance = editorRef.current;
            const monacoInstance = monacoRef.current;

            editorInstance.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KEY_S, () => {
                onContentSaved();
            });

            fetchContent(() => Promise.resolve(editorInstance.getModel().getValue()));
        } else {
            fetchContent(() => Promise.reject(new Error('no editor session has been configured')));
        }
    }, [editorRef, monacoRef, fetchContent, onContentSaved]);

    useEffect(() => {
        if (filename === undefined) {
            return;
        }

        onModeChanged(findModeByFilename(filename)?.mime || 'text/plain');
    }, [filename]);
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
