#!/usr/bin/env node
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path'

const nodeModulesPath = './bundle-node_modules';
const commonModulesPath = './bundle-common';
export const NODE_LAMBDA_LAYER_DIR = path.resolve(process.cwd(), nodeModulesPath);
export const COMMON_LAMBDA_LAYER_DIR = path.resolve(process.cwd(), commonModulesPath);

const NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME = `nodejs`;
const runtimeDirName = path.resolve(process.cwd(), `${nodeModulesPath}/${NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME}`);
const distFilePath = (file: string) => path.resolve(process.cwd(), `${nodeModulesPath}/${NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME}/${file}`)
const srcFilePath = (file: string) => path.resolve(`${process.cwd()}/../${file}`)

export const bundleNpm = () => {
  createNodeModules();
  // copyCommonModules();
};


const createNodeModules = () => {
  // create bundle directory
  copyPackageJson();

  // install package.json (production)
  childProcess.execSync(`npm install --production`, {
    cwd: getModulesInstallDirName(),
    env: { ...process.env },
  });
}


const copyPackageJson = () => {
  fs.mkdirsSync(getModulesInstallDirName());
  ['package.json']
    .map(file => fs.copyFileSync(srcFilePath(file), distFilePath(file)));
};

const getModulesInstallDirName = (): string => {
  return runtimeDirName;
};

const copyCommonModules = () => {
  const dist = path.resolve(process.cwd(), `${commonModulesPath}/${NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME}`)
  const src = path.resolve(`${process.cwd()}/../src/common`)
  fs.mkdirsSync(`${commonModulesPath}`);
  fs.copySync(src, dist);
}