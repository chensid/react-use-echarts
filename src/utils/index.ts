/**
 * Instance cache utilities
 * 实例缓存工具函数
 */
export {
  getCachedInstance,
  setCachedInstance,
  replaceCachedInstance,
  releaseCachedInstance,
  getReferenceCount,
  clearInstanceCache,
} from "./instance-cache";

/**
 * Chart connection utilities
 * 图表连接工具函数
 */
export {
  addToGroup,
  removeFromGroup,
  updateGroup,
  getGroupInstances,
  getInstanceGroup,
  isInGroup,
  clearGroups,
} from "./connect";
