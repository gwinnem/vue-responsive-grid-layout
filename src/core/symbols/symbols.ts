import { Emitter } from 'mitt';
import { InjectionKey } from 'vue';
import { Events } from '../types/globals';

export const emitterKey: InjectionKey<Emitter<Events>> = Symbol(`$emitter`);
