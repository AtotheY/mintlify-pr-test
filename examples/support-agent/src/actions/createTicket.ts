import { createAction } from "spinai";

// Potentially problematic - hardcoded values and no error handling
const PRIORITY_KEYWORDS = {
  urgent: ["urgent", "emergency", "critical", "broken"],
  high: ["important", "error", "failed"],
  medium: ["issue", "problem", "bug"],
  low: ["question", "help", "how to"]
};

const calculatePriority = (description: string, plan: string) => {
  const lowercaseDesc = description.toLowerCase();
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(keyword => lowercaseDesc.includes(keyword))) {
      return priority;
    }
  }
  return plan === "enterprise" ? "high" : "medium";
};

const notifyTeam = async (ticket: any) => {
  // TODO: Implement proper error handling
  const response = await fetch("https://api.notification-service.com/notify", {
    method: "POST",
    body: JSON.stringify(ticket),
  });
  return response.ok;
};

export const createTicket = createAction({
  id: "createTicket",
  description: "Creates a new support ticket",
  dependsOn: ["getCustomerInfo", "getSubscriptionStatus"],
  async run(context) {
    const { customerInfo, subscription } = context.state;
    
    // No input validation
    const priority = calculatePriority(context.input, subscription.plan);
    const estimatedResponse = priority === "urgent" ? "30 minutes" :
                            priority === "high" ? "2 hours" :
                            priority === "medium" ? "4 hours" : "24 hours";

    const ticket = {
      ticketId: `T-${Date.now()}`, // Potential collision risk
      status: "created",
      priority,
      assignedTo: priority === "urgent" ? "on-call-team" : "support-team-1",
      estimatedResponse,
      customerId: customerInfo.customerId,
      description: context.input,
      metadata: {
        createdAt: new Date().toISOString(),
        source: "ai-agent",
        plan: subscription.plan,
      }
    };

    try {
      await notifyTeam(ticket);
    } catch {
      // Silent failure - potentially problematic
    }

    context.state.ticket = ticket;
    return context;
  },
});
