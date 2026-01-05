const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function create(base64Image) {
  try {
    // Ensure directory exists
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Clean base64 string (remove data:image/jpeg;base64, prefix if present)
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let imageBuffer;
    let extension = 'jpg';

    if (matches && matches.length === 3) {
      // image/jpeg -> jpeg, image/png -> png
      extension = matches[1].split('/')[1];
      imageBuffer = Buffer.from(matches[2], 'base64');
    } else {
      // Assume raw base64 string
      imageBuffer = Buffer.from(base64Image, 'base64');
    }

    const filename = `${uuidv4()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, imageBuffer);

    // Return relative URL (assuming server is running on localhost or accessible IP)
    // We return the path that can be appended to the base URL
    return `/public/uploads/${filename}`;
  } catch (error) {
    console.error('Local upload failed:', error);
    throw error;
  }
}

module.exports = {
  create
}