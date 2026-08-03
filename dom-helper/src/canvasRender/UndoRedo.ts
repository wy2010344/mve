export class TextState {
  constructor(
    readonly text: string,
    readonly cursor: number
  ) {}
}

export interface TextEditAction {
  undo(state: TextState): TextState;
  redo(state: TextState): TextState;
}

export class InsertTextAction implements TextEditAction {
  constructor(
    private readonly position: number,
    private readonly inserted: string
  ) {}

  undo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        state.text.slice(this.position + this.inserted.length),
      this.position
    );
  }

  redo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        this.inserted +
        state.text.slice(this.position),
      this.position + this.inserted.length
    );
  }
}

export class DeleteTextAction implements TextEditAction {
  constructor(
    private readonly position: number,
    private readonly deleted: string,
    private readonly isBackspace: boolean
  ) {}

  undo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        this.deleted +
        state.text.slice(this.position),
      this.isBackspace ? this.position : this.position + this.deleted.length
    );
  }

  redo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        state.text.slice(this.position + this.deleted.length),
      this.position
    );
  }
}

export class ReplaceSelectionAction implements TextEditAction {
  constructor(
    private readonly position: number,
    private readonly originalSelected: string,
    private readonly replacement: string
  ) {}

  undo(state: TextState): TextState {
    const newText =
      state.text.slice(0, this.position) +
      this.originalSelected +
      state.text.slice(this.position + this.replacement.length);
    return new TextState(newText, this.position);
  }

  redo(state: TextState): TextState {
    const newText =
      state.text.slice(0, this.position) +
      this.replacement +
      state.text.slice(this.position + this.originalSelected.length);
    return new TextState(newText, this.position + this.replacement.length);
  }
}

export class ReplaceRangeAction implements TextEditAction {
  constructor(
    private readonly position: number,
    private readonly removed: string,
    private readonly inserted: string
  ) {}

  undo(state: TextState): TextState {
    const newText =
      state.text.slice(0, this.position) +
      this.removed +
      state.text.slice(this.position + this.inserted.length);
    return new TextState(newText, this.position);
  }

  redo(state: TextState): TextState {
    const newText =
      state.text.slice(0, this.position) +
      this.inserted +
      state.text.slice(this.position + this.removed.length);
    return new TextState(newText, this.position);
  }
}

export class UndoRedo {
  private readonly undoStack: TextEditAction[] = [];
  private readonly redoStack: TextEditAction[] = [];

  constructor(private readonly maxHistorySize: number = 100) {}

  push(action: TextEditAction): void {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  undo(currentState: TextState): TextState | null {
    if (this.undoStack.length == 0) return null;
    const action = this.undoStack.pop()!;
    this.redoStack.push(action);
    return action.undo(currentState);
  }

  redo(currentState: TextState): TextState | null {
    if (this.redoStack.length == 0) return null;
    const action = this.redoStack.pop()!;
    this.undoStack.push(action);
    return action.redo(currentState);
  }

  canUndo(): boolean {
    return this.undoStack.length != 0;
  }

  canRedo(): boolean {
    return this.redoStack.length != 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
