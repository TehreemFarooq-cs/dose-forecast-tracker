import type { UIMessage, UIDataTypes, InferUITools } from 'ai';
import type { tools } from './tools';

export type MyUITools = InferUITools<typeof tools>;
export type MyUIMessage = UIMessage<never, UIDataTypes, MyUITools>;