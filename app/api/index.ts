import * as http from 'http';
import * as https from 'https';

export function fetchURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const request = http.get(url, { agent: false }, res => {
            res.on('data', data => {
                try {
                    const htmlText = data.toString('utf8');
                    resolve(htmlText);
                } catch (error) {
                    reject(error);
                }
            });
        });
        request.on('error', reject);
    });
}

export function post(
    url: string,
    body: { [key: string]: any } = {},
    headers: http.OutgoingHttpHeaders = {}
): Promise<{ [key: string]: any }> {
    url = url.startsWith('https://') ? url.substring('https://'.length) : url;
    const index = url.indexOf('/');
    const hostname = index >= 0 ? url.substring(0, index) : url;
    const path = index >= 0 ? url.substring(index) : undefined;

    return new Promise((resolve, reject) => {
        const request = https.request(
            {
                hostname,
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            },
            res => {
                res.on('data', data => {
                    try {
                        const text = data.toString('utf8');
                        console.log(text);
                        resolve(JSON.parse(text));
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );
        request.on('error', reject);
        request.write(JSON.stringify(body));
        request.end();
    });
}
