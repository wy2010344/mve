// Vibe Coding Skill Implementation
// Generates MVE code snippets as strings (no actual imports needed)

// Type definitions for skill input/output
interface SkillInput {
  goal: string
  framework?: 'fdom' | 'zdom' | 'dom'
  mode?: 'quick' | 'detailed'
  autoCleanup?: boolean
}

interface SkillOutput {
  description: string
  code: string
  notes: string
}

/**
 * Vibe Coding Skill Implementation
 * Generates MVE code snippets based on user goals
 */
export function generateVibeCode(input: SkillInput): SkillOutput {
  const {
    goal,
    framework = 'fdom',
    mode = 'detailed',
    autoCleanup = true,
  } = input

  let description = ''
  let code = ''
  let notes = ''

  // Parse goal and generate code
  if (goal.includes('todo') || goal.includes('list')) {
    description = 'Todo 列表组件'
    code = generateTodoList(framework, mode, autoCleanup)
    notes = '支持添加、完成状态切换。TODO: 添加删除功能'
  } else if (goal.includes('timer') || goal.includes('time')) {
    description = '计时器组件'
    code = generateTimer(framework, mode, autoCleanup)
    notes = '自动更新时间显示。TODO: 添加暂停/重置功能'
  } else if (goal.includes('form') || goal.includes('input')) {
    description = '表单组件'
    code = generateForm(framework, mode, autoCleanup)
    notes = '双向绑定输入。TODO: 添加验证逻辑'
  } else {
    description = '通用 MVE 组件模板'
    code = generateGeneric(framework, mode, autoCleanup)
    notes = '基础模板，可根据需求扩展'
  }

  return { description, code, notes }
}

// Helper functions for code generation
function generateTodoList(
  framework: string,
  mode: string,
  autoCleanup: boolean,
): string {
  const imports = `import { createSignal, memo, hookTrackSignal, addEffect${autoCleanup ? ', hookDestroy' : ''} } from 'mve-core';\nimport { ${framework}, renderArrayKey, renderIf } from 'mve-dom';`

  const component = `
function TodoApp() {
  const todos = createSignal([{ id: 1, text: '学习 MVE', done: false }]);
  const text = createSignal('');

  const finishedCount = memo(() => todos.get().filter(t => t.done).length);

  ${
    mode === 'detailed'
      ? `// 追踪完成状态变化
  hookTrackSignal(
    () => todos.get().map(t => t.done).join(','),
    (newValue) => {
      addEffect(() => {
        console.log('完成数变化:', finishedCount());
      });
    }
  );`
      : ''
  }

  ${
    autoCleanup
      ? `// 组件销毁时清理（可选）
  hookDestroy(() => {
    console.log('TodoApp 销毁');
  });`
      : ''
  }

  return ${framework}.div({
    children() {
      ${framework}.input({
        value: text.get(),
        onInput(e) {
          text.set(e.currentTarget.value);
        }
      });
      ${framework}.button({
        onClick() {
          todos.set([...todos.get(), { id: Date.now(), text: text.get(), done: false }]);
          text.set('');
        },
        children: '添加 Todo'
      });
      renderArrayKey(
        () => todos.get(),
        (item) => item.id,
        (getItem) => {
          ${framework}.div({
            children() {
              const item = getItem();
              ${framework}.label({
                children: [
                  ${framework}.input({
                    type: 'checkbox',
                    checked: item.done,
                    onChange() {
                      const list = todos.get().map(x => x.id === item.id ? { ...x, done: !x.done } : x);
                      todos.set(list);
                    }
                  }),
                  \` \${item.text}\`
                ]
              });
            }
          });
        }
      );
      ${framework}.p({ children: \`完成: \${finishedCount()}/\${todos.get().length}\` });
    }
  });
}`

  return `${imports}\n\n${component}`
}

function generateTimer(
  framework: string,
  mode: string,
  autoCleanup: boolean,
): string {
  const imports = `import { createSignal, addEffect${autoCleanup ? ', hookDestroy' : ''} } from 'mve-core';\nimport { ${framework} } from 'mve-dom';`

  const component = `
function TimerComponent() {
  const time = createSignal(new Date().toLocaleTimeString());

  addEffect(() => {
    console.log('Timer 组件初始化完成');
  });

  const timer = setInterval(() => {
    time.set(new Date().toLocaleTimeString());
  }, 1000);

  ${
    autoCleanup
      ? `hookDestroy(() => {
    clearInterval(timer);
    console.log('Timer 清理完成');
  });`
      : ''
  }

  return ${framework}.div({
    children() {
      ${framework}.p({ childrenType: 'text', children: () => \`当前时间: \${time.get()}\` });
    }
  });
}`

  return `${imports}\n\n${component}`
}

function generateForm(
  framework: string,
  mode: string,
  autoCleanup: boolean,
): string {
  const imports = `import { createSignal, hookTrackSignal${autoCleanup ? ', hookDestroy' : ''} } from 'mve-core';\nimport { ${framework} } from 'mve-dom';`

  const component = `
function FormComponent() {
  const name = createSignal('');
  const email = createSignal('');

  ${
    mode === 'detailed'
      ? `hookTrackSignal(
    () => name.get() + email.get(),
    (newValue) => {
      console.log('表单数据变化:', newValue);
    }
  );`
      : ''
  }

  ${
    autoCleanup
      ? `hookDestroy(() => {
    console.log('Form 组件销毁');
  });`
      : ''
  }

  return ${framework}.form({
    onSubmit(e) {
      e.preventDefault();
      console.log('提交:', { name: name.get(), email: email.get() });
    },
    children() {
      ${framework}.input({
        type: 'text',
        placeholder: '姓名',
        value: name.get(),
        onInput(e) {
          name.set(e.currentTarget.value);
        }
      });
      ${framework}.input({
        type: 'email',
        placeholder: '邮箱',
        value: email.get(),
        onInput(e) {
          email.set(e.currentTarget.value);
        }
      });
      ${framework}.button({ type: 'submit', children: '提交' });
    }
  });
}`

  return `${imports}\n\n${component}`
}

function generateGeneric(
  framework: string,
  mode: string,
  autoCleanup: boolean,
): string {
  const imports = `import { createSignal${autoCleanup ? ', hookDestroy' : ''} } from 'mve-core';\nimport { ${framework} } from 'mve-dom';`

  const component = `
function GenericComponent() {
  const count = createSignal(0);

  ${
    autoCleanup
      ? `hookDestroy(() => {
    console.log('Generic 组件销毁');
  });`
      : ''
  }

  return ${framework}.div({
    children() {
      ${framework}.p({ children: \`计数: \${count.get()}\` });
      ${framework}.button({
        onClick() {
          count.set(count.get() + 1);
        },
        children: '增加'
      });
    }
  });
}`

  return `${imports}\n\n${component}`
}

// Example usage (for testing)
// const result = generateVibeCode({
//   goal: 'todo list',
//   framework: 'fdom',
//   mode: 'detailed',
//   autoCleanup: true
// });
//
// console.log('Description:', result.description);
// console.log('Code:');
// console.log(result.code);
// console.log('Notes:', result.notes);
