// @ts-nocheck
// URL.createObjectURL
window.URL = window.URL || window.webkitURL;

export default (code: string): Worker => {
  let blob;
  try {
    blob = new Blob([code], { type: 'application/javascript' });
  } catch (e) {
    // Backwards-compatibility
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
    blob = new BlobBuilder();
    blob.append(code);
    blob = blob.getBlob();
  }
  return new Worker(URL.createObjectURL(blob), { type: 'module' });
};