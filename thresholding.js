let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');

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

function simpleThreshold() {
  let mat = cv.imread(imgElement);
  let dst = new cv.Mat();
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
  cv.threshold(mat, dst, 128, 255, cv.THRESH_BINARY);
  cv.imshow('canvasOutput', dst);
  mat.delete();
  dst.delete();
}

function adaptiveThreshold() {
  let mat = cv.imread(imgElement);
  let dst = new cv.Mat();
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
  cv.adaptiveThreshold(mat, dst, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 11, 2);
  cv.imshow('canvasOutput', dst);
  mat.delete();
  dst.delete();
}