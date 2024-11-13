import Notify from 'simple-notify/dist/simple-notify.mjs';

export class NotifyError extends Error {
    constructor(message: string, title: string) {
        new Notify({
            status: 'error',
            title,
            text: message,
        });

        super(`${title}: ${message}`);
    }
}
