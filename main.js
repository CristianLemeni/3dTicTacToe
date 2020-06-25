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

    var threeDMatrix = [];

    ticTac.initClicker();
    ticTac.addLight();

    ticTac.addCubes(0, 0, 0, cubes0);
    ticTac.moveCubesIntoPosition(cubes0, threeDMatrix);

    ticTac.addCubes(0, 0, -1, cubes1);
    ticTac.moveCubesIntoPosition(cubes1, threeDMatrix);

    ticTac.addCubes(0, 0, -2, cubes2);
    ticTac.moveCubesIntoPosition(cubes2, threeDMatrix);



    ticTac.createSurface(new THREE.PlaneBufferGeometry(10, 10), surfaceMat);


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
               }
               else if(!intersects[i].object.parent.isSVG && intersects[i].object != ticTac.meshes.surface && intersects[i].object.isFilled == false){
                var idx = ticTac.checkPlayer();
                intersects[i].object.isFilled = true;
                ticTac.markSpot(idx,intersects[i].object.position.x,
                                    intersects[i].object.position.y,
                                    intersects[i].object.position.z,
                                    intersects[i].object);
                ticTac.isPlayer1 = !ticTac.isPlayer1;
                return;
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
    }else{
        obj.geometry.dispose();
        obj.material.dispose();
    }
    scene.remove( obj );
    //renderer.renderLists.dispose();
}

var Game = function(camera, scene, render){
    this.camera = camera;
    this.scene = scene;
    this.render = render;
    this.meshes = {};
    this.isPlayer1 = true;
    this.filledCubes = {
        xs: [],
        zeros: []
    };
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

    lightHelper = new THREE.SpotLightHelper( spotLight );
    self.scene.add( lightHelper );
    

}

Game.prototype.addCubes = function(x, y, z,cubeArr){
    var self = this;
    for(var i = 0; i < 9; i++){
        var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        var cubeMat = new THREE.MeshBasicMaterial( {
                color: 0xffffff,
                wireframe: true
            } );
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

Game.prototype.moveCubesIntoPosition = function(cubeArr, threeDMatrix){
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
        self.meshes[textMesh+textMesh.id] = textMesh;
        self.scene.add( textMesh );

        if(string[stringIndx] == "x"){
            self.filledCubes.xs.push(lastSelectedCube);
        }
        else{
            self.filledCubes.zeros.push(lastSelectedCube);
        }
    } );
}

Game.prototype.checkPlayer = function(){
    var idx = this.isPlayer1 ? 0 : 1;
    return idx;
}
function render() {


    renderer.render( scene, camera );

}

init();

render();