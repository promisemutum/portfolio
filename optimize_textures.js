// optimize-textures.js
// Run with: node optimize-textures.js

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * TEXTURE OPTIMIZATION SCRIPT
 * This script will:
 * 1. Resize large textures to optimal sizes
 * 2. Create texture atlases (combine multiple textures into one)
 * 3. Generate low-res versions for progressive loading
 */

const INPUT_DIR = './public/images';
const OUTPUT_DIR = './public/images/optimized';

// Configuration
const MAX_TEXTURE_SIZE = 2048;
const LOW_RES_SIZE = 512;

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err);
  }
}

async function getImageInfo(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = await fs.stat(filePath);
    return {
      width: metadata.width,
      height: metadata.height,
      size: (stats.size / 1024 / 1024).toFixed(2), // MB
      format: metadata.format
    };
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
}

async function optimizeTexture(inputPath, outputPath, targetSize) {
  try {
    const metadata = await sharp(inputPath).metadata();
    const needsResize = metadata.width > targetSize || metadata.height > targetSize;
    
    let pipeline = sharp(inputPath);
    
    if (needsResize) {
      pipeline = pipeline.resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    await pipeline
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);
    
    const info = await getImageInfo(outputPath);
    return info;
  } catch (err) {
    console.error(`Error optimizing ${inputPath}:`, err);
    return null;
  }
}

async function createLowResVersion(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(LOW_RES_SIZE, LOW_RES_SIZE, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPath);
    
    console.log(`✓ Created low-res: ${path.basename(outputPath)}`);
  } catch (err) {
    console.error(`Error creating low-res ${inputPath}:`, err);
  }
}

async function createTextureAtlas(textures, atlasName) {
  try {
    // Create a 2x2 grid atlas (can fit 4 textures)
    const ATLAS_SIZE = MAX_TEXTURE_SIZE;
    const TILE_SIZE = ATLAS_SIZE / 2;
    
    // Create blank canvas
    const atlas = sharp({
      create: {
        width: ATLAS_SIZE,
        height: ATLAS_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });
    
    const composites = [];
    
    // Position textures in grid
    for (let i = 0; i < Math.min(textures.length, 4); i++) {
      const x = (i % 2) * TILE_SIZE;
      const y = Math.floor(i / 2) * TILE_SIZE;
      
      const resized = await sharp(textures[i])
        .resize(TILE_SIZE, TILE_SIZE, { fit: 'cover' })
        .toBuffer();
      
      composites.push({
        input: resized,
        left: x,
        top: y
      });
    }
    
    await atlas
      .composite(composites)
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(OUTPUT_DIR, atlasName));
    
    console.log(`✓ Created texture atlas: ${atlasName}`);
    
    // Create usage guide
    const guide = {
      atlasSize: ATLAS_SIZE,
      tileSize: TILE_SIZE,
      textures: textures.map((tex, i) => ({
        original: path.basename(tex),
        position: {
          x: (i % 2) * TILE_SIZE,
          y: Math.floor(i / 2) * TILE_SIZE
        },
        uvOffset: {
          x: (i % 2) * 0.5,
          y: Math.floor(i / 2) * 0.5
        },
        uvRepeat: { x: 0.5, y: 0.5 }
      }))
    };
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, `${atlasName}.json`),
      JSON.stringify(guide, null, 2)
    );
    
    console.log(`✓ Created atlas guide: ${atlasName}.json`);
  } catch (err) {
    console.error(`Error creating atlas:`, err);
  }
}

async function main() {
  console.log('🚀 Starting texture optimization...\n');
  
  // Ensure output directory exists
  await ensureDir(OUTPUT_DIR);
  
  // Find all PNG files
  const files = await fs.readdir(INPUT_DIR);
  const pngFiles = files.filter(f => f.endsWith('.png'));
  
  console.log(`📁 Found ${pngFiles.length} PNG files\n`);
  
  // Analyze files
  console.log('📊 Current file info:');
  console.log('─'.repeat(60));
  
  for (const file of pngFiles) {
    const filePath = path.join(INPUT_DIR, file);
    const info = await getImageInfo(filePath);
    
    if (info) {
      const warning = info.width > MAX_TEXTURE_SIZE || info.size > 5 ? ' ⚠️  TOO LARGE!' : '';
      console.log(`${file.padEnd(25)} ${info.width}x${info.height}  ${info.size}MB${warning}`);
    }
  }
  
  console.log('─'.repeat(60));
  console.log('');
  
  // Optimize individual textures
  console.log('🔧 Optimizing textures...\n');
  
  const optimizedFiles = [];
  
  for (const file of pngFiles) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    
    // Create optimized version
    const info = await optimizeTexture(inputPath, outputPath, MAX_TEXTURE_SIZE);
    
    if (info) {
      console.log(`✓ Optimized: ${file} → ${info.width}x${info.height} (${info.size}MB)`);
      optimizedFiles.push(outputPath);
      
      // Create low-res version
      const lowResPath = path.join(OUTPUT_DIR, file.replace('.png', '_lowres.png'));
      await createLowResVersion(outputPath, lowResPath);
    }
  }
  
  console.log('');
  
  // Create texture atlases
  if (optimizedFiles.length >= 2) {
    console.log('🎨 Creating texture atlases...\n');
    
    // Group textures by prefix (1_, 2_)
    const layer1Textures = optimizedFiles.filter(f => path.basename(f).startsWith('1_'));
    const layer2Textures = optimizedFiles.filter(f => path.basename(f).startsWith('2_'));
    
    if (layer1Textures.length > 0) {
      await createTextureAtlas(layer1Textures, 'atlas_layer1.png');
    }
    
    if (layer2Textures.length > 0) {
      await createTextureAtlas(layer2Textures, 'atlas_layer2.png');
    }
  }
  
  console.log('');
  console.log('✅ Optimization complete!');
  console.log(`📂 Optimized textures saved to: ${OUTPUT_DIR}`);
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Replace your texture imports with optimized versions');
  console.log('2. Use the _lowres.png files for initial load');
  console.log('3. Consider using atlas files for better performance');
  console.log('4. Check the .json files for UV mapping coordinates');
}

// Check if sharp is installed
async function checkDependencies() {
  try {
    require.resolve('sharp');
    return true;
  } catch (err) {
    console.error('❌ Error: sharp package not found');
    console.error('Install it with: npm install sharp');
    return false;
  }
}

// Run the script
checkDependencies().then(hasSharp => {
  if (hasSharp) {
    main().catch(console.error);
  }
});