import app from "./app";

import { __prod__, PORT, ENVIRONMENT } from "./config/config";

try {
    app.listen(PORT, () => {
        console.log(`[+] ⚡ Server listening on port: ${PORT}`);
        console.log(`[+] NODE_ENV=\`${ENVIRONMENT}\``);
    });
} catch (e) {
    if (__prod__) {
        // TODO: catch all uncaught errors at production
    } else {
        console.error(`[#] Error: ${e}`);
    }
}
