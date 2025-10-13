import { fdom } from 'mve-dom';
import { renderArrayKey } from 'mve-helper';
import { createSignal, StoreRef } from 'wy-helper';
import { Notification } from './gContext';

export default function (notifications: StoreRef<Notification[]>) {
  fdom.div({
    className: 'fixed top-4 right-4 z-50 space-y-2',
    children() {
      renderArrayKey(
        () => notifications.get(),
        notification => notification.id,
        getNotification => {
          const notification = getNotification();

          fdom.div({
            className() {
              const typeColors = {
                info: 'bg-blue-500',
                success: 'bg-green-500',
                warning: 'bg-yellow-500',
                error: 'bg-red-500',
              };
              return `${typeColors[notification.type]} text-white p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300`;
            },
            children() {
              fdom.div({
                className: 'flex items-start justify-between',
                children() {
                  fdom.div({
                    className: 'flex-1',
                    children() {
                      fdom.h4({
                        className: 'font-semibold mb-1',
                        childrenType: 'text',
                        children: notification.title,
                      });

                      fdom.p({
                        className: 'text-sm opacity-90',
                        childrenType: 'text',
                        children: notification.message,
                      });
                    },
                  });

                  fdom.button({
                    onClick() {
                      notifications.set(
                        notifications
                          .get()
                          .filter(n => n.id !== notification.id)
                      );
                    },
                    className: 'ml-2 text-white hover:text-gray-200',
                    children() {
                      fdom.span({
                        childrenType: 'text',
                        children: '×',
                      });
                    },
                  });
                },
              });
            },
          });
        }
      );
    },
  });
}
