// add the shape library: with file name as parameter (have to be unique)
(function () {
    'use strict';
    var shapesGroupName = 'My controls';     // used to organize and gropping the shapes, displayed in editor menu as label with expand/collapse 
    var typeId = 'table';              // used to identify shapes type, 'shapes' is binded with angular component 'ApeShapesComponent'
    // if you make a new type you have to implement the angular component too 

    // add in this array your schapes data, the shape object has the following attributes:
    // 'name': is unique for shape type
    // 'ico': path icon displayed in editor menu
    // 'content': array of svg element 
    // 'id': element id used if you like make a animation managed in angular component
    // 'type': svg element type (path, text, ellipse,...) see svg description
    // 'attr': element attribute, depending of type
    var html_content = [{'tag': 'span', value: 'My Table', style: 'background-color: #F0F0F0;width:calc(100% - 2px);float:left;border: 1px solid #898989' }, 
                        {'tag': 'div', 'attr': { }, style: 'height:calc(100% - 2px); width:calc(100% - 2px); border: 1px solid #7F7F7F'}];
    var shapes = [
        {
            name: 'table', ico: 'assets/lib/svgeditor/shapes/img/table.svg', content: [
                { id: '', type: 'foreignObject', 'content': html_content, 'attr': {'height': 120, 'width': 200} }]
        }]; 


    
    for (var i = 0; i < shapes.length; i++) {
        shapes[i].name = typeId + '-' + shapes[i].name;
    }
    if (svgEditor.shapesGrps[shapesGroupName]) {
        for (var i = 0; i < shapes.length; i++) {
            svgEditor.shapesGrps[shapesGroupName].push(shapes[i]);
        }
    } else {
        svgEditor.shapesGrps[shapesGroupName] = shapes;
    }
}());