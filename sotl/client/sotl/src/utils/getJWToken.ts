export function getJWToken(): string | null {
    const token = sessionStorage.getItem("token");
    return token ? token.replace(/^"|"$/g, '') : null;
}
