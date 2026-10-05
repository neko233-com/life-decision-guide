// Keep the original value until a reader explicitly chooses to replace it.
export function readStored(storage, key, validate) {
  let raw = null;
  try {
    raw = storage.getItem(key);
    if (raw === null) return { state: 'ready', raw, value: null };
    const value = JSON.parse(raw);
    return validate(value) ? { state: 'ready', raw, value } : { state: 'invalid', raw };
  } catch {
    return { state: raw === null ? 'unavailable' : 'invalid', raw };
  }
}

export function writeStored(storage, key, value, expectedRaw, replace = false) {
  try {
    const raw = storage.getItem(key);
    if (!replace && raw !== expectedRaw) return { state: 'conflict', raw };
    const next = JSON.stringify(value);
    storage.setItem(key, next);
    return { state: 'ready', raw: next };
  } catch {
    return { state: 'unavailable', raw: expectedRaw };
  }
}
