import { createHash } from 'crypto';

const PART_1_INDEXES = [23, 14, 6, 36, 16, 40, 7, 19].filter(x => x < 40);
const PART_2_INDEXES = [16, 1, 32, 12, 19, 27, 8, 5];
const SCRAMBLE_VALUES = [89, 39, 179, 150, 218, 82, 58, 252, 177, 52, 186, 123, 120, 64, 242, 133, 143, 161, 121, 179];

export function sign(request: any): string {
    const jsonStr = JSON.stringify(request);
    const hash = createHash('sha1').update(jsonStr).digest('hex').toUpperCase();

    const part1 = PART_1_INDEXES.map(i => hash.charAt(i)).join('');
    const part2 = PART_2_INDEXES.map(i => hash.charAt(i)).join('');

    const part3 = new Uint8Array(20);
    for (let i = 0; i < SCRAMBLE_VALUES.length; i++) {
        const value = SCRAMBLE_VALUES[i] ^ parseInt(hash.substring(i * 2, i * 2 + 2), 16);
        part3[i] = value;
    }

    const b64Part = Buffer.from(part3).toString('base64').replace(/[\\/+=]/g, '');
    return `zzc${part1}${b64Part}${part2}`.toLowerCase();
}
