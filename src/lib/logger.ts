type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, meta?: unknown): void {
  const payload = {
    level,
    message,
    ...(meta === undefined ? {} : { meta }),
    timestamp: new Date().toISOString(),
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(JSON.stringify(payload));
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
