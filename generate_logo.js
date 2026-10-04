const { Jimp } = require("jimp");

async function main() {
  const imagePath = "P:\\DSA404-chatBot\\public\\logo.jpg";
  const lightDest = "P:\\DSA404-chatBot\\public\\logo\\dsa404-logo-light.png";
  const darkDest = "P:\\DSA404-chatBot\\public\\logo\\dsa404-logo-dark.png";

  const imgLight = await Jimp.read(imagePath);
  const imgDark = await Jimp.read(imagePath);

  const lightAccent = { r: 250, g: 204, b: 21 }; // #facc15
  const darkAccent = { r: 37, g: 99, b: 235 }; // #2563eb

  imgLight.scan(0, 0, imgLight.bitmap.width, imgLight.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    const isYellow = r > 90 && g > 55 && b < Math.min(r, g) * 0.72;
    if (isYellow) {
      this.bitmap.data[idx + 0] = lightAccent.r;
      this.bitmap.data[idx + 1] = lightAccent.g;
      this.bitmap.data[idx + 2] = lightAccent.b;
    }
  });
  
  imgDark.scan(0, 0, imgDark.bitmap.width, imgDark.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    const isYellow = r > 90 && g > 55 && b < Math.min(r, g) * 0.72;
    if (isYellow) {
      this.bitmap.data[idx + 0] = darkAccent.r;
      this.bitmap.data[idx + 1] = darkAccent.g;
      this.bitmap.data[idx + 2] = darkAccent.b;
    } else {
      this.bitmap.data[idx + 0] = 255 - r;
      this.bitmap.data[idx + 1] = 255 - g;
      this.bitmap.data[idx + 2] = 255 - b;
    }
  });

  await imgLight.write(lightDest);
  await imgDark.write(darkDest);
  console.log("Done");
}

main().catch(console.error);
