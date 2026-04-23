import * as crypto from "crypto";

export function md5(raw: string): string {
    return crypto.createHash("md5").update(raw).digest("hex");
}

export function sha256(raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
}

export function base64Decode(input: string) {
    return Buffer.from(input, "base64").toString("utf-8");
}

export function base64Encode(input: string) {
    return Buffer.from(input, "utf-8").toString("base64");
}
