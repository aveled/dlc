// #region imports
    // #region libraries
    import express from 'express';
    // #endregion libraries
// #endregion imports



// #region module
export type ServerRequest = express.Request & {
    requestID: string;
}


export type DebugLevels =
    | 'none'
    | 'error'
    | 'warn'
    | 'info';


export interface DLCServerOptions {
    /** To be used for logging. Default `DLC Server` */
    serverName: string;

    /**
     * To log or not to log to the console.
     */
    quiet: boolean;

    /**
     * Debug levels.
     *
     * Production default: `error`.
     * Development default: `info` and above.
     */
    debug: DebugLevels;
}


export type DLCServerPartialOptions = Partial<DLCServerOptions>;


export type VerifyToken = (
    token: string,
) => Promise<boolean>;


export interface DLCServerConfiguration {
    verifyToken: VerifyToken;
    options?: DLCServerPartialOptions;
}
// #endregion module
