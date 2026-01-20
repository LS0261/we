export function runEvent(ps, name, params = []) {
    const [value1 = "", value2 = ""] = params;
    ps.triggerEvent(name, value1, value2, null); // strumTime opcional
}
