import express, { Express } from 'express';
import cors from 'cors';

import { CLIENT_URL } from './util/secret';
import * as auth_route from './routes/auth';
import * as package_route from './routes/packs';

const app: Express = express();

//----------MIDDLEWARE----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//------CORS------
app.use(cors({ origin: CLIENT_URL }));

//----------ROUTES----------
app.use('/auth', auth_route.default);
app.use('/package', package_route.default);

export default app;

