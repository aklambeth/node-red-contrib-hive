var TemperatureHistory = require('bg-hive-api/temperature');
module.exports = function(RED) {

    function TemperatureEventHandler(node, controller, msg)
    {
        if (controller != undefined)
        {
            controller.on('accepted', function(){
                node.hive.Logout();
            });

            controller.on('error', function(response){
                node.status({fill:"red",shape:"dot",text:"fault"});
                node.hive.Logout();
            });

            controller.on('complete', function(response){
                msg.payload = response;
                node.send([msg]);
                node.hive.Logout();
            });

            node.hive.once('logout', function(){
                controller = undefined;
            });
        }
    }

    function Temperature(config) {
        RED.nodes.createNode(this,config);
        var hiveConfig = RED.nodes.getNode(config.hive);

        if (hiveConfig) {
            this.hive = hiveConfig.hive;
            this.status({fill:"green",shape:"ring",text:"disconnected"});
        }
        else {
            this.log('error - no config returned')
        };

        var self = this;

        self.hive.on('login', function(){
            self.status({fill:"green",shape:"dot",text:"connected"});
        });

        self.hive.on('logout', function(){
            self.status({fill:"green",shape:"ring",text:"disconnected"});
        });

        self.on('input', function(msg) {

            try {
                self.hive.Login();
                self.hive.once('login', function(context){
                    var temp = new TemperatureHistory(context);
                    TemperatureEventHandler(self, temp, msg);
                    var period;
                    switch (msg.payload.toUpperCase()) {

                        case "HOUR" : period = temp.Period.Hour; break;
                        case "DAY" : period = temp.Period.Day; break;
                        case "WEEK" : period = temp.Period.Week; break;
                        case "MONTH" : period = temp.Period.Month; break;
                        case "YEAR" : period = temp.Period.Year; break;
                        default : period = temp.Period.Day;
                    }

                    temp.GetState(period);
                });
            }
            catch (ex) {
                self.send([null, null, {payload:ex}]);
                self.status({fill:"red",shape:"dot",text:"fault"});
            };

        });
    }
    RED.nodes.registerType("hive temp",Temperature);
}