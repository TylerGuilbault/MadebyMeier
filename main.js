// main.js — basic 3D + video texture + click / navigation logic

// Global state
const state = {
  activeItem: null,
  cameraState: null
};

// Helpers to show/hide UI
function show(element) {
  element.classList.remove('hidden');
}
function hide(element) {
  element.classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('three-canvas');
  const backBtn = document.getElementById('back-button');
  const buyBtn = document.getElementById('buy-button');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 3);

  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  // Create a video element
  const video = document.createElement('video');
  video.src = 'assets/sample-video.mp4';  // add your sample video in assets/
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;

  // A cube as placeholder item
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ map: videoTexture });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Raycasting for click detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onClick(evt) {
    mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (evt.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([cube]);
    if (intersects.length > 0) {
      // Activate this item
      state.activeItem = {
        mesh: cube,
        // any metadata, e.g. Shopify product link
        buyLink: 'https://yourshop.myshopify.com/products/your-product-slug'
      };
      video.play();
      show(buyBtn);
      show(backBtn);
      // save camera state
      state.cameraState = {
        pos: camera.position.clone(),
        rot: camera.rotation.clone()
      };
      history.pushState({ item: true }, '', '#item');
    }
  }

  function onPopState(evt) {
    if (evt.state && evt.state.item) {
      // we’re going to an item view; nothing special
    } else {
      // going back from item view
      if (state.cameraState) {
        camera.position.copy(state.cameraState.pos);
        camera.rotation.copy(state.cameraState.rot);
      }
      video.pause();
      hide(buyBtn);
      hide(backBtn);
      state.activeItem = null;
    }
  }

  backBtn.addEventListener('click', () => {
    history.back();
  });

  buyBtn.addEventListener('click', () => {
    if (state.activeItem && state.activeItem.buyLink) {
      window.location.href = state.activeItem.buyLink;
    }
  });

  window.addEventListener('click', onClick);
  window.addEventListener('popstate', onPopState);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.y += 0.005;
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      videoTexture.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  animate();
});
