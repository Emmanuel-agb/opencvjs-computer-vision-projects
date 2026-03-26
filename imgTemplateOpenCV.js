/***************************************************
 * imgTemplateOpenCV.js
 * 
 * Implements:
 *  - Problem 1: 3x3 convolution filters (blur, sharpen, edges, etc.)
 *  - Problem 2: Simple & adaptive thresholding
 *  - Problem 3: Gaussian blur
 *  - Problem 4: Template matching (two images)
 ***************************************************/

/** Global references to the main image and template image. */
let imgElement      = document.getElementById('imageSrc');
let templateElement = document.getElementById('templateSrc');

let inputElement        = document.getElementById('fileInput');
let templateInputElement= document.getElementById('fileTemplateInput');

let canvasOutput        = document.getElementById('canvasOutput');
let operationSelect     = document.getElementById('operationSelect');
let convSelect          = document.getElementById('convSelect');
let grayCheck           = document.getElementById('grayCheck');
let threshTypeSelect    = document.getElementById('threshTypeSelect');
let threshValueRange    = document.getElementById('threshValueRange');
let threshValueLabel    = document.getElementById('threshValueLabel');
let ksizeRange          = document.getElementById('ksizeRange');
let ksizeLabel          = document.getElementById('ksizeLabel');
let sigmaRange          = document.getElementById('sigmaRange');
let sigmaLabel          = document.getElementById('sigmaLabel');
let applyBtn            = document.getElementById('applyBtn');

/* Listen for changes on the file inputs. */
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

templateInputElement.addEventListener('change', (e) => {
  templateElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

/* Update UI labels as user drags the range sliders */
threshValueRange.oninput = function() {
  threshValueLabel.innerHTML = '' + threshValueRange.value;
};
ksizeRange.oninput = function() {
  ksizeLabel.innerHTML = '' + ksizeRange.value;
};
sigmaRange.oninput = function() {
  sigmaLabel.innerHTML = '' + sigmaRange.value;
};

/* When images finish loading, we can attempt to display them or process them. */
imgElement.onload = function() {
  applyOperation();
};

templateElement.onload = function() {
  // Only relevant for Problem 4
  console.log("Template image loaded.");
};

/* The user can also explicitly click "Apply" button to re-run. */
applyBtn.addEventListener('click', applyOperation);

/***************************************
 * Master function to handle the operation
 ***************************************/
function applyOperation() {
  if (!imgElement.src) return;

  // Read the main image into an OpenCV Mat.
  let src = cv.imread(imgElement);
  let dst = new cv.Mat();
  
  // Step 1: Optionally convert to grayscale, if requested
  let intermediate = new cv.Mat();
  if (grayCheck.checked) {
    cv.cvtColor(src, intermediate, cv.COLOR_RGBA2GRAY, 0);
  } else {
    src.copyTo(intermediate);
  }

  // Decide which operation to run
  let operation = operationSelect.value;

  switch (operation) {
    case 'convolution':
      applyConvolution(intermediate, dst);
      break;
    case 'threshold':
      applyThreshold(intermediate, dst);
      break;
    case 'gaussian':
      applyGaussian(intermediate, dst);
      break;
    case 'templateMatch':
      // Template match requires using the original color or grayscale?
      // We'll do it on 'intermediate' for consistency.
      if (!templateElement.src) {
        console.log("No template loaded for matching!");
        intermediate.copyTo(dst);
      } else {
        templateMatching(intermediate, dst);
      }
      break;
    default:
      // No operation: just copy
      intermediate.copyTo(dst);
      break;
  }

  cv.imshow('canvasOutput', dst);

  // Cleanup
  src.delete();
  dst.delete();
  intermediate.delete();
}

/***************************************
 * Problem 1: 3x3 Convolution Filters
 ***************************************/
function applyConvolution(src, dst) {
  // For 2D filters, we create a kernel with cv.matFromArray
  let kernel;
  switch (convSelect.value) {
    case 'blur':
      // 3x3 blur kernel
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [1/9, 1/9, 1/9,
         1/9, 1/9, 1/9,
         1/9, 1/9, 1/9]);
      break;
    case 'sharpen':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [ 0, -1,  0,
         -1,  5, -1,
          0, -1,  0]);
      break;
    case 'edge':
      // Simple Laplacian-like
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [ 0,  1, 0,
          1, -4, 1,
          0,  1, 0]);
      break;
    case 'sobelX':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [-1, 0, 1,
         -2, 0, 2,
         -1, 0, 1]);
      break;
    case 'sobelY':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [-1, -2, -1,
          0,  0,  0,
          1,  2,  1]);
      break;
    case 'prewittX':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [-1, 0, 1,
         -1, 0, 1,
         -1, 0, 1]);
      break;
    case 'prewittY':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [-1, -1, -1,
          0,  0,  0,
          1,  1,  1]);
      break;
    case 'emboss':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [-2, -1, 0,
         -1,  1, 1,
          0,  1, 2]);
      break;
    default:
      // No filter
      src.copyTo(dst);
      return;
  }

  let anchor = new cv.Point(-1, -1);
  // ddepth = -1 means same depth as source
  cv.filter2D(src, dst, -1, kernel, anchor, 0, cv.BORDER_DEFAULT);
  kernel.delete();
}

/***************************************
 * Problem 2: Threshold
 ***************************************/
function applyThreshold(src, dst) {
  // We assume `src` is grayscale (because we check if user toggled grayscale).
  // If user didn't toggle grayscale, we can forcibly convert:
  let gray = new cv.Mat();
  if (src.channels() > 1) {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  } else {
    src.copyTo(gray);
  }

  let threshValue = parseInt(threshValueRange.value);
  let maxValue = 255;
  let blockSize = 11;  // could be a parameter
  let C = 2;           // offset used in adaptive threshold

  let typeStr = threshTypeSelect.value;
  let type, method;

  // We have: 'binary', 'binaryInv', 'otsu', 'adaptiveMean', 'adaptiveGaussian'
  switch (typeStr) {
    case 'binary':
      type = cv.THRESH_BINARY;
      cv.threshold(gray, dst, threshValue, maxValue, type);
      break;
    case 'binaryInv':
      type = cv.THRESH_BINARY_INV;
      cv.threshold(gray, dst, threshValue, maxValue, type);
      break;
    case 'otsu':
      // Otsu is a single threshold with flag THRESH_OTSU
      // Combine it with BINARY or BINARY_INV
      type = cv.THRESH_BINARY + cv.THRESH_OTSU;
      cv.threshold(gray, dst, threshValue, maxValue, type);
      break;
    case 'adaptiveMean':
      method = cv.ADAPTIVE_THRESH_MEAN_C;
      cv.adaptiveThreshold(gray, dst, maxValue, method, cv.THRESH_BINARY, blockSize, C);
      break;
    case 'adaptiveGaussian':
      method = cv.ADAPTIVE_THRESH_GAUSSIAN_C;
      cv.adaptiveThreshold(gray, dst, maxValue, method, cv.THRESH_BINARY, blockSize, C);
      break;
    default:
      // fallback
      gray.copyTo(dst);
      break;
  }

  gray.delete();
}

/***************************************
 * Problem 3: Gaussian blur
 ***************************************/
function applyGaussian(src, dst) {
  // We treat the slider values as numeric
  let k = parseInt(ksizeRange.value);
  // Ensure k is an odd number >= 3
  if (k % 2 === 0) { 
    k += 1; 
  }

  let sigma = parseFloat(sigmaRange.value);

  let ksize = new cv.Size(k, k);
  cv.GaussianBlur(src, dst, ksize, sigma, sigma, cv.BORDER_DEFAULT);
}

/***************************************
 * Problem 4: Template Matching
 ***************************************/
function templateMatching(src, dst) {
  // src = main image, templateElement loaded
  // Make sure both are in the same color space
  let templMat = cv.imread(templateElement);

  // The result image must be of size W−w+1 x H−h+1
  let dstWidth  = src.cols - templMat.cols + 1;
  let dstHeight = src.rows - templMat.rows + 1;

  if (dstWidth < 1 || dstHeight < 1) {
    // Template is bigger than main image
    console.log("Template is larger than main image; skipping match.");
    src.copyTo(dst);
    templMat.delete();
    return;
  }

  let result = new cv.Mat();
  result.create(dstHeight, dstWidth, cv.CV_32F);

  // Use TM_CCOEFF_NORMED or TM_SQDIFF_NORMED, etc.
  cv.matchTemplate(src, templMat, result, cv.TM_CCOEFF_NORMED);
  cv.normalize(result, result, 0, 1, cv.NORM_MINMAX, -1);

  // We can find multiple matches by thresholding result, or just find the best match
  let minMax = cv.minMaxLoc(result);
  let maxPoint = minMax.maxLoc;

  // Draw a rectangle around the best match
  // First, let’s copy src into dst
  src.copyTo(dst);

  let color = new cv.Scalar(255, 0, 0, 255);
  let point1 = new cv.Point(maxPoint.x, maxPoint.y);
  let point2 = new cv.Point(maxPoint.x + templMat.cols, maxPoint.y + templMat.rows);
  cv.rectangle(dst, point1, point2, color, 2, cv.LINE_8, 0);

  templMat.delete();
  result.delete();
}

/* We also re-run applyOperation whenever the user changes the drop-down,
   toggles grayscale, or changes any of the controls, if you wish.
   For simplicity, we only run on "Apply" or whenever the main image loads. */
