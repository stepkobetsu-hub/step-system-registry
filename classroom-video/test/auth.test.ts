import { describe, expect, it } from "vitest";
import { createTicket, parseDevices, tokensEqual, verifyTicket } from "../src/auth";

describe("device authentication", () => {
  it("parses two provisioned devices", () => {
    const devices = parseDevices(JSON.stringify([
      { id: "shinryo", name: "神領校", token: "a".repeat(24) },
      { id: "otemachi", name: "大手町校", token: "b".repeat(24) }
    ]));
    expect(devices.get("shinryo")?.name).toBe("神領校");
    expect(devices).toHaveLength(2);
  });

  it("rejects short tokens", () => {
    expect(() => parseDevices('[{"id":"shinryo","name":"神領校","token":"short"}]')).toThrow();
  });

  it("compares tokens without direct string equality", async () => {
    expect(await tokensEqual("same", "same")).toBe(true);
    expect(await tokensEqual("same", "different")).toBe(false);
  });

  it("accepts a signed unexpired ticket and rejects tampering", async () => {
    const secret = "s".repeat(32);
    const ticket = await createTicket({ id: "shinryo", name: "神領校", exp: 2000 }, secret);
    expect((await verifyTicket(ticket, secret, 1000))?.id).toBe("shinryo");
    expect(await verifyTicket(`${ticket}x`, secret, 1000)).toBeNull();
    expect(await verifyTicket(ticket, secret, 3000)).toBeNull();
  });
});
