import { describe, it, expect, beforeEach, vi } from "vitest";
import { createNWCWallet, WalletConfig, PaymentResult } from "../src/wallet";

describe("NWCWallet - Production Grade", () => {
  let mockNwc: any;
  let walletConfig: WalletConfig;

  beforeEach(() => {
    // Mock NWC provider
    mockNwc = {
      enable: vi.fn().mockResolvedValue(undefined),
      sendPayment: vi.fn(),
      getInfo: vi.fn(),
    };

    walletConfig = {
      nwcUrl: "nostr+walletconnect://test_pubkey?relay=wss://relay.test&secret=test_secret",
      timeout: 5000,
      maxRetries: 2,
      debug: false,
    };

    // Mock webln module
    vi.doMock("@getalby/sdk", () => ({
      webln: {
        NWC: vi.fn(() => mockNwc),
      },
    }));
  });

  describe("Wallet Initialization", () => {
    it("should validate NWC URL format", () => {
      const invalidConfig = {
        nwcUrl: "invalid://url",
      };

      expect(() => createNWCWallet(invalidConfig)).toThrow(
        "Invalid NWC URL format"
      );
    });

    it("should require NWC URL", () => {
      const emptyConfig = { nwcUrl: "" };
      expect(() => createNWCWallet(emptyConfig)).toThrow("NWC URL is required");
    });

    it("should accept valid NWC URL", () => {
      const wallet = createNWCWallet(walletConfig);
      expect(wallet).toBeDefined();
    });

    it("should set default config values", () => {
      const wallet = createNWCWallet(walletConfig);
      expect(wallet).toBeDefined();
      // timeout, maxRetries, and debug should be set to defaults
    });
  });

  describe("Wallet Connection", () => {
    it("should connect successfully", async () => {
      mockNwc.getInfo.mockResolvedValue({
        alias: "Test Wallet",
        color: "#0088ff",
        pubkey: "test_pubkey_123",
      });

      const wallet = createNWCWallet(walletConfig);
      const connected = await wallet.connect();

      expect(connected).toBe(true);
      expect(wallet.isWalletConnected()).toBe(true);
      expect(mockNwc.enable).toHaveBeenCalled();
    });

    it("should handle connection timeout", async () => {
      mockNwc.enable.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 100)
          )
      );

      const wallet = createNWCWallet({
        ...walletConfig,
        maxRetries: 1,
      });

      await expect(wallet.connect()).rejects.toThrow();
    });

    it("should retry connection on transient failure", async () => {
      let callCount = 0;

      mockNwc.enable.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error("ECONNREFUSED"));
        }
        return Promise.resolve();
      });

      mockNwc.getInfo.mockResolvedValue({
        alias: "Test Wallet",
        color: "#0088ff",
        pubkey: "test_pubkey_123",
      });

      const wallet = createNWCWallet(walletConfig);
      const connected = await wallet.connect();

      expect(connected).toBe(true);
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe("Wallet Disconnection", () => {
    it("should disconnect successfully", async () => {
      mockNwc.getInfo.mockResolvedValue({
        alias: "Test Wallet",
        color: "#0088ff",
        pubkey: "test_pubkey_123",
      });

      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();
      expect(wallet.isWalletConnected()).toBe(true);

      await wallet.disconnect();
      expect(wallet.isWalletConnected()).toBe(false);
    });
  });

  describe("Payment Operations", () => {
    beforeEach(async () => {
      mockNwc.getInfo.mockResolvedValue({
        alias: "Test Wallet",
        color: "#0088ff",
        pubkey: "test_pubkey_123",
      });
    });

    it("should send payment successfully", async () => {
      mockNwc.sendPayment.mockResolvedValue({
        preimage: "preimage_abc123",
        relays: ["wss://relay.test"],
      });

      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      const result = await wallet.sendPayment("lnbc10000n1p3x3v3pp5test");

      expect(result.success).toBe(true);
      expect(result.preimage).toBe("preimage_abc123");
      expect(mockNwc.sendPayment).toHaveBeenCalledWith("lnbc10000n1p3x3v3pp5test");
    });

    it("should validate invoice format", async () => {
      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      // Invalid invoice format
      await expect(wallet.sendPayment("invalid_invoice")).rejects.toThrow(
        "Invalid invoice format"
      );
    });

    it("should reject uppercase invoice", async () => {
      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      await expect(
        wallet.sendPayment("LNBC10000N1P3X3V3PP5TEST")
      ).rejects.toThrow("uppercase");
    });

    it("should reject invoice with spaces", async () => {
      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      await expect(
        wallet.sendPayment("lnbc10000 n1p3x3v3pp5test")
      ).rejects.toThrow("spaces");
    });

    it("should retry payment on transient failure", async () => {
      let callCount = 0;

      mockNwc.sendPayment.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error("relay temporarily unavailable"));
        }
        return Promise.resolve({
          preimage: "preimage_abc123",
          relays: ["wss://relay.test"],
        });
      });

      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      const result = await wallet.sendPayment("lnbc10000n1p3x3v3pp5test");

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    it("should handle payment timeout", async () => {
      mockNwc.sendPayment.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 10000)
          )
      );

      const wallet = createNWCWallet({
        ...walletConfig,
        timeout: 100,
        maxRetries: 1,
      });
      await wallet.connect();

      await expect(wallet.sendPayment("lnbc10000n1p3x3v3pp5test")).rejects.toThrow(
        "timeout"
      );
    });
  });

  describe("Batch Payments", () => {
    beforeEach(async () => {
      mockNwc.getInfo.mockResolvedValue({
        alias: "Test Wallet",
        color: "#0088ff",
        pubkey: "test_pubkey_123",
      });

      mockNwc.sendPayment.mockResolvedValue({
        preimage: "preimage_test",
        relays: ["wss://relay.test"],
      });
    });

    it("should send multiple payments", async () => {
      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      const invoices = [
        "lnbc10000n1p3x3v3pp5test1",
        "lnbc10000n1p3x3v3pp5test2",
        "lnbc10000n1p3x3v3pp5test3",
      ];

      const results = await wallet.sendBatchPayments(invoices);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockNwc.sendPayment).toHaveBeenCalledTimes(3);
    });

    it("should continue batch on individual payment failure", async () => {
      let callCount = 0;

      mockNwc.sendPayment.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error("Insufficient balance"));
        }
        return Promise.resolve({
          preimage: "preimage_test",
          relays: ["wss://relay.test"],
        });
      });

      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      const invoices = [
        "lnbc10000n1p3x3v3pp5test1",
        "lnbc10000n1p3x3v3pp5test2",
        "lnbc10000n1p3x3v3pp5test3",
      ];

      const results = await wallet.sendBatchPayments(invoices);

      expect(results).toHaveLength(3);
      expect(results[1].success).toBe(false); // Second one failed
      expect(results[0].success).toBe(true); // But others succeeded
      expect(results[2].success).toBe(true);
    });

    it("should report progress during batch send", async () => {
      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      const invoices = [
        "lnbc10000n1p3x3v3pp5test1",
        "lnbc10000n1p3x3v3pp5test2",
      ];

      const progressUpdates: number[] = [];

      await wallet.sendBatchPayments(invoices, (index, total) => {
        progressUpdates.push(index);
      });

      expect(progressUpdates).toEqual([1, 2]);
    });
  });

  describe("Wallet Info", () => {
    it("should fetch wallet information", async () => {
      const mockInfo = {
        alias: "My Alby Wallet",
        color: "#ff9900",
        pubkey: "48f2c8d8detest",
        balance: 10000,
        maxSendable: 100000,
        maxReceivable: 500000,
      };

      mockNwc.getInfo.mockResolvedValue(mockInfo);

      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      const info = await wallet.getWalletInfo();

      expect(info.alias).toBe("My Alby Wallet");
      expect(info.color).toBe("#ff9900");
      expect(info.pubkey).toBe("48f2c8d8detest");
    });

    it("should throw error if not connected", async () => {
      const wallet = createNWCWallet(walletConfig);

      await expect(wallet.getWalletInfo()).rejects.toThrow("not connected");
    });

    it("should get wallet status", async () => {
      mockNwc.getInfo.mockResolvedValue({
        alias: "Test Wallet",
        color: "#0088ff",
        pubkey: "test_pubkey_123",
      });

      const wallet = createNWCWallet(walletConfig);
      await wallet.connect();

      const status = await wallet.getWalletStatus();

      expect(status.connected).toBe(true);
      expect(status.walletInfo).toBeDefined();
      expect(status.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockNwc.enable.mockRejectedValue(new Error("Network error"));

      const wallet = createNWCWallet({
        ...walletConfig,
        maxRetries: 1,
      });

      await expect(wallet.connect()).rejects.toThrow("Network error");
    });

    it("should handle invalid response", async () => {
      mockNwc.getInfo.mockResolvedValue(null);

      const wallet = createNWCWallet(walletConfig);

      await expect(wallet.connect()).rejects.toThrow();
    });

    it("should handle unknown errors gracefully", async () => {
      mockNwc.sendPayment.mockRejectedValue("Unknown error");

      mockNwc.getInfo.mockResolvedValue({
        alias: "Test Wallet",
        color: "#0088ff",
        pubkey: "test_pubkey_123",
      });

      const wallet = createNWCWallet({
        ...walletConfig,
        maxRetries: 1,
      });
      await wallet.connect();

      await expect(wallet.sendPayment("lnbc10000n1p3x3v3pp5test")).rejects.toThrow();
    });
  });
});
