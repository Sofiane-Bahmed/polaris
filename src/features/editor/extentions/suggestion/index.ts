import { StateEffect, StateField } from "@codemirror/state"
import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
    keymap
} from "@codemirror/view"

import { fetcher } from "./fetcher";


//stateEffect : A way to send "messages" to update state.
//we define one effect type for setting the suggestion text.
const setSuggestionEffect = StateEffect.define<string | null>();

//stateField : holds our suggestion state in the editor.
//- create() : return the initial value when the editir loads
//- update() : called on every transaction (keystroke,etc.) to potentiallyupdate the value
const suggestionState = StateField.define<string | null>({
    create() {
        return null;
    },
    update(value, transaction) {
        //check each effect in this transaction 
        //if we find our setSuggestionEffect, return its new value
        //Otherwise , keep the current value unchanged 
        for (const effect of transaction.effects) {
            if (effect.is(setSuggestionEffect)) {
                return effect.value
            }
        }
        return value;
    },
});

//WidgetType : creates custom DOM elements to display in the editor.
//toDOM() : is called by codeMirror to create the actual HTML element.
class SuggestionWidget extends WidgetType {
    constructor(readonly text: string) {
        super();
    }

    toDOM() {
        const span = document.createElement("span")
        span.textContent = this.text
        span.style.opacity = "0.4"; //Ghost text appearance
        span.style.pointerEvents = "none"; //dont interfere with clicks
        return span;
    }
}

let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 300;

let currentAbortController: AbortController | null = null;

const generatePayload = (view: EditorView, fileName: string) => {
    const code = view.state.doc.toString()
    if (!code || code.trim().length === 0) return null;

    const cursorPosition = view.state.selection.main.head;
    const currentLine = view.state.doc.lineAt(cursorPosition);
    const cursorInLine = cursorPosition - currentLine.from

    const previousLines: string[] = [];
    const previousLinesToFetch = Math.min(5, currentLine.number - 1);
    for (let i = previousLinesToFetch; i >= 1; i--) {
        previousLines.push(view.state.doc.line(currentLine.number - i).text);
    }

    const nextLines: string[] = [];
    const totalLines = view.state.doc.lines;
    const linesToFetch = Math.min(5, totalLines - currentLine.number);

    for (let i = 1; i <= linesToFetch; i++) {
        nextLines.push(view.state.doc.line(currentLine.number + i).text);
    }
    return {
        fileName,
        code,
        currentLine: currentLine.text,
        previousLines: previousLines.join("\n"),
        textBeforeCursor: currentLine.text.slice(0, cursorInLine),
        textAfterCursor: currentLine.text.slice(cursorInLine),
        nextLines: nextLines.join("\n"),
        lineNumber: currentLine.number,
    };
}

const createDebouncePlugin = (fileName: string) => {
    return ViewPlugin.fromClass(
        class {
            constructor(view: EditorView) {
                this.triggerSuggestion(view);
            }
            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.triggerSuggestion(update.view);
                }
            }
            triggerSuggestion(view: EditorView) {
                if (debounceTimer !== null) {
                    clearTimeout(debounceTimer);
                }

                if (currentAbortController !== null) {
                    currentAbortController.abort();
                }

                isWaitingForSuggestion = true;
                debounceTimer = window.setTimeout(async () => {
                    const payload = generatePayload(view, fileName);
                    if (!payload) {
                        isWaitingForSuggestion = false;
                        view.dispatch({ effects: setSuggestionEffect.of(null) });
                        return;
                    }
                    currentAbortController = new AbortController();

                    const suggestion = await fetcher(
                        payload,
                        currentAbortController.signal
                    );

                    isWaitingForSuggestion = false;
                    view.dispatch({
                        effects: setSuggestionEffect.of(suggestion),
                    });
                }, DEBOUNCE_DELAY);
            }
            destroy() {
                if (debounceTimer !== null) {
                    clearTimeout(debounceTimer);
                }
                if (currentAbortController !== null) {
                    currentAbortController.abort();
                }
            }
        }
    )
}

const renderPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
            this.decorations = this.build(view);
        }
        update(update: ViewUpdate) {
            const suggestionChanged = update.transactions.some((transaction) => transaction.effects.some((effect) => effect.is(setSuggestionEffect)));

            //Rebuild decorations if doc changed , cursor moved or suggestion changed
            const shouldRebuild = update.docChanged || update.selectionSet || suggestionChanged;
            if (shouldRebuild) {
                this.decorations = this.build(update.view);
            }
        }
        build(view: EditorView) {
            if (isWaitingForSuggestion) {
                return Decoration.none;
            }
            const suggestion = view.state.field(suggestionState);
            if (!suggestion) {
                return Decoration.none;
            }
            //create a widget decoration at the cursor position 
            const cursor = view.state.selection.main.head;
            return Decoration.set([
                Decoration.widget({
                    widget: new SuggestionWidget(suggestion),
                    side: 1, //render after cursor (side:1), not before (side:-1)
                }).range(cursor),
            ]);
        }
    },
    { decorations: (plugin) => plugin.decorations } //tell CodeMirror to use our decorations
)

const acceptSuggestionKeymap = keymap.of([
    {
        key: "Tab",
        run: (view) => {
            const suggestion = view.state.field(suggestionState);
            if (!suggestion) {
                return false; //No suggestion ? , let Tab do it's normal thing (indent)
            }

            const cursor = view.state.selection.main.head;
            view.dispatch({
                changes: { from: cursor, insert: suggestion }, //insert the suggestion text
                selection: { anchor: cursor + suggestion.length }, //move cursor to the end
                effects: setSuggestionEffect.of(null) //clear the suggestion
            });
            return true; //we hundled Tab, dont indent
        },
    },
]);

export const suggestion = (fileName: string) => [
    suggestionState, // our state storage
    createDebouncePlugin(fileName),
    renderPlugin, // render the ghost text
    acceptSuggestionKeymap, //tab to accept
]   