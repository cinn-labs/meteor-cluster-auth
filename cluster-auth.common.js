import { Meteor } from 'meteor/meteor';

ClusterAuth = {
  generateToken() {
    return Meteor._localStorage.getItem('Meteor.loginToken');
  }
};

export default ClusterAuth;
