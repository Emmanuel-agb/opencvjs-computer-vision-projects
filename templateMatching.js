let imgElement = document.getElementById('imageSrc');
let templateElement = document.getElementById('templateSrc');
let inputElement = document.getElementById('fileInput');
let templateInput = document.getElementById('templateInput');

inputElement.addEventListener('change', (e) => {
   imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

templateInput.addEventListener('change', (e) => {
   templateElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function() {
   let mat = cv.imread(imgElement);
   let dst = new cv.Mat();
   cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY);
   cv.imshow('canvasOutput', dst);
   mat.delete();
   dst.delete();
};

templateElement.onload = function() {
   applyTemplateMatching();
};

function applyTemplateMatching() {
  let img = cv.imread(imgElement);
  let templ = cv.imread(templateElement);
  let dst = new cv.Mat();
  let result = new cv.Mat();
  let mask = new cv.Mat();

  cv.cvtColor(img, img, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(templ, templ, cv.COLOR_RGBA2GRAY);

  cv.matchTemplate(img, templ, result, cv.TM_CCOEFF_NORMED, mask);
  cv.normalize(result, result, 0, 1, cv.NORM_MINMAX, -1, new cv.Mat());
  let minMaxLoc = cv.minMaxLoc(result);

  let x = minMaxLoc.maxLoc.x;
  let y = minMaxLoc.maxLoc.y;
  let w = templ.cols;
  let h = templ.rows;

  cv.rectangle(img, [x, y], [x + w, y + h], [0, 255, 0, 255], 2);
  cv.imshow('canvasOutput', img);

  img.delete();
  templ.delete();
  result.delete();
  mask.delete();
}