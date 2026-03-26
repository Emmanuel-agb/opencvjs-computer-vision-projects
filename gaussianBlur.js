let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
let ksizeElement = document.getElementById('ksize');
let sigmaElement = document.getElementById('sigma');

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

function applyGaussianBlur() {
  let mat = cv.imread(imgElement);
  let dst = new cv.Mat();
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
  let ksize = parseInt(ksizeElement.value);
  let sigma = parseFloat(sigmaElement.value);
  cv.GaussianBlur(mat, dst, [ksize, ksize], sigma);
  cv.imshow('canvasOutput', dst);
  mat.delete();
  dst.delete();
}