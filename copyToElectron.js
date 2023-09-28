const fs = require('fs');
const path = require('path');

function copyFiles(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination);
    }

    fs.readdir(source, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return;
        }

        files.forEach(file => {
            const currentPath = path.join(source, file);

            fs.stat(currentPath, (err, stat) => {
                if (err) {
                    console.error("Error reading file:", err);
                    return;
                }

                if (stat.isDirectory()) {
                    copyFiles(currentPath, destination);
                } else {
                    const destPath = path.join(destination, file);

                    // Check if file already exists in the destination
                    let counter = 0;
                    let finalDestPath = destPath;
                    while (fs.existsSync(finalDestPath)) {
                        counter++;
                        const ext = path.extname(destPath);
                        const base = path.basename(destPath, ext);
                        finalDestPath = path.join(destination, `${base}-${counter}${ext}`);
                    }

                    fs.copyFile(currentPath, finalDestPath, (err) => {
                        if (err) {
                            console.error("Error copying file:", err);
                        }
                    });
                }
            });
        });
    });
}

const args = process.argv.slice(2);
const sourceArgIndex = args.indexOf('--source');
const destArgIndex = args.indexOf('--dest');

if (sourceArgIndex === -1 || destArgIndex === -1) {
    console.error('Please provide both --source and --dest arguments.');
    process.exit(1);
}

const sourceDir = path.resolve(args[sourceArgIndex + 1]);
const destDir = path.resolve(args[destArgIndex + 1]);

copyFiles(sourceDir, destDir);
