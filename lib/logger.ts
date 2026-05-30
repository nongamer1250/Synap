/**
 * Synap Custom Structured Logger with Sentry Ingest Integration.
 * 
 * Works 100% on Next.js Serverless and Edge runtimes with zero cold start overhead.
 * Automatically initializes Sentry reporting if NEXT_PUBLIC_SENTRY_DSN is set,
 * otherwise falls back safely to beautiful structured console logging.
 */

interface LogContext {
  userId?: string;
  route?: string;
  latencyMs?: number;
  metadata?: Record<string, any>;
}

class StructuredLogger {
  private dsn: string | null = null;
  private sentryUrl: string | null = null;
  private sentryKey: string | null = null;

  constructor() {
    this.dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || null;
    if (this.dsn) {
      try {
        const urlObj = new URL(this.dsn);
        this.sentryKey = urlObj.username;
        const projectId = urlObj.pathname.replace('/', '');
        // Construct standard Sentry Ingest Store API endpoint
        this.sentryUrl = `https://${urlObj.host}/api/${projectId}/store/`;
      } catch (err) {
        console.error('[Logger Init] Invalid Sentry DSN URL:', err);
      }
    }
  }

  private formatMessage(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const routePart = context?.route ? ` [${context.route}]` : '';
    const userPart = context?.userId ? ` [User: ${context.userId}]` : '';
    const latencyPart = context?.latencyMs ? ` [${context.latencyMs}ms]` : '';
    const metaPart = context?.metadata ? ` | Meta: ${JSON.stringify(context.metadata)}` : '';
    return `[${level}] [${timestamp}]${routePart}${userPart}${latencyPart} - ${message}${metaPart}`;
  }

  private async reportToSentry(level: 'info' | 'warning' | 'error', message: string, errorObj?: any, context?: LogContext) {
    if (!this.sentryUrl || !this.sentryKey) return;

    try {
      const eventId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const timestamp = new Date().toISOString().split('.')[0]; // Sentry prefers ISO without ms decimals sometimes

      const payload = {
        event_id: eventId,
        timestamp,
        sdk: {
          name: 'synap-custom-logger',
          version: '1.0.0',
        },
        level,
        transaction: context?.route || 'unknown_route',
        message: {
          formatted: message,
        },
        exception: errorObj ? {
          values: [
            {
              type: errorObj.name || 'Error',
              value: errorObj.message || String(errorObj),
              stacktrace: errorObj.stack ? {
                frames: errorObj.stack.split('\n').map((line: string) => ({
                  filename: line.trim(),
                  function: line.includes('at ') ? line.split('at ')[1]?.split(' ')[0] : 'unknown',
                })).reverse(),
              } : undefined,
            },
          ],
        } : undefined,
        user: context?.userId ? {
          id: context.userId,
        } : undefined,
        tags: {
          route: context?.route || 'unknown',
          latency: context?.latencyMs ? `${context.latencyMs}ms` : undefined,
          ...(context?.metadata || {}),
        },
      };

      // Asynchronously trigger fetch report to Sentry to preserve route response latency
      fetch(this.sentryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${this.sentryKey}, sentry_client=synap-custom-logger/1.0.0`,
        },
        body: JSON.stringify(payload),
      }).catch((fetchErr) => {
        // Suppress circular errors, fall back to silent trace
        console.warn('[Logger Telemetry] Sentry delivery failed:', fetchErr.message);
      });
    } catch (telemetryErr: any) {
      console.warn('[Logger Telemetry] Report assembly failed:', telemetryErr.message);
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('INFO', message, context));
    this.reportToSentry('info', message, undefined, context);
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context));
    this.reportToSentry('warning', message, undefined, context);
  }

  error(message: string, errorObj?: any, context?: LogContext) {
    console.error(this.formatMessage('ERROR', message, context));
    if (errorObj) {
      console.error(errorObj);
    }
    this.reportToSentry('error', message, errorObj, context);
  }
}

export const logger = new StructuredLogger();
