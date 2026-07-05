import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertingService } from './alerting.service';

/**
 * Payload emitted when an authentication attempt fails.
 */
interface AuthFailedPayload {
  /** The email address used in the failed login attempt */
  email: string;
  /** Optional IP address of the requester */
  ip?: string;
  /** ISO 8601 timestamp of the event */
  timestamp: string;
}

/**
 * Payload emitted when an escrow payment is initiated.
 */
interface EscrowInitiatedPayload {
  /** The unique identifier of the escrow transaction */
  escrowId: string;
  /** The user ID of the client initiating the payment */
  clientId: string;
  /** The gross amount of the transaction */
  grossAmount: number;
  /** The currency code (e.g., ETB, USD) */
  currency: string;
  /** ISO 8601 timestamp of the event */
  timestamp: string;
}

/**
 * AnomalySensorService - Core anomaly detection engine.
 * Listens to platform events and applies detection rules to identify
 * suspicious activities such as brute-force attacks and unusual payments.
 */
@Injectable()
export class AnomalySensorService {
  private readonly logger = new Logger(AnomalySensorService.name);

  /**
   * In-memory sliding window for tracking authentication failures.
   * Maps email address to an array of failure timestamps (epoch ms).
   * Entries older than 5 minutes are automatically pruned on each check.
   */
  private authFailures: Map<string, number[]> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertingService: AlertingService,
  ) {}

  /**
   * Listens to failed authentication attempts to detect brute-force
   * or credential stuffing attacks.
   *
   * Detection Rule: If more than 5 failed login attempts occur for
   * the same email within a 5-minute sliding window, an alert is triggered.
   *
   * @param payload - The authentication failure event data
   */
  @OnEvent('auth.login.failed')
  async handleAuthFailed(payload: AuthFailedPayload): Promise<void> {
    const { email } = payload;
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // Retrieve existing failures and prune entries outside the window
    let failures = this.authFailures.get(email) || [];
    failures = failures.filter((time) => time > fiveMinutesAgo);
    failures.push(now);
    this.authFailures.set(email, failures);

    if (failures.length > 5) {
      this.logger.warn(`Auth anomaly detected for email: ${email}`);
      await this.alertingService.dispatchAlert({
        title: 'Authentication Brute Force Attempt',
        message: `Multiple failed login attempts (${failures.length}) detected for ${email} within 5 minutes.`,
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
      });

      // Reset to avoid spamming alerts for the same burst
      this.authFailures.set(email, []);
    }
  }
}
