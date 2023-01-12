import app from './app';

import { __prod__, PORT, ENVIRONMENT } from './util/secret';

try {
    app.listen(PORT, () => {
        console.log(`[+] ⚡ Server listening on${PORT}`);
        console.log(`[+] NODE_ENV=${ENVIRONMENT}`);
    });
} catch (e) {
    if (__prod__) {
        // TODO: catch all uncaught errors at production
    }
}
