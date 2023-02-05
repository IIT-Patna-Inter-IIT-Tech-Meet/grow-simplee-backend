import { createTransport } from "nodemailer";
import { MAILING_EMAIL, MAILING_PASSWORD } from "../config/config";

export const transporter = createTransport({
    service: "gmail",
    auth: {
        user: MAILING_EMAIL,
        pass: MAILING_PASSWORD,
    },
});
