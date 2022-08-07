import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path'

const NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME = `nodejs`;

const distFilePath = (dir: string, file: string) => path.resolve(process.cwd(), `${dir}/${NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME}/${file}`)
const srcFilePath = (dir: string, file: string) => path.resolve(`${process.cwd()}/../lambdaLayers/${dir}/${file}`);

['util-node_modules', 'verify-node_modules'].map((nodeModulesPath) => {
  const distPath = `./bundle-${nodeModulesPath}`
  const runtimeDirName = path.resolve(process.cwd(), `${distPath}/${NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME}`);

  fs.mkdirsSync(runtimeDirName);
  ['package.json']
    .map(file => fs.copyFileSync(srcFilePath(nodeModulesPath, file), distFilePath(distPath, file)));
  childProcess.execSync(`npm install --production`, {
    cwd: runtimeDirName,
    env: { ...process.env },
  });
})

export const NODE_UTIL_LAMBDA_LAYER_DIR = path.resolve(process.cwd(), `./bundle-util-node_modules`);
export const NODE_VERIFY_LAMBDA_LAYER_DIR = path.resolve(process.cwd(), `./bundle-verify-node_modules`);
