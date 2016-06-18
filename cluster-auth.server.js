import moment from 'moment';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  let discoveryUrl = process.env['CLUSTER_DISCOVERY_URL'] || Meteor.settings.private.CLUSTER_DISCOVERY_URL;
  const database = new MongoInternals.RemoteCollectionDriver(discoveryUrl);
  ClusterAuth.RequestTokens = new Mongo.Collection("clusterRequestTokens", { _driver: database });
  ClusterAuth.RequestTokens._ensureIndex({ token: 1 });
});

ClusterAuth.authenticate = function(token, scope, options) {
  const selector = options || {};
  selector.token = token;
  selector.date = { $gte: moment().subtract(10, 'minutes').toDate() };
  const requestToken = ClusterAuth.RequestTokens.findOne(selector, { fields: { userId: 1 } });
  if(!requestToken) return;
  const userId = requestToken.userId;
  !!scope.setUserId ? scope.setUserId(userId) : scope.userId = userId;
  Meteor.defer(() => ClusterAuth.destroyToken(token));
  return userId;
};

ClusterAuth.authenticateByLoginToken = function(loginToken, scope) {
  if(!loginToken) return null;
  const hashedToken = loginToken && Accounts._hashLoginToken(loginToken);
  const selector = { 'services.resume.loginTokens.hashedToken': loginToken };
  const user = Meteor.users.findOne(selector, { fields: { _id: 1 } });

  const userId = !!user ? user._id : null;
  !!scope.setUserId ? scope.setUserId(userId) : scope.userId = userId;
  return userId;
};

ClusterAuth.destroyToken = function(token) {
  if(!!token) ClusterAuth.RequestTokens.remove({ token });
};

ClusterAuth.generateToken = function(userId, from = 'server', token) {
  userId = userId || Meteor.userId();
  token = token || Random.secret();
  const id = ClusterAuth.RequestTokens.insert({ token, userId, date: new Date(), from });
  return token;
};

Meteor.methods({
  generateClusterRequestToken(token) {
    if(!this.userId) return false;
    return ClusterAuth.generateToken(this.userId, 'client', token);
  }
});
