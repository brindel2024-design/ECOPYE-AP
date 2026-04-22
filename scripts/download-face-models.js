/**
 * Downloads face-api.js TensorFlow.js model files to public/models/
 * Run: node scripts/download-face-models.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models')

const MODELS = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  // Face Landmark 68
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  // Face Expression
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
]

function download(filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(OUTPUT_DIR, filename)
    if (fs.existsSync(dest)) {
      console.log(`  ✓ ${filename} (already exists)`)
      return resolve()
    }
    const file = fs.createWriteStream(dest)
    const url = `${BASE_URL}/${filename}`
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        https.get(res.headers.location, (r) => r.pipe(file).on('finish', resolve)).on('error', reject)
        return
      }
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        return reject(new Error(`HTTP ${res.statusCode} for ${filename}`))
      }
      res.pipe(file)
      file.on('finish', () => {
        file.close(resolve)
        console.log(`  ✓ ${filename}`)
      })
    }).on('error', (err) => {
      fs.existsSync(dest) && fs.unlinkSync(dest)
      reject(err)
    })
  })
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`Created directory: ${OUTPUT_DIR}`)
  }

  console.log('Downloading face-api.js model weights...\n')
  for (const model of MODELS) {
    try {
      await download(model)
    } catch (err) {
      console.error(`  ✗ ${model}: ${err.message}`)
      process.exit(1)
    }
  }
  console.log('\n✅ All models downloaded to public/models/')
  console.log('You can now run: npm run dev')
}

main()
