/* eslint-disable */
import { ComponentInternalInstance, getCurrentInstance } from 'vue';

export default function useCurrentInstance(): any {
  const { appContext, proxy } = getCurrentInstance() as ComponentInternalInstance;

  const { globalProperties } = appContext.config;

  return {
    appContext,
    globalProperties,
    proxy,
  };
}
