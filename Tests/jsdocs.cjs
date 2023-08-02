const jsdoc2md = require('jsdoc-to-markdown');
const { readdirSync } = require('fs');
const { resolve } = require('path');
const {execSync} = require("child_process");

const inputDirectories = [
  'lib/src',
  'lib/src/functions',
  'lib/src/deprecated'
];

const outputDirectories = [
  'Mini_Docs',
  'Mini_Docs/functions',
  'Mini_Docs/deprecated'
];

inputDirectories.forEach((inputDir, index) => {
  const outputDir = outputDirectories[index];

  // Get all JavaScript files in the input directory
  const files = readdirSync(inputDir).filter(file => file.endsWith('.js'));

  // Generate markdown documentation for each file
  files.forEach(async (file) => {
    const inputFile = resolve(inputDir, file);
    const outputFile = resolve(outputDir, `${file.replace('.js', '')}.md`);

    execSync(`jsdoc2md ${inputFile} > ${outputFile}`, {stdio: 'inherit'});
  });
});
