module.exports = function(RED) {

    function HiveServerNode(n) {
        var Hive = require('bg-hive-api');

        var context = {
            "authToken":null,
            "username" : '',
            "userId" : null,
            "uri" : '',
            "api" : 'Hive',
            "id":null,
            "controller":null
        }

        RED.nodes.createNode(this,n);
        var hive = {};

        if (this.credentials && n.hive)
        {
            hive = new Hive(this.credentials.username, this.credentials.password, n.hive);

            hive.on('logout', function(){

            });
        }
        else
            hive.context = context;

        this.hive = hive;
    }

    RED.nodes.registerType("hive-server", HiveServerNode, {
        credentials: {
            username: {type:"text"},
            password: {type:"password"}
        }
    });

}