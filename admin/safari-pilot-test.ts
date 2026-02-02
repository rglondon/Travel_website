/**
 * Safari Pilot Test Script
 * Tests MiniMax M2.1 Vision output for wildlife/landscape markers
 * 
 * Usage: npm run pilot:safari
 * 
 * Requires MINIMAX_API_KEY environment variable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { miniMaxVisionService } from './src/services/minimaxService.js';
import { imageOptimizer } from './src/services/imageOptimizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Safari-specific markers to check
const SAFARI_MARKERS = {
  topographical: [
    'savanna', 'acacia-woodland', 'riparian-zone', 'grassland',
    'granite-outcrop', 'waterhole', 'termite-mound', 'baobab',
    'evergreen-forest', 'montane', 'lacustrine', 'alluvial-plain'
  ],
  observational: [
    'predator', 'ungulate', 'megafauna', 'herd-behavior',
    'territorial-display', 'maternal-care', 'foraging',
    'lion', 'elephant', 'zebra', 'wildebeest', 'giraffe',
    'leopard', 'cheetah', 'hyena', 'wild-dog'
  ],
  technical: [
    'golden-hour', 'backlit', 'silhouette', 'low-chroma',
    'high-contrast', 'dust-atmosphere', 'thermal-distortion',
    'ambient-diffusion', 'optical-compression', 'sidelit'
  ]
};

// Words that indicate generic/inappropriate responses
const FLUFF_INDICATORS = [
  'beautiful', 'stunning', 'breathtaking', 'aesthetic', 'cinematic',
  'mesmerizing', 'ethereal', 'serene', 'peaceful', 'tranquil',
  'amazing', 'incredible', 'wonderful', 'spectacular', 'gorgeous'
];

interface TestResult {
  filename: string;
  success: boolean;
  processingTime: number;
  reductionPercent: number;
  tokensUsed: number;
  keywords: {
    count: number;
    categories: string[];
    safariMarkersCount: number;
    markersFound: string[];
    hasFluff: boolean;
  };
  storyContext: {
    length: number;
    isFieldJournal: boolean;
    hasFluff: boolean;
    quality: 'excellent' | 'good' | 'poor';
  };
  altText: {
    length: number;
    isDescriptive: boolean;
  };
  errors: string[];
}

async function runSafariPilotTest(imagePaths: string[]): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('\n' + '='.repeat(70));
  console.log('🦁 SAFARI PILOT TEST - MiniMax M2.1 Vision Verification');
  console.log('='.repeat(70) + '\n');

  // Initialize MiniMax with API key from environment
  const apiKey = process.env.MINIMAX_API_KEY || process.env.MINIMAX_KEY;
  if (!apiKey) {
    console.log('\n⚠️  MINIMAX_API_KEY not set!');
    console.log('Please set: export MINIMAX_API_KEY=your_api_key\n');
    console.log('Get your API key from: https://api.minimax.chat\n');
    return [];
  }

  console.log('✅ MiniMax API key configured\n');

  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    const filename = path.basename(imagePath);
    const startTime = Date.now();
    
    console.log(`\n[${i + 1}/${imagePaths.length}] Testing: ${filename}`);
    console.log('-'.repeat(50));

    const result: TestResult = {
      filename,
      success: false,
      processingTime: 0,
      reductionPercent: 0,
      tokensUsed: 0,
      keywords: {
        count: 0,
        categories: [],
        safariMarkersCount: 0,
        markersFound: [],
        hasFluff: false,
      },
      storyContext: {
        length: 0,
        isFieldJournal: false,
        hasFluff: false,
        quality: 'poor',
      },
      altText: {
        length: 0,
        isDescriptive: false,
      },
      errors: [],
    };

    try {
      // Step 1: Read and validate image
      console.log('  📁 Reading image...');
      const fileBuffer = fs.readFileSync(imagePath);
      const originalSizeKB = fileBuffer.length / 1024;
      
      // Step 2: Create AI proxy
      console.log('  🔄 Creating AI proxy (max 1000px)...');
      const proxyResult = await imageOptimizer.createAIProxy(fileBuffer, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 80,
      });
      
      result.reductionPercent = proxyResult.reductionPercent;
      console.log(`  📊 Original: ${originalSizeKB.toFixed(1)}KB → Proxy: ${(proxyResult.proxySize / 1024).toFixed(1)}KB (${proxyResult.reductionPercent}% reduction)`);

      // Step 3: Save proxy temporarily for AI analysis
      const proxyPath = `/tmp/safari-proxy-${Date.now()}.jpg`;
      fs.writeFileSync(proxyPath, proxyResult.buffer);
      
      // Step 4: Run MiniMax M2.1 analysis
      console.log('  🤖 Running MiniMax M2.1 analysis (200k context window)...');
      const aiResult = await miniMaxVisionService.analyzeImage(`file://${proxyPath}`);
      result.processingTime = Date.now() - startTime;
      
      // Clean up proxy
      try { fs.unlinkSync(proxyPath); } catch {}
      
      // Analyze keywords
      console.log('  🔍 Analyzing keywords...');
      result.keywords.count = aiResult.keywords.length;
      result.keywords.categories = [...new Set(aiResult.keywords.map(k => k.category))];
      
      // Check for safari markers
      const allKeywords = aiResult.keywords.map(k => k.value.toLowerCase());
      const foundMarkers: string[] = [];
      
      for (const [, markers] of Object.entries(SAFARI_MARKERS)) {
        for (const marker of markers) {
          if (allKeywords.some(k => k.includes(marker) || marker.includes(k))) {
            foundMarkers.push(marker);
            result.keywords.safariMarkersCount++;
          }
        }
      }
      result.keywords.markersFound = [...new Set(foundMarkers)];
      
      // Check for fluff
      result.keywords.hasFluff = aiResult.keywords.some(k => 
        FLUFF_INDICATORS.some(fluff => k.value.toLowerCase().includes(fluff))
      );
      
      console.log(`  📝 Keywords: ${result.keywords.count} (${result.keywords.categories.join(', ')})`);
      if (result.keywords.markersFound.length > 0) {
        console.log(`  🎯 Safari markers: ${result.keywords.markersFound.join(', ')}`);
      }
      if (result.keywords.hasFluff) {
        console.log(`  ⚠️  WARNING: Fluff adjectives detected!`);
      }
      
      // Analyze story context
      console.log('  📖 Analyzing story context...');
      result.storyContext.length = aiResult.storyContext.value.length;
      result.storyContext.hasFluff = FLUFF_INDICATORS.some(
        fluff => aiResult.storyContext.value.toLowerCase().includes(fluff)
      );
      
      // Check for field journal indicators
      const fieldJournalIndicators = [
        'observation', 'individual', 'estimated', 'visible',
        'approaching', 'moving along', 'background', 'foreground',
        'solar angle', 'distance', 'direction', 'facing',
        'herd', 'individual', 'female', 'male', 'juvenile'
      ];
      result.storyContext.isFieldJournal = fieldJournalIndicators.some(
        indicator => aiResult.storyContext.value.toLowerCase().includes(indicator)
      );
      
      // Quality assessment
      if (result.storyContext.isFieldJournal && !result.storyContext.hasFluff && result.storyContext.length > 200) {
        result.storyContext.quality = 'excellent';
      } else if (result.storyContext.length > 100) {
        result.storyContext.quality = 'good';
      } else {
        result.storyContext.quality = 'poor';
      }
      
      console.log(`  📚 Story: ${result.storyContext.length} chars | Quality: ${result.storyContext.quality.toUpperCase()}`);
      if (result.storyContext.isFieldJournal) {
        console.log('  ✅ Field journal tone detected');
      } else {
        console.log('  ⚠️  May need more observational tone');
      }
      
      // Analyze alt text
      result.altText.length = aiResult.altText.value.length;
      result.altText.isDescriptive = aiResult.altText.value.length >= 40 && 
        !aiResult.altText.value.toLowerCase().includes('beautiful') &&
        !aiResult.altText.value.toLowerCase().includes('stunning');
      
      console.log(`  🔤 Alt text: ${result.altText.length} chars`);
      
      // Success
      result.success = true;
      
      // Log full output for review
      console.log('\n  ┌─────────────────────────────────────────────────────────────┐');
      console.log('  │ FULL MINIMAX M2.1 OUTPUT                                   │');
      console.log('  ├─────────────────────────────────────────────────────────────┤');
      console.log(`  │ Keywords: ${aiResult.keywords.map(k => `${k.value}(${k.category})`).join(', ').slice(0, 60)}`);
      console.log(`  │ Alt Text: ${aiResult.altText.value.slice(0, 60)}...`);
      console.log(`  │ Caption: ${aiResult.caption.value.slice(0, 60)}...`);
      console.log(`  │ Story: ${aiResult.storyContext.value.slice(0, 60)}...`);
      console.log('  └─────────────────────────────────────────────────────────────┘\n');
      
    } catch (error) {
      result.errors.push((error as Error).message);
      console.log(`  ❌ Error: ${(error as Error).message}`);
    }
    
    results.push(result);
  }
  
  return results;
}

function generateSafariReport(results: TestResult[]): string {
  const report = [];
  
  report.push('\n' + '='.repeat(70));
  report.push('📊 SAFARI PILOT TEST REPORT - MiniMax M2.1');
  report.push('='.repeat(70));
  
  // Summary stats
  const successful = results.filter(r => r.success).length;
  const avgReduction = results.reduce((sum, r) => sum + r.reductionPercent, 0) / results.length;
  const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
  const totalSafariMarkers = results.reduce((sum, r) => sum + r.keywords.safariMarkersCount, 0);
  
  report.push(`\n📈 SUMMARY`);
  report.push(`  Images tested: ${results.length}`);
  report.push(`  Successful: ${successful}/${results.length}`);
  report.push(`  Avg size reduction: ${avgReduction.toFixed(1)}%`);
  report.push(`  Avg processing time: ${(avgProcessingTime / 1000).toFixed(1)}s`);
  report.push(`  Total safari markers found: ${totalSafariMarkers}`);
  
  // Safari marker accuracy
  report.push(`\n🎯 WILDLIFE/LANDSCAPE ACCURACY`);
  results.forEach((r, i) => {
    if (r.success) {
      const status = r.keywords.markersFound.length > 0 ? '✅' : '⚠️';
      report.push(`  ${i + 1}. ${r.filename}: ${r.keywords.markersFound.join(', ') || 'No specific safari markers'} ${status}`);
    }
  });
  
  // Field journal quality
  report.push(`\n📝 FIELD JOURNAL QUALITY`);
  const excellent = results.filter(r => r.storyContext.quality === 'excellent').length;
  const good = results.filter(r => r.storyContext.quality === 'good').length;
  const poor = results.filter(r => r.storyContext.quality === 'poor').length;
  report.push(`  Excellent: ${excellent} | Good: ${good} | Needs Work: ${poor}`);
  
  // Fluff check
  report.push(`\n⚠️  FLUFF CHECK`);
  const hasFluff = results.filter(r => r.keywords.hasFluff || r.storyContext.hasFluff);
  if (hasFluff.length === 0) {
    report.push(`  ✅ No fluff adjectives detected in any output`);
  } else {
    report.push(`  ⚠️  Fluff detected in ${hasFluff.length} images`);
  }
  
  // Recommendations
  report.push(`\n💡 RECOMMENDATIONS`);
  if (excellent + good >= results.length * 0.8) {
    report.push(`  ✅ MiniMax M2.1 is ready for mass upload`);
  } else {
    report.push(`  ⚠️  Review the outputs above before proceeding`);
  }
  
  if (totalSafariMarkers < 3) {
    report.push(`  ⚠️  Consider refining the prompt for wildlife-specific terms`);
  }
  
  report.push('\n' + '='.repeat(70) + '\n');
  
  return report.join('\n');
}

// Main execution
async function main() {
  // Get test images (you would replace these with actual safari test images)
  const testImages = process.argv.slice(2);
  
  if (testImages.length === 0) {
    console.log('\n🦁 Safari Pilot Test - MiniMax M2.1 Vision');
    console.log('Usage: npm run pilot:safari <image1.jpg> <image2.jpg> ...');
    console.log('\nExample:');
    console.log('  npm run pilot:safari lion_01.jpg elephant_01.jpg zebra_01.jpg');
    console.log('\nThis will:');
    console.log('  1. Create optimized proxy (max 1000px) for MiniMax');
    console.log('  2. Run Senior Photo Editor persona on each image');
    console.log('  3. Verify wildlife markers (lion, elephant, savanna, etc.)');
    console.log('  4. Check Field Journal tone vs marketing speak');
    console.log('  5. Generate a detailed report\n');
    console.log('Required environment variable:');
    console.log('  export MINIMAX_API_KEY=your_api_key\n');
    console.log('Get API key from: https://api.minimax.chat\n');
    return;
  }
  
  // Verify files exist
  const validImages = testImages.filter(imgPath => {
    if (!fs.existsSync(imgPath)) {
      console.log(`\n⚠️  File not found: ${imgPath}`);
      return false;
    }
    return true;
  });
  
  if (validImages.length === 0) {
    console.log('\n❌ No valid images found');
    return;
  }
  
  // Run test
  const results = await runSafariPilotTest(validImages);
  
  // Generate and display report
  const report = generateSafariReport(results);
  console.log(report);
  
  // Save report to file
  const reportPath = '/tmp/safari-pilot-report.txt';
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

main().catch(console.error);
