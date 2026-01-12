import dotenv from "dotenv";

dotenv.config();

export const config = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  PORT: parseInt(process.env.PORT as string),
  AZURE_STORAGE_ACCOUNT_CONNECTION_STRING: process.env
    .AZURE_STORAGE_ACCOUNT_CONNECTION_STRING as string,
};
