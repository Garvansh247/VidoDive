const extractPublicId = (url) => {
  try {
    if (!url) return null;
    
    const urlObj = new URL(url);
    const pathName = urlObj.pathname;

    // Locate the asset type identifier
    const uploadIndex = pathName.search(/\/(upload|private|authenticated)\//);
    if (uploadIndex === -1) return null;

    // Extract everything after the asset type segment
    const matchedSegment = pathName.match(/\/(upload|private|authenticated)\/(.+)$/);
    if (!matchedSegment || !matchedSegment[2]) return null;
    
    let remainingPath = matchedSegment[2];
    const pathParts = remainingPath.split('/');

    // Safe filtering: Transformations typically contain scaling/cropping codes (e.g., w_, h_, c_, q_)
    const filteredParts = pathParts.filter(part => {
      // Version string check
      if (/^v\d+$/.test(part)) return true;
      // Match explicit transformation patterns like w_400, h_300, c_crop, limit_ etc.
      const isTransformation = /^(w|h|c|q|f|e|fl|r|bo|co|bg|pg|dl|p|o|so|eo|du)_|_(fill|fit|limit|scale|crop|pad|thumb)/.test(part);
      return !isTransformation;
    });
    
    remainingPath = filteredParts.join('/');

    // Remove the version prefix if present (e.g., v1625060000/)
    remainingPath = remainingPath.replace(/^v\d+\//, '');

    // Strip off the file extension at the very end (e.g., .mp4, .jpg)
    const publicId = remainingPath.replace(/\.[^/.]+$/, "");

    return publicId;
  } catch (error) {
    console.error("Invalid URL provided to extractPublicId:", error);
    return null;
  }
};

export default extractPublicId;