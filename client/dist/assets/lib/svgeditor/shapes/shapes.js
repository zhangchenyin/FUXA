var svgedit = svgedit || {};

(function () {
    'use strict';

    if (!svgedit.shapes) {
        svgedit.shapes = {};
    }

    // Add here the your shapes file name 
    var shapesToLoad = ['my-shapes.js', 'proc-shapes.js', 'ape-shapes.js'];

    svgedit.shapes.load = function (path, callback) {
        if (window.fuxaApeShapes)
            window.fuxaApeShapes();
        if (window.fuxaMyShapes)
            window.fuxaMyShapes();
        if (window.fuxaProcShapes)
            window.fuxaProcShapes();
            callback();
        // var progress = 0;
        // $.each(shapesToLoad, function() {
        //     var name = this;
        //     $.getScript(curConfig.shapesPath + name, function(d) {
        //         if (++progress == shapesToLoad.length) {
        //             callback();
        //         }
        //     }).fail(function(){
        //         console.log('ERROR: loading ' + curConfig.shapesPath + name);
        //         if (++progress == shapesToLoad.length) {
        //             callback();
        //         }
        //     });
        // });
        return true;
    };
}());
