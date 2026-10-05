import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

describe("GitHub Server Security", () => {
    describe("Encryption (AES-GCM)", () => {
        beforeEach(() => {
            vi.resetModules();
        });

        it("fails closed when GITHUB_ENCRYPTION_KEY is missing", async () => {
            delete process.env.GITHUB_ENCRYPTION_KEY;
            await expect(import("../github")).rejects.toThrow("GITHUB_ENCRYPTION_KEY is required and must be at least 32 characters");
        });

        it("encrypts and decrypts a token correctly", async () => {
            process.env.GITHUB_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex").slice(0, 32);
            const { encryptToken, decryptToken } = await import("../github");
            
            const originalToken = "gho_abc123DEF456ghi789JKL012mno345PQR678";
            const encrypted = encryptToken(originalToken);
            
            expect(encrypted).toMatch(/^v2:/);
            const decrypted = decryptToken(encrypted);
            expect(decrypted).toBe(originalToken);
        });

        it("rejects tampered ciphertext", async () => {
            process.env.GITHUB_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex").slice(0, 32);
            const { encryptToken, decryptToken } = await import("../github");
            
            const encrypted = encryptToken("secret_token");
            const parts = encrypted.split(":");
            
            const tamperedParts = [...parts];
            tamperedParts[3] = tamperedParts[3].replace(/[0-9a-f]/, (char) => (char === "0" ? "1" : "0"));
            const tampered = tamperedParts.join(":");
            
            expect(() => decryptToken(tampered)).toThrow("Failed to authenticate or decrypt token");
        });
        
        it("rejects malformed format safely", async () => {
            process.env.GITHUB_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex").slice(0, 32);
            const { decryptToken } = await import("../github");
            
            expect(() => decryptToken("v2:tooshort")).toThrow("Unknown encryption format");
            expect(() => decryptToken("unknown_format_string")).toThrow("Unknown encryption format");
        });
    });
});
