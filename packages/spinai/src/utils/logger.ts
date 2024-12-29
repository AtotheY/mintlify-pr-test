type LogLevel = "debug" | "info" | "error";

interface LogOptions {
  level?: LogLevel;
  data?: unknown;
}

export function log(message: string, options: LogOptions = {}) {
  const { level = "info", data } = options;

  switch (level) {
    case "debug":
      console.log(`🔍 DEBUG: ${message}`, data || "");
      break;
    case "info":
      console.log(`ℹ️ INFO: ${message}`, data || "");
      break;
    case "error":
      console.error(`❌ ERROR: ${message}`, data || "");
      break;
  }
}
