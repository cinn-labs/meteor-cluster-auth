import moment from 'moment';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  let discoveryUrl = process.env['CLUSTER_DISCOVERY_URL'] || Meteor.settings.private.CLUSTER_DISCOVERY_URL;
  const database = new MongoInternals.RemoteCollectionDriver(discoveryUrl);
  ClusterAuth.RequestTokens = new Mongo.Collection("clusterRequestTokens", { _driver: database });
  ClusterAuth.RequestTokens._ensureIndex({ token: 1 });
});

ClusterAuth.authenticate = function(token, scope, options) {
  options = options || { from: 'server' };
  if(options.from === 'server') return ClusterAuth.authenticateByClusterToken(token, scope);
  if(options.from === 'client') return ClusterAuth.authenticateByLoginToken(token, scope);
};

ClusterAuth.authenticateByClusterToken = function(token, scope) {
  const selector = { token, date: { $gte: moment().subtract(10, 'minutes').toDate() } };
  const requestToken = ClusterAuth.RequestTokens.findOne(selector, { fields: { userId: 1 } });
  if(!requestToken) return;
  Meteor.defer(() => ClusterAuth.destroyToken(token));

  const userId = requestToken.userId;
  return ClusterAuth.setUserToScope(scope, userId)
};

ClusterAuth.authenticateByLoginToken = function(loginToken, scope) {
  if(!loginToken) return null;
  const hashedToken = loginToken && Accounts._hashLoginToken(loginToken);
  const selector = { 'services.resume.loginTokens.hashedToken': hashedToken };
  const user = Meteor.users.findOne(selector, { fields: { _id: 1 } });

  const userId = !!user ? user._id : null;
  return ClusterAuth.setUserToScope(scope, userId)
};

ClusterAuth.setUserToScope = function(scope, userId) {
  !!scope.setUserId ? scope.setUserId(userId) : scope.userId = userId;
  return userId;
};

ClusterAuth.destroyToken = function(token) {
  if(!!token) ClusterAuth.RequestTokens.remove({ token });
};

ClusterAuth.generateToken = function(userId, token) {
  userId = userId || Meteor.userId();
  token = token || Random.secret();
  const id = ClusterAuth.RequestTokens.insert({ token, userId, date: new Date() });
  return token;
};
