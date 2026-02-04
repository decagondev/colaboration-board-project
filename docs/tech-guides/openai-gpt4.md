# OpenAI GPT-4 Function Calling Guide for Tool Integration (2026)

GPT-4 powers the AI agent in CollabBoard, enabling natural language commands for board manipulation, template creation, and intelligent assistance. Function calling allows the model to execute structured operations like creating SWOT templates, generating diagrams, or organizing content.

## Table of Contents

- [Key Concepts](#key-concepts)
- [Setup and Configuration](#setup-and-configuration)
- [Defining Function Tools](#defining-function-tools)
- [Implementing the Conversation Loop](#implementing-the-conversation-loop)
- [CollabBoard Tool Implementations](#collabboard-tool-implementations)
- [Advanced Patterns](#advanced-patterns)
- [Error Handling and Safety](#error-handling-and-safety)
- [Integration with CollabBoard Stack](#integration-with-collabboard-stack)
- [Resources](#resources)

---

## Key Concepts

### How Function Calling Works

Function calling enables GPT-4 to:

1. **Understand intent**: Parse natural language commands into structured actions
2. **Select tools**: Choose appropriate functions from a defined set
3. **Generate arguments**: Produce valid JSON arguments based on schemas
4. **Execute and respond**: Process results and continue the conversation

```
User: "Create a SWOT analysis template in the center of the board"
          ↓
GPT-4 analyzes intent and available tools
          ↓
Model calls: createTemplate({ type: "swot", position: { x: 0, y: 0 } })
          ↓
Application executes function, returns result
          ↓
GPT-4 generates human-readable response: "I've created a SWOT analysis template..."
```

### Function Calling vs Prompting

| Approach | Use Case | Reliability |
|----------|----------|-------------|
| Function Calling | Structured actions (create, move, delete) | High - enforced schema |
| Prompting | Free-form responses, explanations | Medium - may vary |
| Hybrid | Complex workflows with explanations | Best of both |

---

## Setup and Configuration

### Step 1: Install OpenAI SDK

```bash
npm install openai
```

### Step 2: Initialize Client

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { openai };
```

### Step 3: Environment Configuration

For Netlify serverless functions:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_ORG_ID=org-your-org-id
```

**Security Note**: Never expose API keys to the client. Always proxy through serverless functions.

---

## Defining Function Tools

### Tool Schema Structure

```typescript
import { ChatCompletionTool } from 'openai/resources/chat';

/**
 * Define tools available to the AI agent.
 * Each tool has a name, description, and parameter schema.
 */
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createTemplate',
      description: 'Creates a pre-defined template on the board (SWOT, Kanban, Mind Map, etc.)',
      parameters: {
        type: 'object',
        properties: {
          templateType: {
            type: 'string',
            enum: ['swot', 'kanban', 'mindmap', 'flowchart', 'timeline', 'brainstorm'],
            description: 'The type of template to create',
          },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X coordinate on the canvas' },
              y: { type: 'number', description: 'Y coordinate on the canvas' },
            },
            required: ['x', 'y'],
          },
          title: {
            type: 'string',
            description: 'Optional custom title for the template',
          },
        },
        required: ['templateType', 'position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createStickyNote',
      description: 'Creates a new sticky note on the board',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Text content for the sticky note',
          },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
          color: {
            type: 'string',
            enum: ['yellow', 'orange', 'green', 'blue', 'pink'],
            description: 'Color of the sticky note',
          },
        },
        required: ['content', 'position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'moveObjects',
      description: 'Moves one or more objects to a new position',
      parameters: {
        type: 'object',
        properties: {
          objectIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of objects to move',
          },
          targetPosition: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
          arrangement: {
            type: 'string',
            enum: ['stack', 'row', 'column', 'grid'],
            description: 'How to arrange multiple objects at the target',
          },
        },
        required: ['objectIds', 'targetPosition'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchBoard',
      description: 'Search for objects on the board by content or type',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Text to search for in object content',
          },
          objectType: {
            type: 'string',
            enum: ['sticky', 'shape', 'text', 'image', 'all'],
            description: 'Type of objects to search',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'organizeObjects',
      description: 'Automatically organize selected objects into a layout',
      parameters: {
        type: 'object',
        properties: {
          objectIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of objects to organize (empty for all)',
          },
          layout: {
            type: 'string',
            enum: ['grid', 'cluster', 'timeline', 'hierarchy'],
            description: 'Layout algorithm to apply',
          },
          groupBy: {
            type: 'string',
            description: 'Property to group objects by (e.g., "color", "type")',
          },
        },
        required: ['layout'],
      },
    },
  },
];

export { tools };
```

---

## Implementing the Conversation Loop

### Basic Function Calling Flow

```typescript
import OpenAI from 'openai';
import { tools } from './tools';
import { executeTool } from './toolExecutor';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: OpenAI.Chat.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
}

/**
 * Process a user message and execute any required tool calls.
 * Handles the complete conversation loop including multi-turn tool execution.
 *
 * @param userMessage - The user's natural language command
 * @param conversationHistory - Previous messages for context
 * @param boardContext - Current state of the board for context
 * @returns Assistant's response and any actions taken
 */
async function processAICommand(
  userMessage: string,
  conversationHistory: Message[],
  boardContext: BoardContext
): Promise<{ response: string; actions: ToolAction[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const actions: ToolAction[] = [];

  const systemMessage: Message = {
    role: 'system',
    content: `You are an AI assistant for CollabBoard, a collaborative whiteboard application.
You help users create and organize content on their boards using natural language commands.

Current board context:
- Board name: ${boardContext.boardName}
- Number of objects: ${boardContext.objectCount}
- Viewport center: (${boardContext.viewportCenter.x}, ${boardContext.viewportCenter.y})
- Selected objects: ${boardContext.selectedIds.length > 0 ? boardContext.selectedIds.join(', ') : 'none'}

When users ask to create templates or objects, use the appropriate tools.
When positioning objects, use coordinates relative to the viewport center unless specified.
Be helpful and concise in your responses.`,
  };

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    systemMessage,
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  let response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: 'auto',
  });

  let assistantMessage = response.choices[0].message;

  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const result = await executeTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        boardContext
      );

      actions.push({
        toolName: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
        result,
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      tool_choice: 'auto',
    });

    assistantMessage = response.choices[0].message;
  }

  return {
    response: assistantMessage.content || 'Action completed.',
    actions,
  };
}
```

### Parallel Tool Calls

GPT-4 can call multiple tools in parallel when appropriate:

```typescript
/**
 * Handle parallel tool calls efficiently.
 * Executes independent tool calls concurrently.
 *
 * @param toolCalls - Array of tool calls from the model
 * @param boardContext - Current board state
 * @returns Array of tool results
 */
async function executeToolCallsParallel(
  toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[],
  boardContext: BoardContext
): Promise<ToolResult[]> {
  const toolPromises = toolCalls.map(async (toolCall) => {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await executeTool(toolCall.function.name, args, boardContext);
    
    return {
      tool_call_id: toolCall.id,
      result,
    };
  });

  return Promise.all(toolPromises);
}
```

---

## CollabBoard Tool Implementations

### Template Creation

```typescript
interface TemplateConfig {
  type: string;
  position: { x: number; y: number };
  title?: string;
}

/**
 * Create a SWOT analysis template with four quadrants.
 *
 * @param config - Template configuration
 * @param boardContext - Current board state
 * @returns Created object IDs
 */
async function createSWOTTemplate(
  config: TemplateConfig,
  boardContext: BoardContext
): Promise<{ objectIds: string[] }> {
  const { position, title = 'SWOT Analysis' } = config;
  const quadrantSize = 200;
  const gap = 10;

  const quadrants = [
    { label: 'Strengths', color: '#bbf7d0', offsetX: 0, offsetY: 0 },
    { label: 'Weaknesses', color: '#fecaca', offsetX: quadrantSize + gap, offsetY: 0 },
    { label: 'Opportunities', color: '#bfdbfe', offsetX: 0, offsetY: quadrantSize + gap },
    { label: 'Threats', color: '#fed7aa', offsetX: quadrantSize + gap, offsetY: quadrantSize + gap },
  ];

  const objectIds: string[] = [];

  const titleId = await createTextObject({
    content: title,
    position: { x: position.x, y: position.y - 40 },
    fontSize: 24,
    fontWeight: 'bold',
  }, boardContext);
  objectIds.push(titleId);

  for (const quadrant of quadrants) {
    const rectId = await createRectObject({
      position: { x: position.x + quadrant.offsetX, y: position.y + quadrant.offsetY },
      width: quadrantSize,
      height: quadrantSize,
      fill: quadrant.color,
      stroke: '#e5e7eb',
    }, boardContext);
    objectIds.push(rectId);

    const labelId = await createTextObject({
      content: quadrant.label,
      position: { 
        x: position.x + quadrant.offsetX + 10, 
        y: position.y + quadrant.offsetY + 10 
      },
      fontSize: 16,
      fontWeight: 'bold',
    }, boardContext);
    objectIds.push(labelId);
  }

  return { objectIds };
}

/**
 * Create a Kanban board template with columns.
 *
 * @param config - Template configuration
 * @param boardContext - Current board state
 * @returns Created object IDs
 */
async function createKanbanTemplate(
  config: TemplateConfig,
  boardContext: BoardContext
): Promise<{ objectIds: string[] }> {
  const { position, title = 'Kanban Board' } = config;
  const columnWidth = 250;
  const columnHeight = 400;
  const gap = 20;

  const columns = [
    { label: 'To Do', color: '#f3f4f6' },
    { label: 'In Progress', color: '#fef3c7' },
    { label: 'Review', color: '#dbeafe' },
    { label: 'Done', color: '#d1fae5' },
  ];

  const objectIds: string[] = [];

  const titleId = await createTextObject({
    content: title,
    position: { x: position.x, y: position.y - 50 },
    fontSize: 28,
    fontWeight: 'bold',
  }, boardContext);
  objectIds.push(titleId);

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const offsetX = i * (columnWidth + gap);

    const columnId = await createRectObject({
      position: { x: position.x + offsetX, y: position.y },
      width: columnWidth,
      height: columnHeight,
      fill: column.color,
      cornerRadius: 8,
    }, boardContext);
    objectIds.push(columnId);

    const headerBgId = await createRectObject({
      position: { x: position.x + offsetX, y: position.y },
      width: columnWidth,
      height: 50,
      fill: column.color,
      cornerRadius: [8, 8, 0, 0],
    }, boardContext);
    objectIds.push(headerBgId);

    const labelId = await createTextObject({
      content: column.label,
      position: { x: position.x + offsetX + 15, y: position.y + 15 },
      fontSize: 18,
      fontWeight: 'bold',
    }, boardContext);
    objectIds.push(labelId);
  }

  return { objectIds };
}
```

### Tool Executor

```typescript
type ToolFunction = (args: any, context: BoardContext) => Promise<any>;

const toolImplementations: Record<string, ToolFunction> = {
  createTemplate: async (args, context) => {
    switch (args.templateType) {
      case 'swot':
        return createSWOTTemplate(args, context);
      case 'kanban':
        return createKanbanTemplate(args, context);
      case 'mindmap':
        return createMindMapTemplate(args, context);
      default:
        throw new Error(`Unknown template type: ${args.templateType}`);
    }
  },

  createStickyNote: async (args, context) => {
    const id = await createStickyObject({
      content: args.content,
      position: args.position,
      color: args.color || 'yellow',
    }, context);
    return { objectId: id, success: true };
  },

  moveObjects: async (args, context) => {
    await moveObjectsToPosition(
      args.objectIds,
      args.targetPosition,
      args.arrangement || 'stack',
      context
    );
    return { success: true, movedCount: args.objectIds.length };
  },

  searchBoard: async (args, context) => {
    const results = await searchBoardObjects(
      args.query,
      args.objectType || 'all',
      context
    );
    return { results, count: results.length };
  },

  organizeObjects: async (args, context) => {
    const objectIds = args.objectIds?.length > 0 
      ? args.objectIds 
      : context.allObjectIds;
    
    await applyLayout(objectIds, args.layout, args.groupBy, context);
    return { success: true, organizedCount: objectIds.length };
  },
};

/**
 * Execute a tool by name with given arguments.
 *
 * @param toolName - Name of the tool to execute
 * @param args - Arguments for the tool
 * @param context - Current board context
 * @returns Tool execution result
 */
async function executeTool(
  toolName: string,
  args: any,
  context: BoardContext
): Promise<any> {
  const implementation = toolImplementations[toolName];
  
  if (!implementation) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return implementation(args, context);
}

export { executeTool };
```

---

## Advanced Patterns

### Streaming Responses

```typescript
import OpenAI from 'openai';

/**
 * Stream AI responses for better UX on longer outputs.
 * Yields chunks as they arrive.
 *
 * @param messages - Conversation messages
 * @param onChunk - Callback for each text chunk
 */
async function streamResponse(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      onChunk(content);
    }
  }
}
```

### Conversation Memory

```typescript
interface ConversationMemory {
  messages: Message[];
  maxMessages: number;
  summarize: () => Promise<string>;
}

/**
 * Manage conversation history with automatic summarization.
 * Prevents context window overflow.
 */
class ConversationManager implements ConversationMemory {
  messages: Message[] = [];
  maxMessages = 20;

  addMessage(message: Message) {
    this.messages.push(message);
    
    if (this.messages.length > this.maxMessages) {
      this.pruneHistory();
    }
  }

  private async pruneHistory() {
    const oldMessages = this.messages.slice(0, 10);
    const summary = await this.summarize();
    
    this.messages = [
      { role: 'system', content: `Previous conversation summary: ${summary}` },
      ...this.messages.slice(10),
    ];
  }

  async summarize(): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Summarize this conversation briefly.' },
        ...this.messages.slice(0, 10),
      ],
    });

    return response.choices[0].message.content || '';
  }
}
```

### Multi-Step Planning

```typescript
/**
 * Have the model create and execute a multi-step plan for complex requests.
 *
 * @param request - Complex user request
 * @param context - Board context
 * @returns Execution results
 */
async function executeComplexRequest(
  request: string,
  context: BoardContext
): Promise<ExecutionResult> {
  const planResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a planning assistant. Break down complex requests into step-by-step plans.
Output a JSON array of steps, each with: { "action": string, "description": string, "dependencies": number[] }`,
      },
      { role: 'user', content: request },
    ],
    response_format: { type: 'json_object' },
  });

  const plan = JSON.parse(planResponse.choices[0].message.content || '{}');
  const results: StepResult[] = [];

  for (const step of plan.steps) {
    const canExecute = step.dependencies.every(
      (dep: number) => results[dep]?.success
    );

    if (canExecute) {
      const result = await executeStep(step, context);
      results.push(result);
    } else {
      results.push({ success: false, error: 'Dependencies not met' });
    }
  }

  return { plan, results };
}
```

---

## Error Handling and Safety

### Input Validation

```typescript
import { z } from 'zod';

const CreateTemplateSchema = z.object({
  templateType: z.enum(['swot', 'kanban', 'mindmap', 'flowchart', 'timeline', 'brainstorm']),
  position: z.object({
    x: z.number().min(-10000).max(10000),
    y: z.number().min(-10000).max(10000),
  }),
  title: z.string().max(100).optional(),
});

/**
 * Validate tool arguments before execution.
 *
 * @param toolName - Name of the tool
 * @param args - Arguments to validate
 * @returns Validated arguments
 * @throws ZodError if validation fails
 */
function validateToolArgs(toolName: string, args: unknown): any {
  const schemas: Record<string, z.ZodSchema> = {
    createTemplate: CreateTemplateSchema,
  };

  const schema = schemas[toolName];
  if (schema) {
    return schema.parse(args);
  }

  return args;
}
```

### Rate Limiting

```typescript
interface RateLimiter {
  canMakeRequest: () => boolean;
  recordRequest: () => void;
}

/**
 * Simple rate limiter for API calls.
 * Prevents excessive API usage.
 */
class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxTokens = 10, refillPerSecond = 1) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillPerSecond;
    this.lastRefill = Date.now();
  }

  canMakeRequest(): boolean {
    this.refill();
    return this.tokens > 0;
  }

  recordRequest(): void {
    this.tokens = Math.max(0, this.tokens - 1);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

### Content Moderation

```typescript
/**
 * Check user input for potentially harmful content before processing.
 *
 * @param content - User input to check
 * @returns True if content is safe
 */
async function moderateContent(content: string): Promise<boolean> {
  const response = await openai.moderations.create({
    input: content,
  });

  const result = response.results[0];
  return !result.flagged;
}
```

---

## Integration with CollabBoard Stack

### Netlify Function Proxy

```typescript
import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { tools } from '../../src/ai/tools';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { message, conversationHistory, boardContext } = JSON.parse(event.body || '{}');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: getSystemPrompt(boardContext) },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      tools,
      tool_choice: 'auto',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response.choices[0].message),
    };
  } catch (error) {
    console.error('AI proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AI request failed' }),
    };
  }
};
```

### React Command Bar

```tsx
import { useState, useCallback } from 'react';
import { useBoardContext } from '../contexts/BoardContext';

/**
 * AI command bar component for natural language board control.
 */
export function AICommandBar() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const { boardContext, executeActions } = useBoardContext();

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setResponse(null);

    try {
      const result = await fetch('/.netlify/functions/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: [],
          boardContext,
        }),
      }).then((r) => r.json());

      if (result.tool_calls) {
        await executeActions(result.tool_calls);
      }

      setResponse(result.content);
      setInput('');
    } catch (error) {
      setResponse('Sorry, something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, boardContext, executeActions]);

  return (
    <div className="ai-command-bar">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Ask AI to help with your board..."
        disabled={isProcessing}
      />
      <button onClick={handleSubmit} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Send'}
      </button>
      {response && <div className="ai-response">{response}</div>}
    </div>
  );
}
```

---

## Resources

### Official Documentation
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Chat Completions API Reference](https://platform.openai.com/docs/api-reference/chat)
- [Moderation API](https://platform.openai.com/docs/guides/moderation)

### Tutorials and Examples
- [Function Calling Tutorial](https://blog.mlq.ai/gpt-function-calling-getting-started)
- [Building AI Agents](https://platform.openai.com/docs/guides/agents)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

### Related CollabBoard Guides
- [React Guide](./react.md) - Frontend integration
- [Netlify Guide](./netlify.md) - Serverless function deployment
- [tRPC Guide](./trpc.md) - Type-safe API layer
