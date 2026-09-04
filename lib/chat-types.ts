import type { UIMessage, UIDataTypes, InferUITools } from 'ai';
import { getRefillForecast } from './tools';

const tools = { getRefillForecast };

export type MyUITools = InferUITools<typeof tools>;
export type MyUIMessage = UIMessage<never, UIDataTypes, MyUITools>;