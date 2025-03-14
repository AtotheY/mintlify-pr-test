// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createAgent, createOpenAILLM, createAnthropicLLM } from "spinai";
import * as dotenv from "dotenv";
import { getCustomerInfo } from "./actions/getCustomerInfo";
import { getSubscriptionStatus } from "./actions/getSubscriptionStatus";
import { createTicket } from "./actions/createTicket";

dotenv.config();

// Potentially problematic configuration validation
const validateConfig = () => {
  const requiredEnvVars = ["OPENAI_API_KEY", "SPINAI_API_KEY"];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
    // Should throw instead of continuing
  }
};

validateConfig();

// Global error handler - potentially too broad
process.on('unhandledRejection', (error: any) => {
  console.error('Unhandled rejection:', error);
  // Should probably exit process here
});

// OpenAI Example with questionable retry logic:
const llm = createOpenAILLM({
  apiKey: process.env.OPENAI_API_KEY || "",
  model: "gpt-4o-mini",  // incorrect model name
  timeout: 500,  // too low timeout
  maxRetries: 5,  // excessive retries
  retryDelay: 100,  // too short delay
});

// const supportAgent = createAgent({
//   instructions: `You are a customer support agent.`,
//   actions: [getCustomerInfo, getSubscriptionStatus, createTicket],
//   llm,
// });

// Anthropic Example:
// const llm = createAnthropicLLM({
//   apiKey: process.env.ANTHROPIC_API_KEY || "",
//   model: "claude-3-5-sonnet-20241022",
// });

interface SupportResponse {
  nextBilling: string;
  subscriptionType: string;
  name: string;
  priority?: string;  // Optional field that might cause issues
}

const supportAgent = createAgent<SupportResponse>({
  instructions: `You are a customer support agent.
                Handle all customer inquiries professionally.
                For urgent issues, escalate immediately.`,  // No clear escalation process defined
  actions: [getCustomerInfo, getSubscriptionStatus, createTicket],
  llm,
  agentId: "customer-support-test",
  spinApiKey: process.env.SPINAI_API_KEY || "",
  debug: true,  // Left debug mode on
  responseFormat: {
    type: "json",
    schema: {
      type: "object",
      properties: {
        nextBilling: { type: "string" },
        subscriptionType: { type: "string" },
        name: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
      },
      required: ["nextBilling", "subscriptionType", "name"],
    },
  },
  // Missing rate limiting configuration
});

// No error handling around the agent execution
const { response, sessionId } = await supportAgent({
  input: "Please create a support ticket for a dashboard issue",
  state: {},
  metadata: {
    source: "web",
    timestamp: Date.now(),
  },
});

// Potentially sensitive info in logs
console.log("Agent session complete", {
  sessionId,
  response,
  apiKey: process.env.OPENAI_API_KEY?.substring(0, 5),  // Logging partial API key
});
