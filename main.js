var init = function () {

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild( renderer.domElement );


    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 5;
    scene.add( camera );

    var controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render );
    controls.enablePan = false;

    //game materials
    var textMat = new THREE.MeshPhongMaterial({
        transparent: true
    });
    var buttnMat = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        transparent: true
    });
    var surfaceMat = new THREE.MeshPhongMaterial({ color: 0x808080 });
    
    var cubeMat = new THREE.MeshBasicMaterial( {
        color: 0xffffff,
        transparent:true,
        opacity: 0.1,
        side: THREE.DoubleSide
        //wireframe: true
    } );

    var ticTac = new Game(camera, scene, render);
    //initial screen
    var startButton = generateRoundedRect(buttnMat, ticTac.scene, {x: -1.5, y: -0.25, z: 0});
    startButton.isSVG = true;
    ticTac.addText(textMat, 'Welcome', {x: -1, y: 0, z: 0}, "startText");
   
    //game board
    var cubes0 = [];
    var cubes1 = [];
    var cubes2 = [];
    var cubes = [
        cubes0,
        cubes1,
        cubes2,
    ];
    var partialWins = [];
    var indx = 0;

    var threeDMatrix = [];

    ticTac.initClicker();
    ticTac.addLight();

   
    ticTac.createSurface(new THREE.PlaneBufferGeometry(30, 30), surfaceMat);
    

    //add events
    document.addEventListener('mousedown', function (evt) {
        ticTac.mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
        ticTac.mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
        // This is basically converting 2d coordinates to 3d Space:
        ticTac.raycaster.setFromCamera(ticTac.mouse, ticTac.camera);
        var intersects = ticTac.raycaster.intersectObjects(ticTac.scene.children, true);

       if( intersects.length > 0){
           for(var i = 0; i < intersects.length; i++){
               if(intersects[i].object.parent.isSVG){
                tweenFadeOut(intersects[i].object.parent, ticTac);
                addCube(ticTac, cubes0, cubes1, cubes2, threeDMatrix, cubeMat);
               }
               else if(!intersects[i].object.parent.isSVG &&
                        intersects[i].object != ticTac.meshes.surface &&
                        intersects[i].object.isFilled == false &&
                        intersects[i].object.visible == true){
                var idx = ticTac.checkPlayer();
                intersects[i].object.isFilled = true;
                intersects[i].object.hasGameVal = idx;
                console.log(intersects[i].object.hasGameVal);
                ticTac.markSpot(idx,intersects[i].object.position.x,
                                    intersects[i].object.position.y,
                                    intersects[i].object.position.z,
                                    intersects[i].object);
                ticTac.isPlayer1 = !ticTac.isPlayer1;
                ticTac.finish = true;
                ticTac.checkWin(intersects[i].object);
                return;
               }
                if(ticTac.checkWin()){
                 ticTac.removeGameBoard();
                 buttnMat.opacity = 1;
                 var endButton = generateRoundedRect(buttnMat, ticTac.scene, {x: -1.5, y: -0.25, z: 0});
                 endButton.isSVG = true;
                 ticTac.addText(textMat, 'You win', {x: -1, y: 0, z: 0}, "endText");
                }
               
           }            
       }
       
    });   

        

    var animate = function () {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
    };

    animate();

};
//helper functions
var setPos = function(obj, coords){
    obj.position.x = coords.x;
    obj.position.y = coords.y;
    obj.position.z = coords.z;
}

var generateRoundedRect = function(material, scene, coords){
    var loader = new THREE.SVGLoader();
    var group = new THREE.Group();
             
    var extrudeSettings = {
        curveSegments: 24,
        steps: 1,
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: -2,
        bevelOffset: 0,
        bevelSegments: 1,
        };
    // load a SVG resource
    loader.load(
        // resource URL
        'roundRect.svg',
        // called when the resource is loaded
        function ( data ) {

            var paths = data.paths;
            

            for ( var i = 0; i < paths.length; i ++ ) {

                var path = paths[ i ];

                var shapes = path.toShapes( true );

                for ( var j = 0; j < shapes.length; j ++ ) {

                    var shape = shapes[ j ];
                    var geometry = new THREE.ExtrudeBufferGeometry( shape, extrudeSettings );
                    var mesh = new THREE.Mesh( geometry, material );
                    mesh.castShadow = true;
                    group.add( mesh );

                }

            }

            group.scale.set(0.02, 0.01, 0.01);
            group.position.set(coords.x, coords.y, coords.z);
            scene.add( group );          

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }

    );
    return group;
}

var changeMaterialColor = function(obj, r, g, b){
    obj.material.color.r = r;
    obj.material.color.g = g;
    obj.material.color.b = b;
}

var tweenFadeOut = function(obj, game){

    var onComplete = function(){
        removeObject(obj, game.scene, game.render)
    }
    var removeText = function(){
        removeObject(game.meshes.startText, game.scene, game.render)
    }
    createjs.Tween.get(obj.children[0].material)
                .to({opacity:0},1000);
    
    createjs.Tween.get(obj.children[0].scale)
                .wait(200)
                .to({y:0},1000).call(onComplete);
    
               
    createjs.Tween.get(game.meshes.startText.position)
        .to({z: 5}, 1000).call(removeText);

}

var removeObject = function(obj, scene, renderer){
    if(obj.isSVG){
        obj.children[0].geometry.dispose();
        obj.children[0].material.dispose();
        scene.remove( obj );
    }
    else{
        obj.geometry.dispose();
        obj.material.dispose();
        scene.remove( obj );
    }
    
}

var addCube = function(game, arr0, arr1, arr2, bigMatrix, cubMAt){
    game.addCubes(0, 0, 0, arr0, cubMAt);
    game.moveCubesIntoPosition(arr0, bigMatrix);

    game.addCubes(0, 0, -1, arr1, cubMAt);
    game.moveCubesIntoPosition(arr1, bigMatrix);

    game.addCubes(0, 0, -2, arr2, cubMAt);
    game.moveCubesIntoPosition(arr2, bigMatrix);

    console.log(bigMatrix);
}

var checkABSVal = function(obj1, obj2){
    return Math.abs(obj1 - obj2);
}

var checkAxis = function(obj1, obj2){
    if(obj1 == obj2){
        return true;
    }
    else{
        return false;
    }
}


var shootRay = function(raycaster, origin, destination, scene, rayType){
    var xObj = [];
    var zeroObj = [];
    raycaster.set(origin,destination.normalize());
    console.log(origin,destination.normalize(), rayType);
    var intersects = raycaster.intersectObjects(scene.children, true);
    if(intersects.length > 0){
        for(var i = 0; i < intersects.length; i++){
            if(intersects[i].object.hasGameVal === 0){
                xObj.push(intersects[i].object);
            }
            if(intersects[i].object.hasGameVal === 1){
                zeroObj.push(intersects[i].object);
            }
        }
    }
    var x = Array.from(new Set(xObj));
    var zero = Array.from(new Set(zeroObj));

    if(x.length >= 3){
        console.log("X wins!", rayType);
    }
    if(zero.length >= 3){
        console.log("0 wins!", rayType);
    }
}


var Game = function(camera, scene, render){
    this.camera = camera;
    this.scene = scene;
    this.render = render;
    this.meshes = {
        "cubeArray": [],
        "filledCubes": {
            "xs": [],
            "zeros": []
        }
    };
    this.isPlayer1 = true;
    this.finish = false;
}

Game.prototype.addText = function(material, text, coords, txtKey){
    var self = this;

    var loader = new THREE.FontLoader();

    loader.load( 'three.js-master/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {

        textGeom = new THREE.TextGeometry( text, {
            font: font,
            size: 0.25,
            height: 0.1
        } );

        var textMesh = new THREE.Mesh( textGeom, material );
        setPos(textMesh, coords);
        self.meshes[txtKey] = textMesh;
        textMesh.castShadow = true;
        textMesh.position.z+= 0.1;

        scene.add( textMesh );
        changeMaterialColor(textMesh, 255,255,153);
    } );
    
}

Game.prototype.addButton = function(material, geometry, coords, btnKey){
    var self = this;

    var buttonMesh = new THREE.Mesh(geometry, material);
    setPos(buttonMesh, coords);
    self.meshes[btnKey] = buttonMesh;
    scene.add( buttonMesh );
}

Game.prototype.initClicker = function(){
    var self = this;

    self.raycaster = new THREE.Raycaster();
    self.mouse = new THREE.Vector2();
}

Game.prototype.createSurface = function(geometry, material){
    var self = this;

    var surface = new THREE.Mesh(geometry, material);
    surface.position.set( 0, - 1, 0 );
    surface.rotation.x = - Math.PI * 0.5;
    surface.receiveShadow = true;
    self.meshes["surface"] = surface;
    self.scene.add(surface);
    
}

Game.prototype.addLight = function(){
    var self = this;
    var ambient = new THREE.AmbientLight( 0xffffff, 0.1 );
    self.scene.add( ambient );
    self.meshes["ambient"] = ambient;

    var spotLight = new THREE.SpotLight( 0xffffff, 1 );

    spotLight.castShadow = true;
    spotLight.position.x -= 10;
    spotLight.position.y += 5;
    spotLight.position.z += 5;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 200;
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.05;
    spotLight.decay = 2;
    spotLight.distance = 200;  
    
    self.scene.add( spotLight );
    self.meshes["spotlight"] = spotLight;
   

}

Game.prototype.addCubes = function(x, y, z,cubeArr, cubeMat){
    var self = this;
    for(var i = 0; i < 9; i++){
        var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        var cube = new THREE.Mesh( cubeGeometry, cubeMat );
        cube.position.x = x;
        cube.position.y = y;
        cube.position.z = z;
        self.scene.add(cube);
        cubeArr.push(cube);
        cube.isFilled = false;
        cube.hasGameVal = '';
   }
}

Game.prototype.moveCubesIntoPosition = function(cubeArr, threeDMatrix, cubeArrKey){
    var self = this;
    var xdif = 0;
    threeDMatrix.push({x: cubeArr[0].position.x, y: cubeArr[0].position.y, z: cubeArr[0].position.z, value: null})//mising one
    for(var i = 1; i < 3; i++){
        cubeArr[i].position.x += 1*i;
        threeDMatrix.push({x: cubeArr[i].position.x, y: cubeArr[i].position.y, z: cubeArr[i].position.z, value: null});
    }
    for(var i = 3; i < 6; i++){
        cubeArr[i].position.x += xdif 
        cubeArr[i].position.y += 1;
        threeDMatrix.push({x: cubeArr[i].position.x, y: cubeArr[i].position.y, z: cubeArr[i].position.z, value: null})
        xdif++;
    }
    xdif = 0;
    for(var i = 6; i < 9; i++){
        cubeArr[i].position.x += xdif;
        cubeArr[i].position.y += 2;
        threeDMatrix.push({x: cubeArr[i].position.x, y: cubeArr[i].position.y, z: cubeArr[i].position.z, value: null})
        xdif++;
    }
    self.meshes.cubeArray.push(cubeArr);
}

Game.prototype.markSpot = function(stringIndx, x, y, z, lastSelectedCube){
    var self = this;
    self.X0material = new THREE.MeshBasicMaterial({
        color: 0xdddddd
    });
    self.loader = new THREE.FontLoader();
    var textGeom;
    var string = ['x', '0'];
    self.loader.load( 'three.js-master/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {

        textGeom = new THREE.TextGeometry( string[stringIndx], {
            font: font,
            size: 0.25,
            height: 0.1
        } );

        var textMesh = new THREE.Mesh( textGeom, self.X0material );
        textMesh.position.x = x;
        textMesh.position.y = y;
        textMesh.position.z = z;
        textMesh.castShadow = true;
        self.scene.add( textMesh );

        if(string[stringIndx] == "x"){
            self.meshes.filledCubes.xs.push(lastSelectedCube);
        }
        else{
            self.meshes.filledCubes.zeros.push(lastSelectedCube);
        }
    } );
}

Game.prototype.checkPlayer = function(){
    var idx = this.isPlayer1 ? 0 : 1;
    return idx;
}

Game.prototype.removeGameBoard = function(){
    var self = this;

    for ( i = self.scene.children.length - 1; i >= 0 ; i -- ) {
        obj = self.scene.children[ i ];
        if ( obj !== self.camera && obj.isSVG != true 
            && obj != self.meshes.surface && obj !== self.meshes.spotlight && obj !== self.meshes.ambient){
            self.scene.remove(obj);
        }
    }
    console.log(self.scene);
}

Game.prototype.checkWin = function(lastSelectedCube){
    var self = this;
    if(lastSelectedCube){
        //check y axis
        shootRay(self.raycaster,    new THREE.Vector3(lastSelectedCube.position.x, 0, lastSelectedCube.position.z),
                                    new THREE.Vector3(lastSelectedCube.position.x, 2, lastSelectedCube.position.z), self.scene, "Y Ray");
        //check x axis
        shootRay(self.raycaster,    new THREE.Vector3(0, lastSelectedCube.position.y, lastSelectedCube.position.z),
                                    new THREE.Vector3(2, lastSelectedCube.position.y, lastSelectedCube.position.z), self.scene, "X Ray");
        //check z axis
        shootRay(self.raycaster,    new THREE.Vector3(lastSelectedCube.position.x, lastSelectedCube.position.y, 0),
                                    new THREE.Vector3(lastSelectedCube.position.x, lastSelectedCube.position.y, -2), self.scene, "Z Ray");
        // //check outer diags
        // shootRay(self.raycaster,    new THREE.Vector3(0, 0, lastSelectedCube.position.z),
        //                             new THREE.Vector3(2, 2, lastSelectedCube.position.z), self.scene, "Outer Diag left to right Ray");
                                    
        // shootRay(self.raycaster,    new THREE.Vector3(0, 2, lastSelectedCube.position.z),
        //                             new THREE.Vector3(2, 0, lastSelectedCube.position.z), self.scene, "Outer Diag right to left Ray");
        // // //check inner diags
        // // shootRay(self.raycaster, new THREE.Vector3(0, 0, 0),
        // // new THREE.Vector3(2, 2, -2), self.scene, "Inner Diag left to right Ray");

        // // shootRay(self.raycaster, new THREE.Vector3(2, 0, 0),
        // // new THREE.Vector3(0, 2, -2), self.scene, "Inner Diag right to left Ray");

        // //check depth diags
        // shootRay(self.raycaster, new THREE.Vector3(lastSelectedCube.position.x, lastSelectedCube.position.y, 0),
        // new THREE.Vector3(lastSelectedCube.position.x, lastSelectedCube.position.y, -2), self.scene, "Depth Diag");
    }

}

Game.prototype.checkAdj = function(rec, threeDMatrix, indx){
    var self = this;
    if(rec < threeDMatrix.length - 2){
        var adjArr = [];
        var currentCube = threeDMatrix[indx];
        for(var i = 0; i < threeDMatrix.length; i++){
            if(checkABSVal(currentCube.x, threeDMatrix[i].x) < 2 &&
                checkABSVal(currentCube.y, threeDMatrix[i].y) < 2 &&
                checkABSVal(currentCube.z, threeDMatrix[i].z) < 2 &&
                currentCube != threeDMatrix[i]){
                    adjArr.push(threeDMatrix[i]);
                }
        }
        currentCube.adj = adjArr;
        indx++;
        currentCube = threeDMatrix[indx];
        self.checkAdj(indx, threeDMatrix, indx);
    }
    // if(lastSelectedCube.hasGameVal == '0'){
    //     for(var i = 0; i < filledCubes.zeros.length; i++){

    //     }
    // }
}

function render() {


    renderer.render( scene, camera );

}

init();

render();