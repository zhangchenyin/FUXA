
class FuxaBridge {
    disposing = false;
    constructor(id) {
        this._id = id;
    }

    get id() {
        return this._id;
    }

    invoke = (func, arg) => {
        if (typeof func === "function" && !this.disposing) {
            return func(arg);
        }
        return
    }

    // Triggers Fuxa to reload the project. In the (re)load flow Fuxa will invoke the 'onRefreshProject' callback and receives the actual project JSON.
    refreshProject = () => {
        addToLogger(`APP invoke refreshProject to FUXA ${this.id}`);
        return this.invoke(this.onRefreshProject);
    }

    onRefreshProject = function () {
        addToLogger('onRefreshProject NOT supported!');
        console.log("onRefreshProject NOT supported!");
    }

    // This callback gets invoked when Fuxa loads the project
    loadProject = () => {
        addToLogger(`FUXA ${this.id} invoke loadProject`);
        return this.invoke(this.onLoadProject);
    }

    onLoadProject = function () {
        addToLogger('onLoadProject NOT supported!');
        console.log("onLoadProject NOT supported!");
    };

    saveProject = (project) => {
        addToLogger(`FUXA ${this.id} invoke saveProject`);
        return this.invoke(this.onSaveProject, project);
    }

    // This callback gets invoked when Fuxa saves the project
    onSaveProject = function () {
        addToLogger('onSaveProject NOT supported!');
        console.log("onSaveProject NOT supported!");
    }
}

class FuxaBridgeManager {
    bridges = {};

    createBridge = (widgetId) => {
        let bridge = this.bridges[widgetId];
        if (!bridge) {
            bridge = new FuxaBridge(widgetId);
            this.bridges[widgetId] = bridge;
            // this.bridge.onRefreshProject = () => {
            //     console.log("onLoad Project is running")
            //     return this.workModel.project// return the project from the work model
            // }
        }
        return bridge;
    }

    getBridge = (widgetId) => {
        return this.bridges[widgetId];
    }

    removeBridge = (widgetId) => {
        const bridge = this.bridges[widgetId];
        if (bridge) bridge.disposing = true
        delete this.bridges[widgetId];
    }
}

const fuxaBridgeManager = new FuxaBridgeManager();

function addToLogger(msg) {
    var logger = document.getElementById("logger");
    document.querySelector('#logger').innerHTML += '<span style="font-size: 10px;display:block;">' + msg + '</span>'; 
}

function refresh(id) {
    const bridge = fuxaBridgeManager.getBridge('fuxa' + id);
    if (bridge) {
        addToLogger(`APP command refresh FUXA ${bridge.id}`);
        console.log(`APP command refresh FUXA ${bridge.id}`);
        let r = bridge.refreshProject();
    }
}

function closeWidget(id) {
    var el = document.getElementById(id);
    el.remove();
    fuxaBridgeManager.removeBridge('fuxa' + id);
}

function create(id) {
    const tbridge = fuxaBridgeManager.getBridge('fuxa' + id);
    if (tbridge) {
        dragElement(document.getElementById("mydiv" + id));
        return;
    }
    const bridge = fuxaBridgeManager.createBridge('fuxa' + id);
    bridge.onLoadProject = () => {
        addToLogger(`FUXA ${bridge.id} query project to load`);
        console.log(`FUXA ${bridge.id} query project to load`);
        let prj = localStorage.getItem(bridge.id);
        return JSON.parse(prj);
        // return 'prj: ' + bridge._id;
    }

    bridge.onSaveProject = (project) => {
        if (project) {
            addToLogger(`FUXA ${bridge.id} ask to save project`);
            console.log(`FUXA ${bridge.id} ask to save project`);
            localStorage.setItem(bridge.id, JSON.stringify(project));
            return true;// return if it's saved
        }
        return false;
    }
    document.body.innerHTML += `
        <div id="mydiv${id}" style="position: absolute; z-index: 9; background-color: #f1f1f1; border: 1px solid #d3d3d3;">
            <div id="mydiv${id}header" style="padding: 10px; cursor: move; z-index: 10; background-color: #2196F3; color: #fff;">Click here to move
                <div style="float: right; cursor: pointer;" onclick="closeWidget('mydiv${id}')">X</div>
            </div>
            <div style="position: relative; width:1000px; height: 900px">
                <app-fuxa id="fuxa${id}">
                    <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);">
                        <div class="logo" style="display: inline-block;width:40px;height:40px;background-size:40px 40px;"></div>
                        <div style="display: inline-block;padding-left:10px">
                            <div style="display:inline-block;font-size: 18px">FUXA Loading...</div>
                            <div style="display: block;font-size: 9px;padding-top: 3px;">
                                powered by <span><b>frango</b>team</span>
                            </div>
                        </div>
                    </div>
                </app-fuxa>
            </div>
        </div>`;
    dragElement(document.getElementById("mydiv" + id));
    const fuxa = document.querySelector('#fuxa' + id);
    fuxa.bridge = bridge; // It works!    
    // setTimeout(() => {
    //     const fuxa = document.querySelector('#fuxa' + id);
    //     fuxa.bridge = bridge; // It works!    
    // }, 100);
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}