import { webln } from "@getalby/sdk";

/**
 * Production-grade NWC Wallet Manager
 * Handles Nostr Wallet Connect initialization and operations
 */

export interface WalletConfig {
  nwcUrl: string;
  timeout?: number;
  maxRetries?: number;
  debug?: boolean;
}

export interface PaymentResult {
  preimage: string;
  relays: string[];
  timestamp: number;
  success: boolean;
}

export interface WalletInfo {
  alias: string;
  color: string;
  pubkey: string;
  balance?: number;
  maxReceivable?: number;
  maxSendable?: number;
}

export interface InvoiceDetails {
  amount: number;
  description: string;
  paymentHash: string;
  timestamp: number;
  expiresAt: number;
  isExpired: boolean;
}

class NWCWallet {
  private nwc: any = null;
  private config: WalletConfig;
  private isConnected: boolean = false;
  private walletInfo: WalletInfo | null = null;
  private connectionRetries: number = 0;

  constructor(config: WalletConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      debug: false,
      ...config,
    };
    this.validateConfig();
  }

  /**
   * Validate wallet configuration
   */
  private validateConfig(): void {
    if (!this.config.nwcUrl) {
      throw new Error("NWC URL is required");
    }

    if (!this.config.nwcUrl.startsWith("nostr+walletconnect://")) {
      throw new Error(
        'Invalid NWC URL format. Must start with "nostr+walletconnect://"'
      );
    }
  }

  /**
   * Log debug messages
   */
  private debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[NWC Wallet] ${message}`, data || "");
    }
  }

  /**
   * Connect to wallet with retry logic
   */
  async connect(): Promise<boolean> {
    try {
      this.debug("Attempting to connect to NWC wallet...");

      // Initialize NWC provider
      this.nwc = new webln.NWC({
        nostrWalletConnectUrl: this.config.nwcUrl,
      });

      // Enable wallet connection
      await Promise.race([
        this.nwc.enable(),
        this.createTimeout(this.config.timeout!),
      ]);

      // Verify connection by fetching wallet info
      const info = await this.fetchWalletInfo();
      this.walletInfo = info;
      this.isConnected = true;
      this.connectionRetries = 0;

      this.debug("Successfully connected to wallet", {
        alias: info.alias,
        pubkey: info.pubkey,
      });

      return true;
    } catch (error) {
      this.isConnected = false;
      this.connectionRetries++;

      if (this.connectionRetries < this.config.maxRetries!) {
        this.debug(
          `Connection failed, retrying... (${this.connectionRetries}/${this.config.maxRetries})`
        );
        await this.delay(1000 * this.connectionRetries); // Exponential backoff
        return this.connect();
      }

      throw this.handleError("Failed to connect to wallet", error);
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    try {
      if (this.nwc) {
        this.nwc = null;
        this.isConnected = false;
        this.walletInfo = null;
        this.connectionRetries = 0;
        this.debug("Disconnected from wallet");
      }
    } catch (error) {
      throw this.handleError("Failed to disconnect wallet", error);
    }
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.isConnected && this.nwc !== null;
  }

  /**
   * Fetch wallet information
   */
  private async fetchWalletInfo(): Promise<WalletInfo> {
    if (!this.nwc) {
      throw new Error("Wallet not connected");
    }

    try {
      this.debug("Fetching wallet information...");

      const info = await Promise.race([
        this.nwc.getInfo(),
        this.createTimeout(this.config.timeout!),
      ]);

      return {
        alias: info.alias || "Unknown Wallet",
        color: info.color || "#000000",
        pubkey: info.pubkey || "",
        balance: info.balance,
        maxReceivable: info.maxReceivable,
        maxSendable: info.maxSendable,
      };
    } catch (error) {
      throw this.handleError("Failed to fetch wallet information", error);
    }
  }

  /**
   * Get current wallet info
   */
  async getWalletInfo(): Promise<WalletInfo> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet not connected. Call connect() first.");
    }

    try {
      this.walletInfo = await this.fetchWalletInfo();
      return this.walletInfo;
    } catch (error) {
      throw this.handleError("Failed to get wallet info", error);
    }
  }

  /**
   * Validate and parse invoice
   */
  private validateInvoice(invoice: string): boolean {
    // Check if invoice starts with lnbc (mainnet) or lntbs (testnet)
    if (!invoice.match(/^lnbc|^lntbs/i)) {
      throw new Error(
        'Invalid invoice format. Must start with "lnbc" (mainnet) or "lntbs" (testnet)'
      );
    }

    // Check length (invoices are usually 100+ characters)
    if (invoice.length < 50) {
      throw new Error("Invoice too short. Check if copied completely.");
    }

    // Check for common mistakes
    if (invoice.includes(" ")) {
      throw new Error("Invoice contains spaces. Please remove them.");
    }

    if (invoice !== invoice.toLowerCase()) {
      throw new Error("Invoice contains uppercase letters. Must be lowercase.");
    }

    return true;
  }

  /**
   * Send payment with comprehensive error handling and retry logic
   */
  async sendPayment(invoice: string, retries: number = 0): Promise<PaymentResult> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet not connected. Call connect() first.");
    }

    try {
      // Validate invoice
      this.validateInvoice(invoice);

      this.debug("Sending payment...", { invoice: invoice.substring(0, 20) + "..." });

      const response = await Promise.race([
        this.nwc.sendPayment(invoice),
        this.createTimeout(this.config.timeout!),
      ]);

      const result: PaymentResult = {
        preimage: response.preimage || "",
        relays: response.relays || [],
        timestamp: Date.now(),
        success: !!response.preimage,
      };

      if (!result.success) {
        throw new Error("Payment failed: No preimage returned");
      }

      this.debug("Payment successful", {
        preimage: result.preimage.substring(0, 10) + "...",
      });

      return result;
    } catch (error) {
      // Retry logic for transient failures
      if (
        retries < this.config.maxRetries! &&
        this.isTransientError(error)
      ) {
        this.debug(
          `Payment failed transiently, retrying... (${retries + 1}/${this.config.maxRetries})`
        );
        await this.delay(2000 * (retries + 1)); // Exponential backoff
        return this.sendPayment(invoice, retries + 1);
      }

      throw this.handleError("Payment failed", error);
    }
  }

  /**
   * Send multiple payments in sequence
   */
  async sendBatchPayments(
    invoices: string[],
    onProgress?: (index: number, total: number, result: PaymentResult) => void
  ): Promise<PaymentResult[]> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet not connected. Call connect() first.");
    }

    const results: PaymentResult[] = [];

    for (let i = 0; i < invoices.length; i++) {
      try {
        const result = await this.sendPayment(invoices[i]);
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, invoices.length, result);
        }

        // Add delay between payments to avoid rate limiting
        if (i < invoices.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        this.debug(`Failed to send payment ${i + 1}/${invoices.length}`, error);
        // Continue with next payment instead of failing entirely
        results.push({
          preimage: "",
          relays: [],
          timestamp: Date.now(),
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * Decode invoice to get payment details
   */
  private decodeInvoice(invoice: string): InvoiceDetails {
    try {
      // Basic invoice parsing (this is simplified)
      // For production, use a proper bolt11 decoder library
      const match = invoice.match(/lnbc(\d+)(m|u|n|p)?/);

      if (!match) {
        throw new Error("Unable to parse invoice amount");
      }

      const amount = parseInt(match[1]);
      const unit = match[2] || "s";

      // Convert to satoshis
      const satoshis = this.convertToSatoshis(amount, unit);

      return {
        amount: satoshis,
        description: "",
        paymentHash: invoice.substring(0, 20),
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000, // Default 1 hour
        isExpired: false,
      };
    } catch (error) {
      throw this.handleError("Failed to decode invoice", error);
    }
  }

  /**
   * Convert amount to satoshis based on unit
   */
  private convertToSatoshis(amount: number, unit: string): number {
    const multipliers: { [key: string]: number } = {
      p: 0.0001, // pico-BTC
      n: 0.001, // nano-BTC
      u: 0.01, // micro-BTC
      m: 0.00001, // milli-BTC
      s: 0.00000001, // satoshi
      "": 0.00000001, // satoshi (default)
    };

    const multiplier = multipliers[unit] || 0.00000001;
    return Math.round(amount * multiplier * 100000000);
  }

  /**
   * Check if error is transient (can be retried)
   */
  private isTransientError(error: any): boolean {
    const transientErrors = [
      "timeout",
      "ECONNREFUSED",
      "ECONNRESET",
      "ETIMEDOUT",
      "temporarily",
      "temporarily unavailable",
      "network",
      "relay",
      "connection",
    ];

    const errorStr = (error?.message || "").toLowerCase();
    return transientErrors.some((msg) => errorStr.includes(msg));
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle and format errors
   */
  private handleError(message: string, error: any): Error {
    const errorMessage = error?.message || String(error);
    const fullMessage = `${message}: ${errorMessage}`;

    this.debug("Error occurred", {
      message: fullMessage,
      error: error,
    });

    return new Error(fullMessage);
  }

  /**
   * Get detailed wallet status
   */
  async getWalletStatus(): Promise<{
    connected: boolean;
    walletInfo: WalletInfo | null;
    lastUpdated: number;
  }> {
    return {
      connected: this.isWalletConnected(),
      walletInfo: this.walletInfo,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Factory function to create wallet instance
 */
export function createNWCWallet(config: WalletConfig): NWCWallet {
  return new NWCWallet(config);
}

/**
 * Simple usage example
 */
export async function exampleUsage() {
  // Initialize wallet
  const wallet = createNWCWallet({
    nwcUrl: process.env.VITE_NWC_URL || "",
    timeout: 30000,
    maxRetries: 3,
    debug: true,
  });

  try {
    // Connect
    await wallet.connect();
    console.log("✓ Connected to wallet");

    // Get wallet info
    const info = await wallet.getWalletInfo();
    console.log("Wallet Info:", info);

    // Send payment (replace with actual invoice)
    const invoice = "lnbc1000n1p3x3v3pp5..."; // Example invoice
    const result = await wallet.sendPayment(invoice);
    console.log("Payment Result:", result);

    // Disconnect
    await wallet.disconnect();
    console.log("✓ Disconnected");
  } catch (error) {
    console.error("Error:", error);
  }
}

export default NWCWallet;
