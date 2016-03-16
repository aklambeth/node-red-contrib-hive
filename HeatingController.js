var ClimateControl = require('bg-hive-api/climateControl');
module.exports = function(RED) {

    function HeatingEventHandler(node, controller)
    {
        if (controller != undefined)
        {
            var Modes = controller.Mode;

            controller.on('accepted', function(){
                controller.GetState();
            });

            controller.on('error', function(response){
                node.status({fill:"red",shape:"dot",text:"fault"});
                node.hive.Logout();
                node.send([null, null, {payload:response}]);
            });

            controller.on('complete', function(response){
                node.hive.Logout();
                node.send([{payload:response}, null, null]);
            });

            node.hive.once('logout', function(){
                controller = undefined;
            });
        }
    }

    function HeatingController(config) {
        RED.nodes.createNode(this,config);
        var hiveConfig = RED.nodes.getNode(config.hive);

        if (hiveConfig) {
            this.hive = hiveConfig.hive;
            this.status({fill:"green",shape:"ring",text:"disconnected"});
        }
        else {this.log('error - no config returned')};

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
                    var climate = new ClimateControl(context);
                    HeatingEventHandler(self, climate);

                    var temp = undefined;
                    var mode = undefined;

                    if (msg.payload && typeof msg.payload == "string") {
                        temp = parseFloat(msg.payload);

                        if (isNaN(temp))
                        {
                            temp = undefined;

                            switch (msg.payload.toUpperCase()) {

                                case "OFF" : mode = climate.Mode.Off; break;
                                case "MANUAL" : mode = climate.Mode.Manual; break;
                                case "SCHEDULE" : mode = climate.Mode.Schedule; break;
                                case "BOOST" : mode = climate.Mode.Boost; break;
                                case "OVERRIDE" : mode = "OVERRIDE"; break;
                                default : mode = undefined;
                            }
                        }
                    }

                    if (temp && !isNaN(temp))
                        climate.TargetTemperature(temp);

                    if (mode)
                        climate.SetState(mode);

                    if (!mode && !temp)
                        climate.GetState();
                });
            }
            catch (ex) {
                self.send([null, null, {payload:ex}]);
                self.status({fill:"red",shape:"dot",text:"fault"});
            };

        });
    }
    RED.nodes.registerType("hive heating",HeatingController);
}