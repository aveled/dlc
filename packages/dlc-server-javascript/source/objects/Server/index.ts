// #region imports
    // #region libraries
    import {
        Server,
    } from 'http';

    import express, {
        Express,
    } from 'express';

    import {
        raw as bodyParserRaw,
        json as bodyParserJSON,
    } from 'body-parser';

    import Deon, {
        DEON_MEDIA_TYPE,
    } from '@plurid/deon';

    import {
        time,
        uuid,
    } from '@plurid/plurid-functions';
    // #endregion libraries


    // #region external
    import {
        environment,

        DEFAULT_SERVER_PORT,
        DEFAULT_SERVER_OPTIONS,

        ENDPOINT_STATUS,
        ENDPOINT_CHANGE,
    } from '../../data/constants';

    import {
        ServerRequest,
        DLCServerOptions,
        DLCServerConfiguration,
        DLCServerPartialOptions,
        DebugLevels,

        VerifyToken,
    } from '../../data/interfaces';
    // #endregion external
// #endregion imports



// #region module
class DLCServer {
    private options: DLCServerOptions;
    private serverApplication: Express;
    private server: Server | undefined;
    private port: number | string;
    private verifyToken: VerifyToken;


    constructor(
        configuration: DLCServerConfiguration,
    ) {
        this.verifyToken = configuration.verifyToken;

        this.options = this.handleOptions(configuration?.options);

        this.serverApplication = express();
        this.port = DEFAULT_SERVER_PORT;

        this.configureServer();
        this.handleEndpoints();

        process.addListener('SIGINT', () => {
            this.stop();
            process.exit(0);
        });
    }


    public start(
        port = this.port,
    ) {
        this.port = port;

        const serverlink = `http://localhost:${port}`;

        if (this.debugAllows('info')) {
            console.info(
                `\n\t[${time.stamp()}] ${this.options.serverName} Started on Port ${port}: ${serverlink}\n`,
            );
        }

        this.server = this.serverApplication.listen(port);

        return this.server;
    }

    public stop() {
        if (this.server) {
            if (this.debugAllows('info')) {
                console.info(
                    `\n\t[${time.stamp()}] ${this.options.serverName} Closed on Port ${this.port}\n`,
                );
            }

            this.server.close();
        }
    }

    public handle() {
        return {
            post: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.post(path, ...handlers);

                return this.serverApplication;
            },
            patch: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.patch(path, ...handlers);

                return this.serverApplication;
            },
            put: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.put(path, ...handlers);

                return this.serverApplication;
            },
            delete: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.delete(path, ...handlers);

                return this.serverApplication;
            },
        };
    }

    public instance() {
        return this.serverApplication;
    }


    private handleEndpoints() {
        this.serverApplication.get(ENDPOINT_STATUS, (request, response) => {
            this.handleEndpointStatus(request, response);
        });

        this.serverApplication.post(ENDPOINT_CHANGE, (request, response) => {
            this.handleEndpointChange(request, response);
        });
    }

    private async handleEndpointStatus(
        request: express.Request,
        response: express.Response,
    ) {
        const requestID = (request as ServerRequest).requestID || uuid.generate();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${time.stamp()} :: ${requestID}] (000 Start) Handling GET ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (401 Unauthorized) Could not handle GET ${request.path}`,
                    );
                }

                response
                    .status(401)
                    .send('Unauthorized');
                return;
            }

            const {
                token,
            } = request.body as any;


            const verifiedToken = await this.verifyToken(token);

            if (
                !verifiedToken
            ) {
                if (this.debugAllows('warn')) {
                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (403 Forbidden) Could not handle GET ${request.path}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const contentType = request.header('Content-Type');

            const state = await this.readState();
            const responseData = {
                ...state,
            };


            if (
                contentType !== DEON_MEDIA_TYPE
            ) {
                if (this.debugAllows('info')) {
                    console.info(
                        `[${time.stamp()} :: ${requestID}] (200 OK) Handled GET ${request.path}`,
                    );
                }

                response.json(responseData);
                return;
            }


            const deon = new Deon();
            const responseDeon = deon.stringify(responseData);

            response.setHeader(
                'Content-Type',
                DEON_MEDIA_TYPE,
            );

            if (this.debugAllows('info')) {
                console.info(
                    `[${time.stamp()} :: ${requestID}] (200 OK) Handled GET ${request.path}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                console.error(
                    `[${time.stamp()} :: ${requestID}] (500 Server Error) Could not handle GET ${request.path}`,
                    error,
                );
            }

            response
                .status(500)
                .send('Server Error');
            return;
        }
    }

    private async handleEndpointChange(
        request: express.Request,
        response: express.Response,
    ) {
        const requestID = (request as ServerRequest).requestID || uuid.generate();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${time.stamp()} :: ${requestID}] (000 Start) Handling POST ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (401 Unauthorized) Could not handle POST ${request.path}`,
                    );
                }

                response
                    .status(401)
                    .send('Unauthorized');
                return;
            }


            const {
                token,
                relays,
            } = request.body as any;


            const verifiedToken = await this.verifyToken(token);

            if (
                !verifiedToken
            ) {
                if (this.debugAllows('warn')) {
                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (403 Forbidden) Could not handle POST ${request.path}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const contentType = request.header('Content-Type');

            const responseData = {
                changed: false,
            };


            if (
                contentType !== DEON_MEDIA_TYPE
            ) {
                if (this.debugAllows('info')) {
                    console.info(
                        `[${time.stamp()} :: ${requestID}] (200 OK) Handled POST ${request.path}`,
                    );
                }

                response.json(responseData);
                return;
            }


            const deon = new Deon();
            const responseDeon = deon.stringify(responseData);

            response.setHeader(
                'Content-Type',
                DEON_MEDIA_TYPE,
            );

            if (this.debugAllows('info')) {
                console.info(
                    `[${time.stamp()} :: ${requestID}] (200 OK) Handled POST ${request.path}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                console.error(
                    `[${time.stamp()} :: ${requestID}] (500 Server Error) Could not handle POST ${request.path}`,
                    error,
                );
            }

            response
                .status(500)
                .send('Server Error');
            return;
        }
    }

    private handleOptions(
        partialOptions?: DLCServerPartialOptions,
    ) {
        const options: DLCServerOptions = {
            serverName: partialOptions?.serverName || DEFAULT_SERVER_OPTIONS.SERVER_NAME,
            quiet: partialOptions?.quiet || DEFAULT_SERVER_OPTIONS.QUIET,
            debug: partialOptions?.debug
                ? partialOptions?.debug
                : environment.production ? 'error' : 'info',
        };
        return options;
    }

    private configureServer() {
        this.serverApplication.disable('x-powered-by');

        this.serverApplication.use(
            (request, _, next) => {
                const requestID = uuid.generate();
                (request as ServerRequest).requestID = requestID;

                next();
            }
        );

        this.serverApplication.use(
            bodyParserJSON(),
        );

        this.serverApplication.use(
            bodyParserRaw({
                type: DEON_MEDIA_TYPE,
            }),
        );

        this.serverApplication.use(
            async (request, _, next) => {
                try {
                    const contentType = request.header('Content-Type');

                    if (contentType !== DEON_MEDIA_TYPE) {
                        next();
                        return;
                    }

                    const body = request.body.toString();
                    const deon = new Deon();
                    const data = await deon.parse(body);
                    request.body = data;

                    next();
                } catch (error) {
                    const requestID = (request as ServerRequest).requestID || '';
                    const requestIDLog = requestID
                        ? ` :: ${requestID}`
                        : '';

                    if (this.debugAllows('error')) {
                        console.error(
                            `[${time.stamp()}${requestIDLog}] Could not handle deon middleware ${request.path}`,
                            error,
                        );
                    }

                    next();
                }
            },
        );

        this.serverApplication.use(
            async (request, _, next) => {
                try {
                    const authorization = request.header('Authorization');

                    if (!authorization) {
                        next();
                        return;
                    }

                    const token = authorization.replace('Bearer ', '');

                    if (!token) {
                        next();
                        return;
                    }

                    if (!request.body.token) {
                        request.body.token = token;
                    }

                    next();
                } catch (error) {
                    const requestID = (request as ServerRequest).requestID || '';
                    const requestIDLog = requestID
                        ? ` :: ${requestID}`
                        : '';

                    if (this.debugAllows('error')) {
                        console.error(
                            `[${time.stamp()}${requestIDLog}] Could not handle token middleware ${request.path}`,
                            error,
                        );
                    }

                    next();
                }
            }
        )
    }

    private debugAllows(
        level: DebugLevels,
    ) {
        if (this.options.quiet) {
            return false;
        }

        if (this.options.debug === 'none') {
            return false;
        }

        switch (level) {
            case 'error':
                return true;
            case 'warn':
                if (
                    this.options.debug === 'error'
                ) {
                    return false;
                }
                return true;
            case 'info':
                if (
                    this.options.debug === 'error'
                    || this.options.debug === 'warn'
                ) {
                    return false;
                }

                return true;
            default:
                return false;
        }
    }


    private async readState() {
        return {

        };
    }
}
// #endregion module



// #region exports
export default DLCServer;
// #endregion exports
