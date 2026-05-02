const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xeeeeee);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        document.getElementById('viewer-container').appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        let loadedModel = null;
        let modelMaterials = [];

        const fileInput = document.getElementById('file-input');
        const loadingIndicator = document.getElementById('loading-indicator');

        document.getElementById('file-button').addEventListener('click', function () {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const fileName = file.name;
            const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
            document.getElementById('file-name').textContent = `File Name: ${fileName}`;
            document.getElementById('file-size').textContent = `File size: ${fileSize} MB`;

            loadingIndicator.style.display = 'block';

            const reader = new FileReader();
            reader.onload = function (e) {
                const loader = new THREE.GLTFLoader();
                loader.parse(
                    e.target.result,
                    '',
                    (gltf) => {
                        loadingIndicator.style.display = 'none';

                        if (loadedModel) {
                            scene.remove(loadedModel);
                        }

                        loadedModel = gltf.scene;
                        scene.add(loadedModel);

                        const box = new THREE.Box3().setFromObject(loadedModel);
                        const center = box.getCenter(new THREE.Vector3());
                        loadedModel.position.sub(center);

                        // Store original materials for future use
                        modelMaterials = [];
                        gltf.scene.traverse((child) => {
                            if (child.isMesh) {
                                modelMaterials.push({ mesh: child, material: child.material });
                            }
                        });
                    },
                    (xhr) => {
                        console.log('Progress:', (xhr.loaded / xhr.total) * 100, '%');
                    },
                    (error) => {
                        console.error('Error loading GLTF:', error);
                    }
                );
            };
            reader.readAsArrayBuffer(file);
        });

        document.getElementById('solid-view').addEventListener('click', function () {
            if (loadedModel) {
                loadedModel.traverse((child) => {
                    if (child.isMesh) {
                        // Set material to a basic color or default shading
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x888888, // Gray color (shaded look)
                            roughness: 0.5,
                            metalness: 0.1
                        });
                    }
                });
            }
        });

        document.getElementById('textured-view').addEventListener('click', function () {
            if (loadedModel && modelMaterials.length > 0) {
                modelMaterials.forEach((entry) => {
                    entry.mesh.material = entry.material; // Apply original material with texture
                });
            }
        });

        document.getElementById('wireframe-view').addEventListener('click', function () {
            if (loadedModel) {
                loadedModel.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshBasicMaterial({
                            wireframe: true,
                            color: 0x000000
                        });
                    }
                });
            }
        });

        function resize() {
            const width = window.innerWidth * 0.7; // 70% of the window width
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }

        resize();

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', resize);
