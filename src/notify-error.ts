import Notify from 'simple-notify';

export class NotifyError extends Error {
    constructor(message: string, title: string) {
        // eslint-disable-next-line no-new
        new Notify({
            status: 'error',
            title,
            text: message,
        });

        super(`${title}: ${message}`);
    }
}
