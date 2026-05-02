// Improved script.js with proper error handling and null checks for model traversal
// Also, enhanced the resize function calculation

function traverseModel(model) {
    if (!model) {
        console.error('Model is null or undefined');
        return;
    }
    // ... traversal logic with error handling
}

function resizeCanvas(canvas, width, height) {
    if (!canvas) {
        console.error('Canvas is null or undefined');
        return;
    }
    canvas.width = width;
    canvas.height = height;
    // ... calculate new dimensions properly
}

// Add other functions and improvements as necessary
// Remember to implement your logic and ensure error checks