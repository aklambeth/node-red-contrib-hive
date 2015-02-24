var HotWaterControl = require('bg-hive-api/hotwaterControl');
module.exports = function(RED) {

    function HotWaterEventHandler(node, controller)
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

    function HotWaterController(config) {
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
                    var water = new HotWaterControl(context);
                    HotWaterEventHandler(self, water);
                    water.SetState(msg.payload);
                });
            }
            catch (ex) {
                self.send([null, null, {payload:ex}]);
                self.status({fill:"red",shape:"dot",text:"fault"});
            };

        });
    }
    RED.nodes.registerType("hive water",HotWaterController);
}