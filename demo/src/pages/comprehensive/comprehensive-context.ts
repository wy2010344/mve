import { createContext } from "mve-core";
import { GetValue } from "wy-helper";

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  assignee: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

const comprehensiveContext = createContext<{
  getUserData: GetValue<any>;
  userLoading: GetValue<boolean>;
  getTasksData: GetValue<any>;
  tasksLoading: GetValue<boolean>;
  getTasks: () => Task[];
  updateTaskStatus: (taskId: number, newStatus: Task["status"]) => void;
  taskStats: () => {
    total: number;
    todo: number;
    doing: number;
    done: number;
    highPriority: number;
  };
}>(undefined!)

export default comprehensiveContext