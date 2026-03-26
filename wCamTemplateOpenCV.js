/***************************************************
 * wCamTemplateOpenCV.js
 * 
 * Webcam-based solution for:
 *  - Problem 1: 3x3 convolution filters
 *  - Problem 2: Simple & Adaptive Threshold
 *  - Problem 3: Gaussian blur
 * 
 * Problem 4 (template matching) is for images only,
 * so it's not included here.
 ***************************************************/

let video = document.getElementById("videoInput");
video.width = 640;
video.height = 480;

// Acquire webcam feed
navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then(function(stream) {
    video.srcObject = stream;
    video.play();
    initCV(); // once webcam is ready
  })
  .catch(function(err) {
    console.error("An error occurred! " + err);
  });

/** UI elements */
let grayCheck       = document.getElementById('grayCheck');
let convSelect      = document.getElementById('convSelect');
let threshSelect    = document.getElementById('threshSelect');
let threshRange     = document.getElementById('threshRange');
let threshValLabel  = document.getElementById('threshValueLabel');
let ksizeRange      = document.getElementById('ksizeRange');
let ksizeLabel      = document.getElementById('ksizeLabel');
let sigmaRange      = document.getElementById('sigmaRange');
let sigmaLabel      = document.getElementById('sigmaLabel');

// Keep references to Mats outside loop for performance
let src = null;
let dst = null;
let temp = null;
let cap = null;

function initCV() {
  // Prepare Mats
  src  = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  dst  = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  temp = new cv.Mat(video.height, video.width, cv.CV_8UC1);

  cap = new cv.VideoCapture(video);

  // Listen to changes on range inputs to update labels
  threshRange.oninput = () => { threshValLabel.textContent = threshRange.value; };
  ksizeRange.oninput  = () => { ksizeLabel.textContent     = ksizeRange.value; };
  sigmaRange.oninput  = () => { sigmaLabel.textContent     = sigmaRange.value; };

  // Start processing
  requestAnimationFrame(processVideo);
}

function processVideo() {
  try {
    cap.read(src);
    // 1) Possibly convert to grayscale
    if (grayCheck.checked) {
      cv.cvtColor(src, temp, cv.COLOR_RGBA2GRAY);
      cv.cvtColor(temp, dst, cv.COLOR_GRAY2RGBA);
    } else {
      src.copyTo(dst);
    }

    // 2) Apply 3x3 convolution if selected
    applyConvolution(dst, dst);

    // 3) Threshold if selected
    applyThreshold(dst, dst);

    // 4) Gaussian blur
    applyGaussian(dst, dst);

    // Show
    cv.imshow("canvasOutput", dst);
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(processVideo);
}

/*******************************************
 * Problem 1: 3x3 Convolution
 *******************************************/
function applyConvolution(srcMat, dstMat) {
  let selected = convSelect.value;
  if (selected === 'none') {
    // Do nothing
    return;
  }

  let kernel;
  switch (selected) {
    case 'blur':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [1/9,1/9,1/9,
         1/9,1/9,1/9,
         1/9,1/9,1/9]);
      break;
    case 'sharpen':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [ 0, -1,  0,
         -1,  5, -1,
          0, -1,  0]);
      break;
    case 'edge':
      kernel = cv.matFromArray(3, 3, cv.CV_32F,
        [ 0,  1,  0,
          1, -4,  1,
          0,  1,  0]);
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
      return;
  }
  let anchor = new cv.Point(-1, -1);
  cv.filter2D(srcMat, dstMat, -1, kernel, anchor, 0, cv.BORDER_DEFAULT);
  kernel.delete();
}

/*******************************************
 * Problem 2: Threshold
 *******************************************/
function applyThreshold(srcMat, dstMat) {
  let tMode = threshSelect.value;
  if (tMode === 'none') {
    return; // no threshold
  }

  // We want to do the threshold on grayscale. Let’s convert.
  let gray = new cv.Mat();
  cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);

  let threshVal = parseInt(threshRange.value);
  let maxVal = 255;
  let blockSize = 11;
  let C = 2;

  switch (tMode) {
    case 'binary':
      cv.threshold(gray, gray, threshVal, maxVal, cv.THRESH_BINARY);
      break;
    case 'binaryInv':
      cv.threshold(gray, gray, threshVal, maxVal, cv.THRESH_BINARY_INV);
      break;
    case 'otsu':
      cv.threshold(gray, gray, threshVal, maxVal, cv.THRESH_BINARY + cv.THRESH_OTSU);
      break;
    case 'adaptiveMean':
      cv.adaptiveThreshold(gray, gray, maxVal, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, blockSize, C);
      break;
    case 'adaptiveGaussian':
      cv.adaptiveThreshold(gray, gray, maxVal, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, C);
      break;
    default:
      break;
  }

  cv.cvtColor(gray, dstMat, cv.COLOR_GRAY2RGBA);
  gray.delete();
}

/*******************************************
 * Problem 3: Gaussian Blur
 *******************************************/
function applyGaussian(srcMat, dstMat) {
  let k = parseInt(ksizeRange.value);
  // ensure k is odd
  if (k % 2 === 0) k += 1;
  let sigma = parseFloat(sigmaRange.value);

  let ksize = new cv.Size(k, k);
  cv.GaussianBlur(srcMat, dstMat, ksize, sigma, sigma, cv.BORDER_DEFAULT);
}
