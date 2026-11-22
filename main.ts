// Tiny stack VM for make.fun tiny-stack-vm-01 (ISA in the kit: ISA.md).
// Answers every instance in one run; deterministic (no clock, no randomness).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const IMM = new Int8Array(256).fill(-1);
const POPS = new Uint8Array(256);
const PUSHES = new Uint8Array(256);
for (let i = 0, t = [
  0,0,0,0, 1,1,0,1, 2,4,0,1, 3,0,1,0, 4,0,1,2, 5,0,2,2, 6,0,2,3, 7,0,3,3,
  16,0,2,1, 17,0,2,1, 18,0,2,1, 19,0,2,1, 20,0,2,1, 21,0,2,1, 22,0,2,1, 23,0,1,1,
  24,0,2,1, 25,0,2,1, 26,0,2,1, 27,0,1,1, 28,0,2,1, 29,0,2,1, 30,0,2,1, 32,0,2,1,
  33,0,2,1, 34,0,2,1, 48,2,0,0, 49,2,1,0, 50,2,1,0, 51,2,0,0, 52,0,0,0, 64,0,1,1,
  65,0,2,0, 80,0,1,0, 81,0,1,0, 82,0,0,1, 83,0,1,0,
]; i < t.length; i += 4) {
  IMM[t[i]] = t[i + 1];
  POPS[t[i]] = t[i + 2];
  PUSHES[t[i]] = t[i + 3];
}
function run(p: Uint8Array, inp: Uint8Array): { out: Uint8Array; code: number } {
  const n = p.length;
  const S = new Int32Array(256);
  const C = new Int32Array(64);
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0, cp = 0, pc = 0, steps = 0, olen = 0, ip = 0;
  const end = (code: number) => ({ out: out.subarray(0, olen), code });
  for (;;) {
    if (steps === 1000000) return end(10);
    if (pc < 0 || pc >= n) return end(9);
    const op = p[pc];
    const imm = IMM[op];
    if (imm < 0) return end(5);
    if (pc + imm >= n) return end(9);
    steps++;
    if (sp < POPS[op]) return end(2);
    if (sp - POPS[op] + PUSHES[op] > 256) return end(3);
    const nx = pc + 1 + imm;
    pc = nx;
    switch (op) {
      case 0x00:
        return end(0);
      case 0x01:
        S[sp++] = (p[nx - 1] << 24) >> 24;
        break;
      case 0x02:
        S[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24);
        break;
      case 0x03:
        sp--;
        break;
      case 0x04:
        S[sp] = S[sp - 1];
        sp++;
        break;
      case 0x05: {
        const t = S[sp - 1];
        S[sp - 1] = S[sp - 2];
        S[sp - 2] = t;
        break;
      }
      case 0x06:
        S[sp] = S[sp - 2];
        sp++;
        break;
      case 0x07: {
        const t = S[sp - 3];
        S[sp - 3] = S[sp - 2];
        S[sp - 2] = S[sp - 1];
        S[sp - 1] = t;
        break;
      }
      case 0x17:
        S[sp - 1] = (-S[sp - 1]) | 0;
        break;
      case 0x1b:
        S[sp - 1] = ~S[sp - 1];
        break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22: {
        const b = S[sp - 1];
        const a = S[sp - 2];
        let r: number;
        if (op === 0x10) r = (a + b) | 0;
        else if (op === 0x11) r = (a - b) | 0;
        else if (op === 0x12) r = Math.imul(a, b);
        else if (op === 0x13) {
          if (b === 0) return end(4);
          r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
        } else if (op === 0x14) {
          if (b === 0) return end(4);
          r = b === -1 ? 0 : (a % b) | 0;
        } else if (op === 0x15) {
          if (b === 0) return end(4);
          r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
        } else if (op === 0x16) {
          if (b === 0) return end(4);
          r = ((a >>> 0) % (b >>> 0)) | 0;
        } else if (op === 0x18) r = a & b;
        else if (op === 0x19) r = a | b;
        else if (op === 0x1a) r = a ^ b;
        else if (op === 0x1c) r = a << (b & 31);
        else if (op === 0x1d) r = a >> (b & 31);
        else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
        else if (op === 0x20) r = a === b ? 1 : 0;
        else if (op === 0x21) r = a < b ? 1 : 0;
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        sp -= 2;
        S[sp++] = r;
        break;
      }
      case 0x30: case 0x31: case 0x32: {
        const rel = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        let take = op === 0x30;
        if (!take) {
          const v = S[--sp];
          take = op === 0x31 ? v === 0 : v !== 0;
        }
        if (take) pc = nx + rel;
        break;
      }
      case 0x33:
        if (cp === 64) return end(7);
        C[cp++] = nx;
        pc = p[nx - 2] | (p[nx - 1] << 8);
        break;
      case 0x34:
        if (cp === 0) return end(8);
        pc = C[--cp];
        break;
      case 0x40: {
        const addr = S[sp - 1];
        if (addr < 0 || addr >= 256) return end(6);
        S[sp - 1] = M[addr];
        break;
      }
      case 0x41: {
        const addr = S[sp - 1];
        if (addr < 0 || addr >= 256) return end(6);
        M[addr] = S[sp - 2];
        sp -= 2;
        break;
      }
      case 0x50: {
        const s = String(S[sp - 1]);
        if (olen + s.length > 65536) return end(11);
        sp--;
        for (let i = 0; i < s.length; i++) out[olen++] = s.charCodeAt(i);
        break;
      }
      case 0x51:
        if (olen + 1 > 65536) return end(11);
        out[olen++] = S[--sp] & 255;
        break;
      case 0x52:
        S[sp++] = ip < inp.length ? inp[ip++] : -1;
        break;
      case 0x53:
        return end(S[--sp] & 255);
    }
  }
}
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(readFileSync(join(I, id, 'program.bin')), readFileSync(join(I, id, 'input.bin')));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), r.code + '\n');
}
