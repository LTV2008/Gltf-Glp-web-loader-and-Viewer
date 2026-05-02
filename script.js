// ========================================================
// 3D VIEWER APPLICATION - SCENE SETUP
// ========================================================
// This section initializes the Three.js scene, camera, and renderer

// Create the main 3D scene
const scene = new THREE.Scene();
// Set light gray background color for better visibility
scene.background = new THREE.Color(0xeeeeee);

// Create perspective camera with 75-degree field of view
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Position camera to have a good view of loaded models
camera.position.set(0, 1, 5);

// Create WebGL renderer with anti-aliasing for smooth graphics
const renderer = new THREE.WebGLRenderer({ antialias: true });
// Append the rendering canvas to the viewer container DOM element
document.getElementById('viewer-container').appendChild(renderer.domElement);

// ========================================================
// CAMERA CONTROLS - ORBIT CONTROLS FOR MOUSE INTERACTION
// ========================================================
// Enable users to rotate, zoom, and pan the 3D model with mouse

const controls = new THREE.OrbitControls(camera, renderer.domElement);
// Smooth damping effect when rotating/zooming
controls.enableDamping = true;

// ========================================================
// LIGHTING SETUP
// ========================================================
// Add ambient and directional lights for realistic 3D rendering

// Ambient light: soft light from all directions
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional light: main light source simulating sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// ========================================================
// GLOBAL STATE VARIABLES
// ========================================================
// Track loaded model and its materials for switching view modes

let loadedModel = null;  // Reference to currently loaded 3D model
let modelMaterials = [];  // Array storing original materials for texture view

// ========================================================
// DOM ELEMENT REFERENCES
// ========================================================
// Cache references to frequently used DOM elements

const fileInput = document.getElementById('file-input');
const loadingIndicator = document.getElementById('loading-indicator');
const urlInput = document.getElementById('url-input');
const loadUrlButton = document.getElementById('load-url-button');

// ========================================================
// FILE UPLOAD HANDLER
// ========================================================
// Handle file selection and loading

// Click handler for file button
document.getElementById('file-button').addEventListener('click', function () {
    // Trigger the hidden file input
    fileInput.click();
});

// Change handler for file input
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Extract and display file information
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert bytes to MB
    document.getElementById('file-name').textContent = `File Name: ${fileName}`;
    document.getElementById('file-size').textContent = `File size: ${fileSize} MB`;

    // Show loading indicator while processing
    loadingIndicator.style.display = 'block';

    // Read file as binary array buffer
    const reader = new FileReader();
    reader.onload = function (e) {
        // Create GLTF loader and parse the file
        const loader = new THREE.GLTFLoader();
        loader.parse(
            e.target.result,
            '',
            (gltf) => {
                // Success callback: model loaded successfully
                loadingIndicator.style.display = 'none';

                // Remove previously loaded model if exists
                if (loadedModel) {
                    scene.remove(loadedModel);
                }

                // Add new model to scene
                loadedModel = gltf.scene;
                scene.add(loadedModel);

                // Center the model at origin and scale appropriately
                const box = new THREE.Box3().setFromObject(loadedModel);
                const center = box.getCenter(new THREE.Vector3());
                loadedModel.position.sub(center);

                // Store original materials for texture view switching
                modelMaterials = [];
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        modelMaterials.push({ mesh: child, material: child.material });
                    }
                });
            },
            (xhr) => {
                // Progress callback: log loading progress to console
                console.log('Progress:', (xhr.loaded / xhr.total) * 100, '%');
            },
            (error) => {
                // Error callback: log any loading errors
                console.error('Error loading GLTF:', error);
                loadingIndicator.style.display = 'none';
                alert('Failed to load model from file. Please check the file format.');
            }
        );
    };
    reader.readAsArrayBuffer(file);
});

// ========================================================
// URL LOADING HANDLER
// ========================================================
// Load 3D models from external URLs (CORS must be enabled on host)

loadUrlButton.addEventListener('click', async function () {
    const url = urlInput.value.trim();
    
    // Validate that URL is provided
    if (!url) {
        alert('Please enter a valid URL');
        return;
    }

    // Show loading indicator
    loadingIndicator.style.display = 'block';
    
    try {
        // Fetch the model file from the URL
        const response = await fetch(url);
        
        // Check if fetch was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        // Convert response to array buffer for parsing
        const arrayBuffer = await response.arrayBuffer();
        
        // Extract filename from URL for display
        const fileName = url.split('/').pop() || 'model.glb';
        const fileSize = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);
        document.getElementById('file-name').textContent = `File Name: ${fileName}`;
        document.getElementById('file-size').textContent = `File size: ${fileSize} MB`;

        // Create loader and parse the model
        const loader = new THREE.GLTFLoader();
        loader.parse(
            arrayBuffer,
            new URL(url).origin + '/',
            (gltf) => {
                // Success callback
                loadingIndicator.style.display = 'none';

                // Remove previously loaded model
                if (loadedModel) {
                    scene.remove(loadedModel);
                }

                // Add new model to scene
                loadedModel = gltf.scene;
                scene.add(loadedModel);

                // Center and position model
                const box = new THREE.Box3().setFromObject(loadedModel);
                const center = box.getCenter(new THREE.Vector3());
                loadedModel.position.sub(center);

                // Store original materials
                modelMaterials = [];
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        modelMaterials.push({ mesh: child, material: child.material });
                    }
                });

                // Clear the URL input for next use
                urlInput.value = '';
            },
            (xhr) => {
                // Progress callback
                console.log('URL Load Progress:', (xhr.loaded / xhr.total) * 100, '%');
            },
            (error) => {
                // Error callback
                console.error('Error loading model from URL:', error);
                loadingIndicator.style.display = 'none';
                alert('Failed to load model from URL. Check the URL and ensure CORS is enabled.');
            }
        );
    } catch (error) {
        // Handle fetch errors
        console.error('Fetch error:', error);
        loadingIndicator.style.display = 'none';
        alert('Error: ' + error.message);
    }
});

// ========================================================
// VIEW MODE HANDLERS - SOLID VIEW
// ========================================================
// Apply solid color material to all model meshes

document.getElementById('solid-view').addEventListener('click', function () {
    if (loadedModel) {
        // Traverse all children of the loaded model
        loadedModel.traverse((child) => {
            if (child.isMesh) {
                // Apply gray standard material with realistic shading
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x888888, // Medium gray
                    roughness: 0.5,  // Medium roughness
                    metalness: 0.1   // Slightly metallic
                });
            }
        });
    }
});

// ========================================================
// VIEW MODE HANDLERS - TEXTURED VIEW
// ========================================================
// Restore original materials and textures

document.getElementById('textured-view').addEventListener('click', function () {
    if (loadedModel && modelMaterials.length > 0) {
        // Restore original materials for each mesh
        modelMaterials.forEach((entry) => {
            entry.mesh.material = entry.material;
        });
    }
});

// ========================================================
// VIEW MODE HANDLERS - WIREFRAME VIEW
// ========================================================
// Display model as wireframe for structure visualization

document.getElementById('wireframe-view').addEventListener('click', function () {
    if (loadedModel) {
        loadedModel.traverse((child) => {
            if (child.isMesh) {
                // Apply wireframe material showing model structure
                child.material = new THREE.MeshBasicMaterial({
                    wireframe: true,
                    color: 0x000000 // Black wireframe
                });
            }
        });
    }
});

// ========================================================
// RESPONSIVE RESIZE HANDLER
// ========================================================
// Adjust renderer and camera when window size changes

function resize() {
    // Calculate new dimensions (70% width, 100% height for right panel)
    const width = window.innerWidth * 0.7;
    const height = window.innerHeight;
    
    // Update renderer size
    renderer.setSize(width, height);
    
    // Update camera aspect ratio to match new dimensions
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// Initial resize call
resize();

// ========================================================
// ANIMATION LOOP
// ========================================================
// Continuous rendering and update loop

function animate() {
    // Request next animation frame for smooth continuous rendering
    requestAnimationFrame(animate);
    
    // Update orbit controls (handles camera damping)
    controls.update();
    
    // Render the scene from camera perspective
    renderer.render(scene, camera);
}

// Start animation loop
animate();

// ========================================================
// EVENT LISTENERS
// ========================================================
// Handle window resize events

window.addEventListener('resize', resize);