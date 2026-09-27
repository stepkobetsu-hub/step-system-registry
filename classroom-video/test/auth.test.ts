import { describe, expect, it } from "vitest";
import { campusOfDevice, createTicket, displayNameForDevice, parseDevices, resolveDeviceIdentity, tokensEqual, verifyTicket } from "../src/auth";

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

  it("assigns extensible device ids per campus with legacy aliases", () => {
    const devices = parseDevices(JSON.stringify([
      { id: "jinryo", name: "神領校", token: "a".repeat(24) },
      { id: "otemachi", name: "大手町校", token: "b".repeat(24) }
    ]));
    expect(resolveDeviceIdentity("jinryo", devices)?.canonical.id).toBe("jinryo-1");
    expect(resolveDeviceIdentity("shinryo", devices)?.canonical.id).toBe("jinryo-1");
    expect(resolveDeviceIdentity("jinryo-4", devices)?.canonical.id).toBe("jinryo-4");
    expect(resolveDeviceIdentity("otemachi", devices)?.canonical.id).toBe("otemachi-1");
    expect(resolveDeviceIdentity("otemachi-4", devices)?.canonical.id).toBe("otemachi-4");
    expect(resolveDeviceIdentity("jinryo-5", devices)?.canonical.id).toBe("jinryo-5");
    expect(resolveDeviceIdentity("jinryo-phone-1", devices)?.canonical.id).toBe("jinryo-phone-1");
    expect(resolveDeviceIdentity("personal-phone", devices)).toBeNull();
  });

  it("derives a fixed short display name from the internal id", () => {
    expect(displayNameForDevice({ id: "jinryo-2", name: "神領校" })).toBe("神領2");
    expect(displayNameForDevice({ id: "otemachi-1", name: "大手町校" })).toBe("大手町1");
    expect(displayNameForDevice({ id: "jinryo-4", name: "神領校" })).toBe("神領4");
  });

  it("derives the campus used for call routing from the canonical id", () => {
    expect(campusOfDevice("jinryo-1")).toBe("jinryo");
    expect(campusOfDevice("otemachi-3")).toBe("otemachi");
    expect(campusOfDevice("unknown-1")).toBeNull();
  });
});
