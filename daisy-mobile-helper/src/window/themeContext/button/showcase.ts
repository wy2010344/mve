import { Button, IconButton } from './index';
import { Flex } from '../layout';
import {
  ShowcaseContainer,
  ShowcaseSection,
  ShowcaseDemo,
  ShowcaseDescription,
  ShowcaseDivider,
} from '../showcase-layout';

export default function ButtonShowcase() {
  ShowcaseContainer(() => {
    // 基础按钮
    ShowcaseSection({
      title: '基础按钮',
      subtitle: '不同变体的按钮样式',
      children() {
        ShowcaseDemo({
          children() {
            Button({ variant: 'primary', children: 'Primary' });
            Button({ variant: 'secondary', children: 'Secondary' });
            Button({ variant: 'tertiary', children: 'Tertiary' });
            Button({ variant: 'success', children: 'Success' });
            Button({ variant: 'warning', children: 'Warning' });
            Button({ variant: 'danger', children: 'Danger' });
            Button({ variant: 'ghost', children: 'Ghost' });
            Button({ variant: 'outline', children: 'Outline' });
          },
        });
        ShowcaseDescription(
          '按钮支持 8 种变体：primary（主要）、secondary（次要）、tertiary（第三）、success（成功）、warning（警告）、danger（危险）、ghost（幽灵）、outline（轮廓）'
        );
      },
    });

    ShowcaseDivider();

    // 按钮尺寸
    ShowcaseSection({
      title: '按钮尺寸',
      subtitle: '三种不同大小的按钮',
      children() {
        ShowcaseDemo({
          children() {
            Button({ variant: 'primary', size: 'sm', children: 'Small' });
            Button({ variant: 'primary', size: 'md', children: 'Medium' });
            Button({ variant: 'primary', size: 'lg', children: 'Large' });
          },
        });
        ShowcaseDescription('按钮提供三种尺寸：sm（小）、md（中）、lg（大）');
      },
    });

    ShowcaseDivider();

    // 图标按钮
    ShowcaseSection({
      title: '图标按钮',
      subtitle: '纯图标的圆形按钮',
      children() {
        ShowcaseDemo({
          children() {
            IconButton({ variant: 'primary', icon: '⚙️' });
            IconButton({ variant: 'secondary', icon: '🔍' });
            IconButton({ variant: 'success', icon: '✓' });
            IconButton({ variant: 'danger', icon: '×' });
            IconButton({ variant: 'ghost', icon: '❤️' });
          },
        });
        ShowcaseDescription('图标按钮适用于工具栏和紧凑的界面场景');
      },
    });

    ShowcaseDivider();

    // 按钮状态
    ShowcaseSection({
      title: '按钮状态',
      subtitle: '正常和禁用状态',
      children() {
        ShowcaseDemo({
          children() {
            Button({ variant: 'primary', children: '正常状态' });
            Button({
              variant: 'primary',
              disabled: true,
              children: '禁用状态',
            });
            Button({ variant: 'secondary', children: '正常状态' });
            Button({
              variant: 'secondary',
              disabled: true,
              children: '禁用状态',
            });
          },
        });
        ShowcaseDescription('禁用状态的按钮会降低透明度并禁止交互');
      },
    });

    ShowcaseDivider();

    // 带图标的按钮
    ShowcaseSection({
      title: '带图标的按钮',
      subtitle: '文字和图标组合',
      children() {
        ShowcaseDemo({
          children() {
            Flex({
              gap: 'sm',
              children() {
                Button({
                  variant: 'primary',
                  children() {
                    return '🚀 启动';
                  },
                });
                Button({
                  variant: 'success',
                  children() {
                    return '✓ 保存';
                  },
                });
                Button({
                  variant: 'danger',
                  children() {
                    return '🗑️ 删除';
                  },
                });
              },
            });
          },
        });
        ShowcaseDescription('可以在按钮文字中添加 emoji 或图标字体');
      },
    });
  });
}
