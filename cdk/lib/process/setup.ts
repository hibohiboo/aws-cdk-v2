#!/usr/bin/env node
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path'

const bundlePath = './bundle';
export const NODE_LAMBDA_LAYER_DIR = path.resolve(process.cwd(), bundlePath);
const NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME = `nodejs`;
const runtimeDirName = path.resolve(process.cwd(), `${bundlePath}/${NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME}`);
const distFilePath = (file: string) => path.resolve(process.cwd(), `${bundlePath}/${NODE_LAMBDA_LAYER_RUNTIME_DIR_NAME}/${file}`)
const srcFilePath = (file: string) => path.resolve(`${process.cwd()}/../${file}`)

const bundleNpm = () => {
  // create bundle directory
  copyPackageJson();

  // install package.json (production)
  childProcess.execSync(`npm install --production`, {
    cwd: getModulesInstallDirName(),
    env: { ...process.env },
  });
};

const copyPackageJson = () => {
  fs.mkdirsSync(getModulesInstallDirName());
  ['package.json']
    .map(file => fs.copyFileSync(srcFilePath(file), distFilePath(file)));
};

const getModulesInstallDirName = (): string => {
  return runtimeDirName;
};

// 実行
bundleNpm();
