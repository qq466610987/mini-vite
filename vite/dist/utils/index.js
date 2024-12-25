import crypto from 'node:crypto';
export function hash(str) {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
}
//# sourceMappingURL=index.js.map