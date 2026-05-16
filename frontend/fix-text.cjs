const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
  'src/pages',
  'src/components'
];

const EXCLUDED_DIRS = [
  'src/components/ui'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We should NOT blindly replace text-white because it breaks buttons (bg-blue-600 text-white).
  // We should only replace faint text colors.

  // Faint replacements requested by user:
  content = content.replace(/text-gray-50\b/g, 'text-gray-900');
  content = content.replace(/text-gray-100\b/g, 'text-gray-900');
  content = content.replace(/text-gray-200\b/g, 'text-gray-700');
  content = content.replace(/text-gray-300\b/g, 'text-gray-600');
  
  content = content.replace(/text-slate-50\b/g, 'text-gray-900');
  content = content.replace(/text-slate-100\b/g, 'text-gray-900');
  
  content = content.replace(/text-zinc-100\b/g, 'text-gray-900');
  content = content.replace(/text-zinc-200\b/g, 'text-gray-700');
  
  content = content.replace(/text-neutral-100\b/g, 'text-gray-900');
  content = content.replace(/text-neutral-200\b/g, 'text-gray-700');

  // Remove opacity from text classes
  content = content.replace(/opacity-10\b/g, '');
  content = content.replace(/opacity-20\b/g, '');
  content = content.replace(/opacity-30\b/g, '');
  content = content.replace(/opacity-40\b/g, '');
  
  const isDashboardLayout = filePath.replace(/\\/g, '/').endsWith('DashboardLayout.jsx');

  if (!isDashboardLayout) {
      content = content.replace(/opacity-50\b/g, '');
      content = content.replace(/text-slate-200\b/g, 'text-gray-700');
      content = content.replace(/text-slate-300\b/g, 'text-gray-600');
  }

  content = content.replace(/text-slate-400\b/g, 'text-gray-500');
  content = content.replace(/text-slate-500\b/g, 'text-gray-500');
  content = content.replace(/text-slate-600\b/g, 'text-gray-600');
  content = content.replace(/text-slate-700\b/g, 'text-gray-700');
  content = content.replace(/text-slate-800\b/g, 'text-gray-900');
  content = content.replace(/text-slate-900\b/g, 'text-gray-900');
  content = content.replace(/text-slate-950\b/g, 'text-gray-900');

  // Enforce bold headings
  content = content.replace(/text-gray-900 font-semibold/g, 'text-gray-900 font-bold');
  content = content.replace(/text-3xl font-semibold/g, 'text-3xl font-bold');
  content = content.replace(/text-2xl font-semibold/g, 'text-2xl font-bold');
  content = content.replace(/text-xl font-semibold/g, 'text-xl font-bold');
  content = content.replace(/text-lg font-semibold/g, 'text-lg font-bold');

  // Clean up double spaces caused by removing opacity
  content = content.replace(/  +/g, ' ');
  content = content.replace(/ \)/g, ')');
  content = content.replace(/ "/g, '"');
  content = content.replace(/ '/g, "'");

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      let isExcluded = false;
      for (const excluded of EXCLUDED_DIRS) {
        if (fullPath.replace(/\\/g, '/').endsWith(excluded)) {
          isExcluded = true;
          break;
        }
      }
      if (!isExcluded) {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

DIRECTORIES_TO_SCAN.forEach(dir => {
  walkDir(path.join(__dirname, dir));
});

console.log('Text classes updated successfully.');
