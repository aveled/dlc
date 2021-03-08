// #region module
export const DEFAULT_SERVER_PORT = process.env.PORT
    ? parseInt(process.env.PORT)
    : 8080;


export const DEFAULT_SERVER_OPTIONS_SERVER_NAME = 'DLC Server';
export const DEFAULT_SERVER_OPTIONS_QUIET = false;

export const DEFAULT_SERVER_OPTIONS = {
    SERVER_NAME: DEFAULT_SERVER_OPTIONS_SERVER_NAME,
    QUIET: DEFAULT_SERVER_OPTIONS_QUIET,
};


export const ENDPOINT_STATUS = process.env.DLC_SERVER_ENDPOINT_STATUS || '/status';
export const ENDPOINT_CHANGE = process.env.DLC_SERVER_ENDPOINT_CHANGE || '/change';


export const environment = {
    production: process.env.ENV_MODE === 'production',
    development: process.env.ENV_MODE === 'development',
};
// #endregion module
