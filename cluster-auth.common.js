import { Meteor } from 'meteor/meteor';

ClusterAuth = {
  generateToken() {
    const token = Meteor._localStorage.getItem('Meteor.loginToken');
    Meteor.call('generateClusterRequestToken', token);
    return token;
  }
};

export default ClusterAuth;
