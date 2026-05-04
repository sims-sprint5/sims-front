const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'locales' && file !== 'node_modules' && file !== 'dist') {
        walk(path.join(dir, file), fileList);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.vue') || file.endsWith('.js')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const srcPath = path.join(__dirname, 'src');
const allFiles = walk(srcPath);
console.log(`Found ${allFiles.length} files to check.`);
const filesWithAccents = [];
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Simple check for Spanish accents or common words
  if (/[áéíóúñÁÉÍÓÚÑçàèòÀÈÒ]/.test(content) || /guardar|cancelar|usuario|vehículo|eliminar|editar/i.test(content)) {
    filesWithAccents.push(file.replace(__dirname + path.sep, ''));
  }
}
console.log(`Files with potential Spanish/Catalan text (${filesWithAccents.length}):`);
console.log(filesWithAccents.join('\n'));
