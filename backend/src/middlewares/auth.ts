import { auth } from "express-oauth2-jwt-bearer";
import { env } from "../config/env";

export const checkJwt = auth({
  audience: env.audience,
  issuerBaseURL: env.baseUrl,
});
