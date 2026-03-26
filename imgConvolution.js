let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
let filterSelect = document.getElementById('filterSelect');
let isGrayScale = false;

inputElement.addEventListener('change', (e) => {
   imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function() {
   let mat = cv.imread(imgElement);
   let dst = new cv.Mat();
   cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY);
   cv.imshow('canvasOutput', dst);
   mat.delete();
   dst.delete();
};

function toggleGrayScale() {
  isGrayScale = !isGrayScale;
  applyFilter();
}

function applyFilter() {
  let mat = cv.imread(imgElement);
  let dst = new cv.Mat();
  let kernel;

  switch(filterSelect.value) {
    case 'blur':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9]);
      break;
    case 'sharpen':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [0, -1, 0, -1, 5, -1, 0, -1, 0]);
      break;
    case 'edge':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [-1, -1, -1, -1, 8, -1, -1, -1, -1]);
      break;
    case 'sobelVertical':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [-1, 0, 1, -2, 0, 2, -1, 0, 1]);
      break;
    case 'sobelHorizontal':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);
      break;
    case 'prewittVertical':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [-1, 0, 1, -1, 0, 1, -1, 0, 1]);
      break;
    case 'prewittHorizontal':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [-1, -1, -1, 0, 0, 0, 1, 1, 1]);
      break;
    case 'emboss':
      kernel = cv.matFromArray(3, 3, cv.CV_32F, [-2, -1, 0, -1, 1, 1, 0, 1, 2]);
      break;
  }

  if (isGrayScale) {
    cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
  }

  cv.filter2D(mat, dst, cv.CV_8UC1, kernel);
  cv.imshow('canvasOutput', dst);

  mat.delete();
  dst.delete();
  kernel.delete();
}