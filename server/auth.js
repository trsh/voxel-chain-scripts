const authMW = (req, res, next) => {
  const worldId = req.query.worldId;

  // TODO: real world id check from session
  if (!worldId || worldId !== '1') {
    return res.status(400).send('Invalid WorldId');
  }

  req['worldId'] = worldId;

  // NOTE: Assuming that post event will come only from Script sync client
  if (req.method === 'POST') {
    // Check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
      return res.status(401).send('Missing Authorization Header');
    }

    // Verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [userId, secret] = credentials.split(':');

    // TODO: Here we should call real authorization method
    if (userId !== '1' || secret !== '123') {
      return res.status(401).send('Invalid Authentication Credentials');
    }

    req['userId'] = userId;
    next()
  } else {
    // TODO: here we should also check for real user session and userId
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).send('Invalid request params');
    }

    req['userId'] = userId;
    next();
  }
};

export { authMW };
