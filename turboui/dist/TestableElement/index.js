export function createTestId(...parts) {
    return Array.from(parts).map(sanitizeName).join("-");
}
function sanitizeName(name) {
    return name
        .replace(/\?/g, "")
        .replace(/[^a-z0-9-]/gi, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
}
