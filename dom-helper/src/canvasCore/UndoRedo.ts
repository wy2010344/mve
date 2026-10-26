/**
 * 文本编辑撤销/重做（对标 Kotlin UndoRedo）：
 * 动作式（逆操作）历史栈，供 EditableTextNode 的键盘编辑使用。
 * 与快照式历史的区别：每条记录只存逆操作所需的最小信息，
 * undo/redo 是 state 的纯函数变换，栈容量有上限。
 *
 * 纯数据变换、零节点依赖 —— canvasRender / canvasRender2 与未来的树形态
 * 共用这一份实现（原先两套各有一份，仅在注释与换行上不同）。
 */

/** 文本状态（对标 Kotlin TextState data class）：文本 + 光标位置 */
export class TextState {
  constructor(
    readonly text: string,
    readonly cursor: number
  ) {}
}

/** 文本编辑动作（对标 Kotlin TextEditAction）：undo/redo 互为逆变换 */
export interface TextEditAction {
  undo(state: TextState): TextState;
  redo(state: TextState): TextState;
}

/** 插入动作（对标 Kotlin InsertTextAction） */
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

/** 删除动作（对标 Kotlin DeleteTextAction；isBackspace 决定 undo 后光标落点） */
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

/** 替换选区动作（对标 Kotlin ReplaceSelectionAction） */
export class ReplaceSelectionAction implements TextEditAction {
  constructor(
    private readonly position: number,
    private readonly originalSelected: string,
    private readonly replacement: string
  ) {}

  undo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        this.originalSelected +
        state.text.slice(this.position + this.replacement.length),
      this.position
    );
  }

  redo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        this.replacement +
        state.text.slice(this.position + this.originalSelected.length),
      this.position + this.replacement.length
    );
  }
}

/** 区间替换动作（对标 Kotlin ReplaceRangeAction：removed 与 inserted 可不等长） */
export class ReplaceRangeAction implements TextEditAction {
  constructor(
    private readonly position: number,
    private readonly removed: string,
    private readonly inserted: string
  ) {}

  undo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        this.removed +
        state.text.slice(this.position + this.inserted.length),
      this.position
    );
  }

  redo(state: TextState): TextState {
    return new TextState(
      state.text.slice(0, this.position) +
        this.inserted +
        state.text.slice(this.position + this.removed.length),
      this.position
    );
  }
}

/**
 * 动作式撤销/重做栈（对标 Kotlin UndoRedo）。
 * push 后重做栈作废；undo/redo 在两个栈之间搬运动作；
 * 超过 maxHistorySize 时丢弃最旧记录。
 */
export class UndoRedo {
  private readonly undoStack: TextEditAction[] = [];
  private readonly redoStack: TextEditAction[] = [];

  constructor(private readonly maxHistorySize: number = 100) {}

  /** 动作进入撤销栈，重做栈作废 */
  push(action: TextEditAction): void {
    this.undoStack.push(action);
    this.redoStack.length = 0;
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  /** 撤销一步；无可撤销时返回 null */
  undo(currentState: TextState): TextState | null {
    if (this.undoStack.length === 0) return null;
    const action = this.undoStack.pop()!;
    this.redoStack.push(action);
    return action.undo(currentState);
  }

  /** 重做一步；无可重做时返回 null */
  redo(currentState: TextState): TextState | null {
    if (this.redoStack.length === 0) return null;
    const action = this.redoStack.pop()!;
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    return action.redo(currentState);
  }

  canUndo(): boolean {
    return this.undoStack.length !== 0;
  }

  canRedo(): boolean {
    return this.redoStack.length !== 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
