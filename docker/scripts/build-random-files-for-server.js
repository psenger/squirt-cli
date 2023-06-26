#!/usr/bin/env node

const fs = require('fs'),
        path = require('path'),
        {randomBytes} = require('crypto');

const [, , ...args] = process.argv;

const MAX_DEPTH = parseInt(args[0] || process.env.FILEDEPTH, 10); // Specify the maximum depth of the directory structure
const ROOT_DIR = args[1] || process.env.DIRECTORY; // Specify the root directory name
const MIN_FILES = 0; // Specify the minimum number of files per directory
const MAX_FILES = 5; // Specify the maximum number of files per directory
const MIN_SIZE = 1024 * 1024; // Specify the minimum file size in bytes 1mb
const MAX_SIZE = 10 * 1024 * 1024; // Specify the maximum file size in bytes 10MB

let countDirectories = 0;
let countFiles = 0;

if (!fs.existsSync(ROOT_DIR)) {
    fs.mkdirSync(ROOT_DIR);
    console.log('Directory created successfully.');
} else {
    console.log('Directory already exists.');
}

function generateRandomData(size) {
    return randomBytes(size);
}

function createRandomFiles(directoryPath) {
    const numFiles = Math.floor(Math.random() * (MAX_FILES - MIN_FILES + 1)) + MIN_FILES; // Randomly choose the number of files in the directory

    for (let j = 0; j < numFiles; j++) {
        const fileName = `file_${j}.bin`;
        const filePath = path.join(directoryPath, fileName);
        const fileSize = Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE + 1)) + MIN_SIZE; // Randomly choose the file size
        const fileData = generateRandomData(fileSize); // Generate random data for the file
        fs.writeFileSync(filePath, fileData); // Create the file with random data
        console.log(`created file ${filePath} with size ${fileSize} bytes`);
        countFiles++
    }
}

function createRandomDirectoryStructure(depth, currentPath) {
    if (depth === 0) {
        return;
    }
    const numDirs = Math.floor(Math.random() * 5) + 1; // Randomly choose the number of subdirectories to create
    for (let i = 0; i < numDirs; i++) {
        const dirName = `dir_${depth}_${i}`;
        const dirPath = path.join(currentPath, dirName);
        fs.mkdirSync(dirPath); // Create the directory
        console.log(`created directory ${dirPath}`);
        countDirectories++
        createRandomFiles(dirPath); // Create random files in the directory
        createRandomDirectoryStructure(depth - 1, dirPath); // Recursively create subdirectories
    }
}


createRandomDirectoryStructure(MAX_DEPTH, ROOT_DIR);

console.log(`files created: ${countFiles}
directories created: ${countDirectories} `);
console.log(`done`);
