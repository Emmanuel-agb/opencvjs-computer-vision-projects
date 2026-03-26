let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
let threshold1Element = document.getElementById('threshold1');
let threshold2Element = document.getElementById('threshold2');
let apertureSizeElement = document.getElementById('apertureSize');

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

function applyCannyEdge() {
  let mat = cv.imread(imgElement);
  let dst = new cv.Mat();
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
  let threshold1 = parseInt(threshold1Element.value);
  let threshold2 = parseInt(threshold2Element.value);
  let apertureSize = parseInt(apertureSizeElement.value);
  cv.Canny(mat, dst, threshold1, threshold2, apertureSize);
  cv.imshow('canvasOutput', dst);
  mat.delete();
  dst.delete();
}