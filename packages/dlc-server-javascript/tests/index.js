// #region imports
const DLCServer = require('../distribution').default;
// #endregion imports



// #region data
const validToken = 'token';
// #endregion data



// #region functions
const verifyToken = async (
    token,
) => {
    console.log('verifyToken', token);

    return token === validToken;
}
// #endregion functions



// #region server
const server = new DLCServer({
    verifyToken,
});

server.start(3399);
// #endregion server
