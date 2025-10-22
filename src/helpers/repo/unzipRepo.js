import unzipper from "unzipper";
import fs from "fs"

export const unzipRepo = async (zipPath, tempDir) => {
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: tempDir }))
    .promise();
  // After this, the extracted repo will be in tempDir/subfolder
  // The subfolder is named like {repo}-{branch}, e.g. raptor-main
  const folders = fs.readdirSync(tempDir).filter(name => fs.lstatSync(`${tempDir}/${name}`).isDirectory());
  if (!folders.length) throw new Error("Extraction failed or no repo found in ZIP.");
  return `${tempDir}/${folders[0]}`; // fullExtractedPath
}
