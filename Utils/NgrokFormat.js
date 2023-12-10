export function formatNgrokUrl(returnoffset) {
    const ngrokSubdomain = process.env.NGROK_SUBDOMAIN || 'randomstring';
    const ngrokBaseUrl = `http://${ngrokSubdomain}.ngrok-free.app/${returnoffset}`;

    return ngrokBaseUrl;

}