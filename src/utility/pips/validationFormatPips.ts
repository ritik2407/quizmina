import {
    BadRequestException,
    ValidationError,
    ValidationPipe,
} from '@nestjs/common';
import { getFieldOrder, getRuleOrder } from 'src/utility/decorator/rule-order.decorator';

/** --------- your existing helpers (unchanged) ---------- */
function sortConstraintEntries(
    e: ValidationError,
    entries: Array<[string, string]>,
) {
    const proto = e.target ? Object.getPrototypeOf(e.target) : undefined;
    const order = proto ? getRuleOrder(proto, e.property) ?? [] : [];

    entries.sort(([a], [b]) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return 0;
    });

    return entries;
}

function joinPath(parent: string | null, prop: string): string {
    if (/^\d+$/.test(prop)) return `${parent!}[${prop}]`;
    return parent ? `${parent}.${prop}` : prop;
}

type FlatError = { field: string; errors: string[]; __ctor?: Function };

function flattenValidationErrors(
    errs: ValidationError[],
    parentPath: string | null = null,
    acc: FlatError[] = [],
): FlatError[] {
    for (const e of errs) {
        const fieldPath = joinPath(parentPath, e.property);

        if (e.constraints && Object.keys(e.constraints).length) {
            const entries = sortConstraintEntries(e, Object.entries(e.constraints));
            acc.push({
                field: fieldPath,
                errors: entries.map(([, msg]) => msg),
                __ctor: (e.target as any)?.constructor,
            });
        }
        if (e.children && e.children.length) {
            flattenValidationErrors(e.children, fieldPath, acc);
        }
    }
    return acc;
}

/** --------- new helpers to build nested structure ---------- */

/** Convert "address.city" -> ["address","city"], "items[0].name" -> ["items",0,"name"] */
function pathToSegments(path: string): (string | number)[] {
    // split on dots but keep [index]
    const parts: (string | number)[] = [];
    path.split('.').forEach((chunk) => {
        // break "items[0][1]" into "items", 0, 1
        const re = /([^[\]]+)|\[(\d+)\]/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(chunk))) {
            if (m[1] !== undefined) parts.push(m[1]);
            else if (m[2] !== undefined) parts.push(Number(m[2]));
        }
    });
    return parts;
}

/** Ensure array length and return reference to index */
function ensureArraySlot(arr: any[], idx: number) {
    while (arr.length <= idx) arr.push(undefined);
    if (arr[idx] === undefined) arr[idx] = {};
    return arr[idx];
}

/** Merge an errors array into nested object at the given path */

/** Merge an errors array into nested object at the given path
 *  Rules:
 *  - If the path is TOP-LEVEL (no dots/brackets), store as {: [...] }
 *  - If the path is NESTED (has parent like "address.city"), the last segment stores a plain array ["..."]
 *  - Parents can keep their own while also having children (e.g., address + address.city)
 */
function mergeAtPath(target: any, segments: (string | number)[], msgs: string[]) {
    let cursor = target;

    // Is this a nested path like "address.city" or "items[0].name"?
    const isNestedPath = segments.length > 1;

    for (let i = 0; i < segments.length; i++) {
        const key = segments[i];
        const isLast = i === segments.length - 1;

        if (isLast) {
            // ---- Terminal assignment ----
            if (isNestedPath) {
                // For nested leafs (e.g., address.city) -> plain array of messages
                let existing = cursor[key as any];
                if (Array.isArray(existing)) {
                    const set = new Set([...existing, ...msgs]);
                    cursor[key as any] = Array.from(set);
                } else if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
                    // Rare: if something created an object here, attach/merge under
                    const prev = Array.isArray(existing) ? existing : [];
                    const set = new Set([...prev, ...msgs]);
                    existing = Array.from(set);
                } else {
                    cursor[key as any] = [...new Set(msgs)];
                }
            } else {
                // Top-level fields -> wrap as {: [...] }
                let existing = cursor[key as any];
                if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
                    const prev = Array.isArray(existing) ? existing : [];
                    const set = new Set([...prev, ...msgs]);
                    existing = Array.from(set);
                } else {
                    cursor[key as any] = [...new Set(msgs)];
                }
            }
            return;
        }

        // ---- Ensure parent container type ----
        const nextKey = segments[i + 1];
        const wantArray = typeof nextKey === 'number';

        // When current key doesn't exist, create the right container
        if (!(key in cursor)) {
            cursor[key as any] = wantArray ? [] : {};
        } else {
            // If it exists but is not the expected container, fix it
            const val = cursor[key as any];
            if (wantArray) {
                if (!Array.isArray(val)) cursor[key as any] = [];
            } else {
                if (Array.isArray(val) || typeof val !== 'object' || val === null) {
                    cursor[key as any] = {};
                }
            }
        }

        // If parent currently has only : [...]}, keep it as an object and still allow children
        // (no extra code needed—above logic preserves objects with)

        // Descend
        cursor = cursor[key as any];

        // Handle array index immediately (segments like [ 'items', 0, 'name' ])
        if (typeof nextKey === 'number') {
            const arr = cursor as any[];
            while (arr.length <= nextKey) arr.push(undefined);
            if (arr[nextKey] === undefined) arr[nextKey] = {};
            cursor = arr[nextKey];
            i++; // consumed the index

            // Prepare the next container based on the following segment
            const afterIdxKey = segments[i + 1];
            if (afterIdxKey !== undefined) {
                const wantArr2 = typeof afterIdxKey === 'number';
                if (wantArr2 && !Array.isArray(cursor)) arr[nextKey] = [];
                if (!wantArr2 && (Array.isArray(cursor) || typeof cursor !== 'object' || cursor === null)) {
                    arr[nextKey] = {};
                }
                cursor = arr[nextKey];
            }
        }
    }
}

/** Build nested error object from flattened entries */
function buildNestedErrors(flat: FlatError[]) {
    const root: Record<string, any> = {};
    for (const { field, errors } of flat) {
        const segments = pathToSegments(field);
        mergeAtPath(root, segments, errors);
    }
    return root;
}

/** ----------------- The Pipe ----------------------- */
export const AppValidationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: true, value: false },
    exceptionFactory: (errors: ValidationError[]) => {
        // 1) Flatten (keeps your per-field rule sorting)
        const flat = flattenValidationErrors(errors);

        // 2) Optional: sort fields by DTO-level order (your existing logic)
        const ctor = flat[0]?.__ctor;
        let sorted = flat;
        if (ctor && flat.every((x) => x.__ctor === ctor)) {
            const fieldOrder = getFieldOrder(ctor) ?? [];
            sorted = [...flat].sort((a, b) => {
                const lastA = a.field.split('.').pop()!.replace(/\[\d+\]$/, '');
                const lastB = b.field.split('.').pop()!.replace(/\[\d+\]$/, '');
                const ia = fieldOrder.indexOf(lastA);
                const ib = fieldOrder.indexOf(lastB);
                if (ia === -1 && ib === -1) return 0;
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
            });
        }

        // 3) Build nested structure { field: [msgs], address: { city: [msgs] }, items: [{...}] }
        const nested = buildNestedErrors(sorted);

        // 4) Wrap into your response payload
        return new BadRequestException({
            statusCode: 400,
            message: 'Validation failed',
            details: nested,
        });
    },
});
