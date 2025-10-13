import { fdom } from 'mve-dom';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { ReactiveUpdateFlow } from './components/ReactiveUpdateFlow';
import { LifecycleAnimation } from './components/LifecycleAnimation';
import { DataFlowDiagram } from './components/DataFlowDiagram';
import { DomApiComparison } from './components/DomApiComparison';
import { SignalSystemDiagram } from './components/SignalSystemDiagram';
import { MemoLifecycleDiagram } from './components/MemoLifecycleDiagram';
import { BatchSignalEndFlow } from './components/BatchSignalEndFlow';

export default function DiagramPage() {
  // 主页面渲染
  fdom.div({
    className: 'max-w-6xl mx-auto p-8',
    children() {
      // 页面标题
      fdom.h1({
        className: 'text-4xl font-bold text-center mb-12 text-gray-800',
        children: 'MVE 框架架构图表',
      });

      // 各个图表组件
      ArchitectureDiagram();
      DataFlowDiagram();
      LifecycleAnimation();
      MemoLifecycleDiagram();
      BatchSignalEndFlow();
      ReactiveUpdateFlow();
      DomApiComparison();
      SignalSystemDiagram();
    },
  });
}
