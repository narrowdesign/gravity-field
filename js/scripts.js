let camera; 
let scene;
let renderer;

let light1;
let light2;
let light3;
let container;

let windowState = {};
let contentState = {};
let canvasState = {}

const gridDensity = 23;

const HALF_PI = Math.PI / 2;

setWindowState();
setCanvasState();


function setContentState() {
  contentState = {
    scrollHeight: document.body.getBoundingClientRect().height - windowState.height,
  }
}

function setCanvasState() {
  canvasState = {
    isInitialized: canvasState.isInitialized || false,
    earth: canvasState.earth,
    isUnlocked: canvasState.isUnlocked || false,
    mouseX: 0,
    mouseY: 0,
    view: canvasState.view || 0,
    frame: canvasState.frame || 0,
    revealFrame: canvasState.revealFrame || 0,
    scaleX: windowState.width / windowState.devScreenW,
    scaleY: windowState.height / windowState.heightScale / windowState.devScreenH,
    scaleAspect: windowState.aspect / windowState.devScreenAspect,
    boxScaleX: undefined,
    boxScaleY: undefined,
    vX: 0,
    vY: 0,
    vZ: 0,
    rowCount: gridDensity,
    colCount: gridDensity,
    layerCount: gridDensity,
    particleCount: gridDensity * gridDensity * gridDensity,
    particleSpread: 11,
    friction: 0.95,
    gravity: 9.8 / 120 / 60,
    moonGravity: 9.8 / 120 / 60 / 7,
    particles: [],
    earthGravityLines: canvasState.earthGravityLines || new THREE.Group(),
    earthGravityLinesLat: canvasState.earthGravityLinesLat || new THREE.Group(),
    earthGravityLinesLng: canvasState.earthGravityLinesLng || new THREE.Group(),
    vectorsContainer: canvasState.vectorsContainer || new THREE.Group(),
    particlesContainer: canvasState.particlesContainer || new THREE.Group()
  }
}

setTimeout(() => {
  init()
}, 200);

function handleScroll() {
  windowState.isScrolling = true;
  clearTimeout(windowState.scrollTimeout)
  windowState.scrollTimeout = setTimeout(() => {
    windowState.isScrolling = false;
  }, 300)
  let oldScrollY = windowState.scrollY
  windowState.scrollY = window.scrollY;
}

function init() {
  canvasState.isInitialized = true;
  canvasState.frame = 0;
  
  createScene();
  handleResize();
  createCamera();
  createLights();
  createRenderer();
  addEventListeners();
  createEarth();
  createParticles();

  animate(100, 0);
}

function createScene() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );
  scene = new THREE.Scene();
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer( { 
    antialias: true,
    // preserveDrawingBuffer: true
  } );
  renderer.setPixelRatio( 1 );
  renderer.setSize( window.innerWidth, windowState.height );
  scene.background = new THREE.Color(0xDBC075);

  container.appendChild( renderer.domElement );

  renderer.outputEncoding = THREE.sRGBEncoding;
}

function createCamera() {
  camera = new THREE.PerspectiveCamera( 34.6, windowState.width / windowState.height, 0.01, 5000 );
  camera.aspect = windowState.width / windowState.height;
  camera.position.z = 13.5;
  camera.lookAt(0,0,0)

  scene.add( camera );
}

function createLights() {
  scene.add( new THREE.AmbientLight( 0xffffff, 0.11 ) );

  canvasState.lights = new THREE.Group();

  scene.add(canvasState.lights)
}

function createEarth() {
  const earthTextureMap = new THREE.TextureLoader().load('../map.png')
  earthTextureMap.anisotropy = 10;
  const earthGeometry = new THREE.SphereGeometry(1, 112, 112);
  const earthMaterial = new THREE.MeshBasicMaterial({
    map: earthTextureMap,
    color: 0x000000,
    transparent: true,
    alphaTest: 0.5,
  });
  const earthOutlineGeometry = new THREE.RingGeometry(1, 1.015, 80, 3);
  const earthOutlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x020102,
    transparent: true,
    // opacity: 0.2
  });
  const earthFillMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xDBC075).convertSRGBToLinear(),
  })
  canvasState.earth = new THREE.Mesh(earthGeometry, earthMaterial);
  canvasState.earthFill = new THREE.Mesh(earthGeometry, earthFillMaterial);
  canvasState.earthOutline = new THREE.Mesh(earthOutlineGeometry, earthOutlineMaterial);
  canvasState.earth.rotation.y = -Math.PI
  scene.add(canvasState.earthOutline);
  scene.add(canvasState.earthFill);
  scene.add(canvasState.earth);

  for (let i=0; i < 12; i++) {
    const earthGravityGeometry = new THREE.RingGeometry(0.9 + i / 1.5 + 0.75, 0.9 + i / 1.5 + 0.759, 80 + i, 12);
    const earthGravityMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa0000,
      transparent: true,
      side: THREE.DoubleSide
    });
    const earthGravityMaterialLat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      side: THREE.DoubleSide
    });
    const earthGravityMaterialLng = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide
    });
    canvasState[`earthGravity${i}`] = new THREE.Mesh(earthGravityGeometry, earthGravityMaterial);
    canvasState[`earthGravityLat${i}`] = new THREE.Mesh(earthGravityGeometry, earthGravityMaterialLat);
    canvasState[`earthGravityLng${i}`] = new THREE.Mesh(earthGravityGeometry, earthGravityMaterialLng);
    
    canvasState.earthGravityLines.add(canvasState[`earthGravity${i}`]);
    canvasState.earthGravityLinesLat.add(canvasState[`earthGravityLat${i}`]);
    canvasState.earthGravityLinesLng.add(canvasState[`earthGravityLng${i}`]);
    canvasState[`earthGravityLat${i}`].rotation.x = Math.PI / 2;
    canvasState[`earthGravityLng${i}`].rotation.y = Math.PI / 2;
  }
  scene.add(canvasState.earthGravityLines)
  // scene.add(canvasState.earthGravityLinesLat)
  // scene.add(canvasState.earthGravityLinesLng)
  const moonTextureMap = new THREE.TextureLoader().load('../moon.png')
  moonTextureMap.anisotropy = 10;
  canvasState.moonContainer = new THREE.Group();
  const moonGeometry = new THREE.SphereGeometry(0.27, 60, 60);
  const moonMaterial = new THREE.MeshBasicMaterial({
    map: moonTextureMap,
    color: 0x020102,
    transparent: true,
  });
  const moonOutlineGeometry = new THREE.RingGeometry(0.27, 0.28, 60, 3);
  const moonOutlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x020102,
    transparent: true,
  });

  canvasState.moonOutline = new THREE.Mesh(moonOutlineGeometry, moonOutlineMaterial);
  canvasState.moon = new THREE.Mesh(moonGeometry, moonMaterial);
  canvasState.moonContainer.add(canvasState.moonOutline)
  canvasState.moonContainer.add(canvasState.moon)
  scene.add(canvasState.moonContainer);
  
  canvasState.moon.position.x = 60;
  canvasState.moonOutline.position.x = 60;
}

function createParticles() {
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0x020102,
  });
  const particleGeometry = new THREE.SphereBufferGeometry(0.005, 4, 4);

  const vectorMaterial = new THREE.MeshBasicMaterial({
    color: 0x020102, 
    
  });
  for (let i = 0; i < canvasState.particleCount; i++) {
    const vectorGeometry = new THREE.ConeBufferGeometry(0.006, .04, 6);
    const vector = new THREE.Mesh(vectorGeometry, vectorMaterial);
    const vectorContainer = new THREE.Group();
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    resetParticle(vector, i)
    // resetParticle(particle, i)
    // vector.rotation.y = -Math.PI / 2;
    vector.geometry.rotateX( -Math.PI / 2 );
    
    const vDist = Math.sqrt(Math.pow(vector.position.x, 2) + Math.pow(vector.position.y, 2) + Math.pow(vector.position.z, 2));
    vector.lookAt(0,0,0);
    vector.scale.set(1,1,Math.pow(5 / vDist, 2));
    canvasState.particlesContainer.add(particle);
    vectorContainer.add(vector);
    canvasState.vectorsContainer.add(vectorContainer);
    canvasState.particles.push(vector)
    scene.add(canvasState.particlesContainer)
    scene.add(canvasState.vectorsContainer)
  }
}

function resetParticle(particle, i) {
  const col = i % canvasState.colCount;
  const row = Math.floor(i / canvasState.colCount) % canvasState.rowCount
  const layer = Math.floor(i / (canvasState.colCount * canvasState.rowCount))
  particle.position.x = col / canvasState.colCount * canvasState.particleSpread - canvasState.particleSpread / 2;
  particle.position.y = row / canvasState.rowCount * canvasState.particleSpread - canvasState.particleSpread / 2;
  particle.position.z = layer / canvasState.layerCount * canvasState.particleSpread - canvasState.particleSpread / 2;
  particle.scale.set(0,0,0);
  particle.lookAt(0,0,0);
  particle.userProps = {
    vX: 0,
    vY: 0,
    vZ: 0,
    scale: 0,
  }
}

function handleResize() {
  const newWidth = window.innerWidth - windowState.scrollbarWidth;
  if (canvasState.isInitialized && windowState.width === newWidth && windowState.isSmallScreen) return;
  windowState.isSmallScreen = newWidth < 1000;
  setWindowState();
  setContentState();
  setCanvasState();
  windowState.width = newWidth;
  windowState.heightScale = windowState.isSmallScreen ? 1.2 : 1;
  windowState.height = window.innerHeight * windowState.heightScale;
  document.body.style.setProperty('--screenHeight', windowState.height);
  if (!camera) return;
  camera.aspect = windowState.width / windowState.height;
  camera.updateProjectionMatrix();
  renderer.setSize( windowState.width, windowState.height );
}

function setWindowState() {
  windowState = {
    width: window.innerWidth,
    height: window.innerHeight,
    heightScale: windowState.heightScale || 1,
    scrollY: window.scrollY,
    mouseX: 0,
    mouseY: 0,
    isSmallScreen: false,
    isMouseDown: false,
    devScreenW: 1680,
    devScreenH: 915,
    devScreenAspect: undefined,
    aspect: undefined,
    scrollbarWidth: window.innerWidth - document.querySelector('body').offsetWidth,
    scrollTimeout: undefined
  }

  windowState.isSmallScreen = windowState.width < 1000;
  windowState.devScreenAspect = windowState.devScreenW / windowState.devScreenH;
  windowState.aspect = windowState.width / windowState.height;
  windowState.heightScale = windowState.isSmallScreen ? 1.2 : 1;
  windowState.height = windowState.height * windowState.heightScale;
}

function addEventListeners() {
  window.addEventListener('resize', handleResize );
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  window.addEventListener('scroll', () => {
    requestAnimationFrame(handleScroll);
  });
}

function handleKeydown(e) {
  switch (e.key) {
    case 'ArrowUp':
      canvasState.isForwardMotion = true;
      break;
    case 'ArrowDown':
      canvasState.isBackwardMotion = true;
      break;
    case 'ArrowLeft':
      canvasState.isLeftMotion = true;
      break;
    case 'ArrowRight':
      canvasState.isRightMotion = true;
      break;
    case ' ':
      canvasState.isJumping = true;
      break;
    }
  }
  
  function handleKeyup(e) {
    switch (e.key) {
      case 'ArrowUp':
        canvasState.isForwardMotion = false;
        break;
      case 'ArrowDown':
        canvasState.isBackwardMotion = false;
        break;
      case 'ArrowLeft':
        canvasState.isLeftMotion = false;
        break;
      case 'ArrowRight':
        canvasState.isRightMotion = false;
        break;
  }
}

function handleMouseMove(e) {
  windowState.mouseX = (e.pageX - windowState.width / 2) / windowState.width;
  windowState.mouseY = (e.pageY - windowState.scrollY - windowState.height / 2) / windowState.height;
}

function handleMouseDown() {
  windowState.isMouseDown = true;
}

function handleMouseUp() {
  windowState.isMouseDown = false;
}


function animate(now, then) {
  const elapsed = now - then;
  const frameDuration = windowState.isScrolling ? 16 : 16;
  if (elapsed >= frameDuration) {

    renderer.render( scene, camera );
    canvasState.particles.forEach((particle, i) => {
      const earthDist = Math.sqrt(Math.pow(particle.position.x, 2) + Math.pow(particle.position.y, 2) + Math.pow(particle.position.z, 2));
      const moonDist = Math.sqrt(Math.pow(canvasState.moon.position.x - particle.position.x, 2) + Math.pow(canvasState.moon.position.y - particle.position.y, 2) + Math.pow(canvasState.moon.position.z - particle.position.z, 2));
      const aX = particle.position.x * canvasState.gravity / (earthDist * earthDist)// - ((canvasState.moon.position.x - particle.position.x) * canvasState.moonGravity / (moonDist * moonDist * 4));
      const aY = particle.position.y * canvasState.gravity / (earthDist * earthDist)// - ((canvasState.moon.position.y - particle.position.y) * canvasState.moonGravity / (moonDist * moonDist * 4));
      const aZ = particle.position.z * canvasState.gravity / (earthDist * earthDist)// - ((canvasState.moon.position.z - particle.position.z) * canvasState.moonGravity / (moonDist * moonDist * 4));
      if (earthDist < 0.5) {
        resetParticle(particle, i);
      } else {
        const speed = Math.sqrt(Math.pow(particle.userProps.vX, 2) + Math.pow(particle.userProps.vY, 2) + Math.pow(particle.userProps.vZ, 2));
        particle.userProps.vX += aX;
        particle.userProps.vY += aY;
        particle.userProps.vZ += aZ;
        particle.position.x -= particle.userProps.vX;
        particle.position.y -= particle.userProps.vY;
        particle.position.z -= particle.userProps.vZ;
        particle.userProps.scale += 0.1;
        let scale = Math.min(1, particle.userProps.scale);
        if (earthDist > canvasState.particleSpread / 2) {
          // scale = 0;
        }
        particle.scale.set(scale,scale,speed * 200 - 0.5);
      }
    })
    canvasState.earth.rotation.x += 0.4 * (windowState.mouseY * Math.PI - canvasState.earth.rotation.x);
    canvasState.earth.rotation.y += 0.4 * (windowState.mouseX * Math.PI - 0.8 - canvasState.earth.rotation.y);
    canvasState.vectorsContainer.rotation.x += 0.4 * (windowState.mouseY * Math.PI - canvasState.vectorsContainer.rotation.x);
    canvasState.vectorsContainer.rotation.y += 0.4 * (windowState.mouseX * Math.PI - canvasState.vectorsContainer.rotation.y);
    canvasState.particlesContainer.rotation.x += 0.4 * (windowState.mouseY * Math.PI - canvasState.particlesContainer.rotation.x);
    canvasState.particlesContainer.rotation.y += 0.4 * (windowState.mouseX * Math.PI - canvasState.particlesContainer.rotation.y);
    canvasState.earthGravityLines.rotation.x += 0.4 * (windowState.mouseY * Math.PI - canvasState.earthGravityLines.rotation.x);
    canvasState.earthGravityLines.rotation.y += 0.4 * (windowState.mouseX * Math.PI - canvasState.earthGravityLines.rotation.y);
    canvasState.earthGravityLinesLat.rotation.x += 0.4 * (windowState.mouseY * Math.PI - canvasState.earthGravityLinesLat.rotation.x);
    canvasState.earthGravityLinesLat.rotation.y += 0.4 * (windowState.mouseX * Math.PI - canvasState.earthGravityLinesLat.rotation.y);
    canvasState.earthGravityLinesLng.rotation.y += 0.4 * (windowState.mouseX * Math.PI - canvasState.earthGravityLinesLng.rotation.y);
    canvasState.earthGravityLinesLng.rotation.x += 0.4 * (windowState.mouseY * Math.PI - canvasState.earthGravityLinesLng.rotation.x);
    
    // canvasState.moonContainer.rotation.y += 0.005;
    // canvasState.moon.rotation.y += 0.00125;
    
  } else {
    now = then;
  }

  requestAnimationFrame( (next) => { animate(next, now)} );

}