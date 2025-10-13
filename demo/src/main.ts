import { createRoot, fdom, svg } from 'mve-dom';
import todoDemo from './todo-demo';
import { destroyGlobalHolder } from 'mve-core';
import canvasRenderDemo from './canvas-render-demo';
import countDemo from './count-demo';
import {
  argForceNumber,
  createTreeRoute,
  getBranchKey,
  renderArrayKey,
  renderOneKey,
} from 'mve-helper';
import { routerProvide } from 'mve-dom-helper/history';
import { createBrowserHistory } from 'history';
import { renderPop } from 'mve-dom-helper';
import { gContext, ThemeType, Notification } from './pages/gContext';
import { createSignal, memo } from 'wy-helper';
import renderNotification from './pages/render-notification';
const app = document.querySelector<HTMLDivElement>('#app')!;
const pages = import.meta.glob('./pages/**');
const { renderBranch, getBranch, preLoad } = createTreeRoute({
  treeArg: {
    number: argForceNumber,
  },
  pages,
  prefix: './pages/',
});
createRoot(app, () => {
  const { getHistoryState } = routerProvide(createBrowserHistory());

  //业务代码放在这里
  // todoDemo()
  // canvasRenderDemo()
  // countDemo()

  // return
  const theme = createSignal<ThemeType>('light');

  // 计算属性
  const themeColors = memo((old: any, inited: boolean) => {
    const isDark = theme.get() === 'dark';
    return {
      bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
      cardBg: isDark ? 'bg-gray-800' : 'bg-white',
      text: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      primary: isDark ? '#3b82f6' : '#2563eb',
    };
  });

  const notifications = createSignal<Notification[]>([]);
  gContext.provide({
    renderBranch,
    preLoad,
    theme: theme.get,
    themeColors,
    toggleTheme() {
      theme.set(theme.get() === 'light' ? 'dark' : 'light');
    },
    addNotification(n) {
      const newNotification: Notification = {
        ...n,
        id: Date.now(),
        timestamp: new Date(),
      };
      notifications.set([newNotification, ...notifications.get().slice(0, 4)]);
    },
    getNotifications: notifications.get,
  });

  fdom.div({
    className:
      'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100',
    children() {
      renderOneKey(
        getBranch(() => getHistoryState().pathname),
        getBranchKey,
        function (key, branch) {
          renderBranch(branch);
        }
      );
    },
  });

  renderNotification(notifications);
  renderPop();
});
window.addEventListener('unload', destroyGlobalHolder);
