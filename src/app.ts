import express, { Express, Request, Response } from 'express';
import cors from 'cors';

import { CLIENT_URL } from './util/secret';

const app: Express = express();

//----------MIDDLEWARE----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//------CORS------
app.use(cors({ origin: CLIENT_URL }));

export default app;

