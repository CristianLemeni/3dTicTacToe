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

    var ticTac = new Game(camera, scene, render);
    //initial screen
    var startButton = generateRoundedRect(ticTac.buttnMat, ticTac.scene, {x: -1.5, y: -0.25, z: 0});
    startButton.userData.isSVG = true;
    ticTac.addText(ticTac.textMat, 'Welcome', {x: -1, y: 0, z: 0}, "startText");
    
    var string = ['x', 'o'];
    ticTac.initClicker();
    ticTac.addLight();
    initScore(ticTac);
    
   
    ticTac.createSurface(new THREE.PlaneBufferGeometry(30, 30), ticTac.surfaceMat);
    ticTac.addbackground();

    //add events
    document.addEventListener('mousedown', function (evt) {
        gameLoop(ticTac, evt, string, false);       
    }); 

    document.addEventListener('touchstart', function (evt) {
        gameLoop(ticTac, evt, string, true);       
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
        if(!game.finish){
            removeObject(game.meshes.startText, game.scene, game.render)
        } 
        if(game.finish){
            removeObject(game.meshes.endText, game.scene, game.render)
            game.finish = false;
        }
        
    }
    createjs.Tween.get(obj.children[0].material)
                .to({opacity:0},1000);
    
    createjs.Tween.get(obj.children[0].scale)
                .wait(200)
                .to({y:0},1000).call(onComplete);
    
    if(!game.finish){
        createjs.Tween.get(game.meshes.startText.position)
        .to({z: 5}, 1000).call(removeText);
    }
    if(game.finish){
        createjs.Tween.get(game.meshes.endText.position)
        .to({z: 5}, 1000).call(removeText);
    }
    

}

var removeObject = function(obj, scene, renderer){
    if(obj.userData.isSVG){
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

var initScore = function(game){
    game.addText(game.textMat, "Score X " + game.xscore, {x: 4, y: 3, z: 0}, "scoreTextX");    
    game.addText(game.textMat, "Score O " + game.oscore, {x: 4, y: 1, z: 0}, "scoreTextO"); 
}

var gameLoop = function(game, evt, string, isTouch){
    if(!isTouch){
        game.mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
        game.mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
    }
    if(isTouch){
        game.mouse.x = (evt.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
        game.mouse.y = -(evt.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
    }
    // This is basically converting 2d coordinates to 3d Space:
    game.raycaster.setFromCamera(game.mouse, game.camera);
    var intersects = game.raycaster.intersectObjects(game.scene.children, true);

    if( intersects.length > 0){
        for(var i = 0; i < intersects.length; i++){
            if(intersects[i].object.parent.userData.isSVG){
            tweenFadeOut(intersects[i].object.parent, game);
            addCube(game, game.cubes0, game.cubes1, game.cubes2, game.threeDMatrix, game.cubeMat);
            }
            else if(!intersects[i].object.parent.userData.isSVG &&
                    intersects[i].object != game.meshes.surface &&
                    intersects[i].object.visible == true && intersects[i].object.userData.isFilled == false){
                        var idx = game.checkPlayer();
                        intersects[i].object.userData.isFilled = true;
                        intersects[i].object.userData.value = string[idx];
                        game.markSpot(string[idx],intersects[i].object.position.x,
                                    intersects[i].object.position.y,
                                    intersects[i].object.position.z,
                                    intersects[i].object);
                                    game.isPlayer1 = !game.isPlayer1;
                        return;
               }               
           }            
       }
}
//debug only
var geometry = new THREE.SphereGeometry( 0.05, 32, 32 );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );


var shootRay = function(raycaster, origin, destination, scene, game, debug){
    var xObj = [];
    var zeroObj = [];
    raycaster.set(origin,destination.normalize());
    //console.log(origin,destination.normalize(), rayType);
    var intersects = raycaster.intersectObjects(scene.children, true);
    //scene.add(new THREE.ArrowHelper( raycaster.ray.direction, raycaster.ray.origin, 100, Math.random() * 0xffffff ));
    if(intersects.length > 0){
        for(var i = 0; i < intersects.length; i++){
            if(intersects[i].object.userData.hasGameVal == "x"){
                xObj.push(intersects[i].object);
            }
            if(intersects[i].object.userData.hasGameVal == "o"){
                zeroObj.push(intersects[i].object); 
            }
        }
    }
    var x = Array.from(new Set(xObj));
    var zero = Array.from(new Set(zeroObj));

    if(x.length >= 3){
        game.finish = true;
        console.log(x);
        if(debug){
            for(var i = 0; i < x.length; i++){
                var sphere = new THREE.Mesh( geometry, material );
                sphere.position.x = x[i].position.x;
                sphere.position.y = x[i].position.y;
                sphere.position.z = x[i].position.z;
                scene.add( sphere );
            }
        }
        return true;
    }
    if(zero.length >= 3){
        game.finish = true;
        console.log(zero);
        for(var i = 0; i < zero.length; i++){
            var sphere = new THREE.Mesh( geometry, material );
            sphere.position.x = x[i].position.x;
            sphere.position.y = x[i].position.y;
            sphere.position.z = x[i].position.z;
            scene.add( sphere );
        }
        return true;
    }
    else{
        return false;
    }
}



var checkCol = function(obj1, obj2, obj3){
   var v1 = new THREE.Vector3(obj2.x - obj1.x, obj2.y - obj1.y, obj2.z - obj1.z);
   var v2 = new THREE.Vector3(obj3.x - obj1.x, obj3.y - obj1.y, obj3.z - obj1.z);
  //https://www.symbolab.com/solver/vector-cross-product-calculator   
  var rez = new THREE.Vector3(v1.y*v2.z - v1.z*v2.y, v1.z*v2.x - v1.x*v2.z, v1.x*v2.y - v1.y*v2.x);
   if (rez.x == 0 && rez.y == 0 && rez.z == 0){
       return true;
   }
   else{
       return false;
   }
}

var endgame = function(game){
    game.removeGameBoard();
    game.buttnMat.opacity = 1;
    var endButton = generateRoundedRect(game.buttnMat, game.scene, {x: -1.5, y: -0.25, z: 0});
    endButton.userData.isSVG = true;
    var idx = game.checkPlayer();
    game.addText(game.textMat, 'Player ' +idx +' wins', {x: -1.3, y: 0, z: 0}, "endText");

    initScore(game);
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
    this.Xmaterial = new THREE.MeshBasicMaterial({
        color: 0xe6e600
    });
    this.Zeromaterial = new THREE.MeshBasicMaterial({
        color: 0xe67300
    });
    this.buttnMat = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        transparent: true
    });
    this.textMat = new THREE.MeshPhongMaterial({
        transparent: true
    });

    this.surfaceMat = new THREE.MeshPhongMaterial({ color: 0x808080 });
    
    this.cubeMat = new THREE.MeshBasicMaterial( {
        color: 0xffffff,
        transparent:true,
        opacity: 0.1,
       // side: THREE.DoubleSide
        //wireframe: true
    } );
    //game board
    this.cubes0 = [];
    this.cubes1 = [];
    this.cubes2 = [];
    this.threeDMatrix = [];
    this.xscore = 0;
    this.oscore = 0;
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
    spotLight.distance = 100;  
    
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
        cube.userData.isFilled = false;
        cube.userData.value = null;
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

Game.prototype.markSpot = function(string, x, y, z, lastSelectedCube){
    var self = this;
    self.loader = new THREE.FontLoader();
    var textGeom;
    self.loader.load( 'three.js-master/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {

        textGeom = new THREE.TextGeometry( string, {
            font: font,
            size: 0.25,
            height: 0.1
        } );
        if(self.isPlayer1){
            var textMesh = new THREE.Mesh( textGeom, self.Xmaterial);
        }else{
            var textMesh = new THREE.Mesh( textGeom, self.Zeromaterial);
        }
        
        textMesh.position.x = x - 0.04;//to make sure it itersects
        textMesh.position.y = y - 0.02;//to make sure it itersects
        textMesh.position.z = z - 0.02;//to make sure it itersects
        textMesh.castShadow = true;
        textMesh.userData.hasGameVal = string;
        self.scene.add( textMesh );

        if(string == "x"){
            self.meshes.filledCubes.xs.push(lastSelectedCube);
            lastSelectedCube.userData.value = 'x';
        }
        else{
            self.meshes.filledCubes.zeros.push(lastSelectedCube);
            lastSelectedCube.userData.value = 'zero';
        }
        console.log(self.meshes.filledCubes);
        if(self.meshes.filledCubes.xs.length > 2){
            self.checkWinWithMath(lastSelectedCube);
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
    self.cubes0 = [];
    self.cubes1 = [];
    self.cubes2 = [];
}

Game.prototype.checkWin = function(lastSelectedCube){
    var self = this;

    if(lastSelectedCube){
        //check y axis
        if(shootRay(self.raycaster, new THREE.Vector3(lastSelectedCube.position.x, 0, lastSelectedCube.position.z),
                                    new THREE.Vector3(0, 1, 0), self.scene, self)){
              return true;
        }
        //check x axis
        if(shootRay(self.raycaster, new THREE.Vector3(0, lastSelectedCube.position.y, lastSelectedCube.position.z),
                                    new THREE.Vector3(1, 0, 0), self.scene, self)){
                return true;
        }
        //check z axis
        if(shootRay(self.raycaster, new THREE.Vector3(lastSelectedCube.position.x, lastSelectedCube.position.y, 0),
                                    new THREE.Vector3(0, 0, -1), self.scene, self)){
                return true;
        }
        //check outer diags
        if(shootRay(self.raycaster, new THREE.Vector3(0, 0, lastSelectedCube.position.z),
                                    new THREE.Vector3(0.5, 0.5, 0), self.scene, self)){
                return true;
        }
        if(shootRay(self.raycaster, new THREE.Vector3(2, 0, lastSelectedCube.position.z),
                                    new THREE.Vector3(-0.5, 0.5, 0), self.scene, self)){
                return true;
        }
        //check inner diags
        if(shootRay(self.raycaster, new THREE.Vector3(0, 0, 0),
                                    new THREE.Vector3(0.5, 0.5, -0.5), self.scene, self)){
                return true;
        }
        if(shootRay(self.raycaster, new THREE.Vector3(0, 2, 0),
                                    new THREE.Vector3(0.5, -0.5, -0.5), self.scene, self)){
                return true;
        }
        if(shootRay(self.raycaster, new THREE.Vector3(2, 0, 0),
                                    new THREE.Vector3(-0.5, 0.5, -0.5), self.scene, self)){
                return true;
        }
        if(shootRay(self.raycaster, new THREE.Vector3(2, 2, 0),
                                    new THREE.Vector3(-0.5, -0.5, -0.5), self.scene, self)){
                return true;
        }
        //check depth diags
        if(shootRay(self.raycaster, new THREE.Vector3(lastSelectedCube.position.x, 0, 0),
                                    new THREE.Vector3(0, 0.5, -0.5), self.scene, self)){
                return true;
        }
        if(shootRay(self.raycaster, new THREE.Vector3(lastSelectedCube.position.x, 0, -2),
                                    new THREE.Vector3(0, 0.5, 0.5), self.scene, self)){
                return true;
        }
    }
   

}

Game.prototype.checkWinWithMath = function(lastSelectedCube){
    var self = this;
    if(lastSelectedCube.userData.value == 'x'){
        for(var i = 0; i < self.meshes.filledCubes.xs.length - 2; i++){
            if(checkCol(lastSelectedCube.position, self.meshes.filledCubes.xs[i].position, self.meshes.filledCubes.xs[i+1].position)){
                console.log("X WIN");
                self.finish = true;
                self.xscore++;
                endgame(self);
                return true;
            }
        }
    }
    if(lastSelectedCube.userData.value == 'zero'){
        for(var i = 0; i < self.meshes.filledCubes.zeros.length - 2; i++){
            if(checkCol(lastSelectedCube.position, self.meshes.filledCubes.zeros[i].position, self.meshes.filledCubes.zeros[i+1].position)){
                console.log("O WIN");
                self.finish = true;
                self.oscore++;
                endgame(self);
                return true;
            }
        }
    }
    else{
        return false;
    }

}

Game.prototype.addbackground = function(){
    var self = this;
    self.background = {};
    var loader = new THREE.TextureLoader();

    var geometryStars = new THREE.SphereGeometry( 200, 32, 32 );
    var materialStars = new THREE.MeshPhongMaterial( {
        map: loader.load('img/2k_stars.jpg'),
        side: THREE.BackSide
    });
    var stars = new THREE.Mesh( geometryStars, materialStars );
    self.scene.add( stars );
    self.background['stars'] = stars;

   
}

function render() {


    renderer.render( scene, camera );

}

init();

render();