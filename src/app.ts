import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { CLIENT_URL } from './util/secret';

import auth_route from './routes/auth';
import package_route from './routes/packages';

const app: Express = express();

//----------MIDDLEWARE----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//------CORS------
app.use(cors({ origin: CLIENT_URL }));

//----------ROUTES----------
app.use('/auth', auth_route);
app.use('/package', package_route);

export default app;

