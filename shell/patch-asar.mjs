#!/usr/bin/env node
/**
 * Optional desktop-shell patch for dsh-desktop-sider-glass.
 *
 * Adds a transparent + system-acrylic window to the DeepSeek Harness desktop
 * shell so the glass can sample the real desktop behind the app:
 *
 *   - createWindow(): backgroundColor "#00000000" + backgroundMaterial "acrylic"
 *   - enterWorkspace(): the post-navigation setBackgroundColor() keeps transparent
 *   - updateBackground(): the theme-change handler keeps transparent
 *   - preload syncWindowsAppearance().mark(): sets data-window-material="acrylic"
 *
 * Every edit keeps the original file length, so only file data inside
 * resources/app.asar is rewritten in place. A byte-exact backup is written to
 * resources/app.asar.bak before the first change.
 *
 * Usage:
 *   node shell/patch-asar.mjs "<install dir>"        # patch
 *   node shell/patch-asar.mjs "<install dir>" --restore
 *
 * Tested with DSH Desktop 0.2.2-rc.5 (Electron 44.7.0, Windows 11).
 * Unknown builds fail with an explicit message instead of guessing.
 */
import {
  closeSync, copyFileSync, existsSync, fsyncSync, openSync, readSync, writeSync,
} from 'node:fs'
import { join } from 'node:path'

const MAIN = 'lib/main.js'
const PRELOAD = 'lib/preload-app.cjs'

const restore = process.argv.includes('--restore')
const install = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
if (!install) {
  console.error('usage: node shell/patch-asar.mjs "<DeepSeek Harness install dir>" [--restore]')
  process.exit(2)
}

const asarPath = join(install, 'resources', 'app.asar')
const backupPath = `${asarPath}.bak`

if (!existsSync(asarPath)) {
  console.error(`app.asar not found: ${asarPath}`)
  process.exit(2)
}

if (restore) {
  if (!existsSync(backupPath)) {
    console.error(`backup not found: ${backupPath}`)
    process.exit(2)
  }
  copyFileSync(backupPath, asarPath)
  console.log('restored the original app.asar — start DeepSeek Harness again')
  process.exit(0)
}

function readHeader(fd) {
  const head = Buffer.alloc(16)
  readSync(fd, head, 0, 16, 0)
  const size = head.readUInt32LE(4)
  const jsonLength = head.readUInt32LE(12)
  const json = Buffer.alloc(jsonLength)
  readSync(fd, json, 0, jsonLength, 16)
  return { header: JSON.parse(json.toString('utf8')), base: 8 + size }
}

function findEntry(header, path) {
  let node = header
  for (const part of path.split('/')) {
    node = node.files?.[part]
    if (node === undefined) throw new Error(`app.asar has no ${path}`)
  }
  return node
}

/** Shrink the first large enough comment so the file keeps its byte length. */
function donate(bytes, source) {
  if (bytes <= 0) return source
  const pattern = /\/\*\*(?:(?!\*\/)[\s\S])*?\*\//g
  let match
  while ((match = pattern.exec(source)) !== null) {
    const length = Buffer.byteLength(match[0])
    if (length > bytes + 80) {
      const keep = length - bytes
      const body = '/*' + ' '.repeat(keep - 4) + '*/'
      return source.slice(0, match.index) + body + source.slice(match.index + match[0].length)
    }
  }
  throw new Error('no comment block is large enough to keep the file size')
}

/** Apply literal replacements that must each match exactly once. */
function replaceOnce(source, pairs) {
  let out = source
  for (const [from, to] of pairs) {
    const count = out.split(from).length - 1
    if (count !== 1) throw new Error(`anchor matched ${count} times, expected 1: ${from.slice(0, 60)}…`)
    out = out.replace(from, to)
  }
  return out
}

function patchMain(source) {
  if (source.includes("dataset.windowMaterial")) return source
  const a1 = '\t\t\tbackgroundColor: chromeFallbackFill(),\n\t\t\ttitleBarStyle: "hidden",'
  const n1 = '\t\t\tbackgroundColor: "#00000000",\n\t\t\tbackgroundMaterial: "acrylic",\n\t\t\ttitleBarStyle: "hidden",'
  const a2 = '\t\t\tif (!window.isDestroyed()) window.setBackgroundColor(chromeFallbackFill());'
  const n2 = '\t\t\tif (!window.isDestroyed()) window.setBackgroundColor("#00000000");'
  const a3 = '\t\tif (process.platform === "win32") window.setBackgroundColor(chromeFallbackFill());'
  const n3 = '\t\tif (process.platform === "win32") window.setBackgroundColor("#00000000");'
  const a4 = '\tif (process.platform === "win32" && primary) {\n\t\tconst updateBackground'
  const n4 = '\twindow.webContents.on("did-finish-load", () => {\n'
    + '\t\twindow.webContents.executeJavaScript("document.documentElement.dataset.windowMaterial=\'acrylic\'").catch(() => {});\n'
    + '\t});\n' + a4
  let out = replaceOnce(source, [[a1, n1], [a2, n2], [a3, n3], [a4, n4]])
  out = donate(Buffer.byteLength(out) - Buffer.byteLength(source), out)
  return out
}

function patchPreload(source) {
  if (source.includes('dataset.windowMaterial')) return source
  const a1 = '\t\troot.dataset.windowsTitlebar = "";'
  const n1 = '\t\troot.dataset.windowsTitlebar = "";\n\t\troot.dataset.windowMaterial = "acrylic";'
  let out = replaceOnce(source, [[a1, n1]])
  out = donate(Buffer.byteLength(out) - Buffer.byteLength(source), out)
  return out
}

const fd = openSync(asarPath, 'r+')
try {
  const { header, base } = readHeader(fd)
  const target = findEntry(header, MAIN)
  const offset = base + Number(target.offset)
  const size = Number(target.size)
  const current = Buffer.alloc(size)
  readSync(fd, current, 0, size, offset)

  if (current.includes(Buffer.from('dataset.windowMaterial'))) {
    console.log('already patched — nothing to do')
    process.exit(0)
  }

  const mainSource = current.toString('utf8')

  const preloadNode = findEntry(header, PRELOAD)
  const preloadOffset = base + Number(preloadNode.offset)
  const preloadSize = Number(preloadNode.size)
  const preloadCurrent = Buffer.alloc(preloadSize)
  readSync(fd, preloadCurrent, 0, preloadSize, preloadOffset)

  const mainPatched = patchMain(mainSource)
  const preloadPatched = patchPreload(preloadCurrent.toString('utf8'))

  const mainBytes = Buffer.from(mainPatched, 'utf8')
  const preloadBytes = Buffer.from(preloadPatched, 'utf8')
  if (mainBytes.length !== size) throw new Error('main.js patch changed the file length')
  if (preloadBytes.length !== preloadSize) throw new Error('preload patch changed the file length')

  copyFileSync(asarPath, backupPath)
  writeSync(fd, mainBytes, 0, size, offset)
  writeSync(fd, preloadBytes, 0, preloadSize, preloadOffset)
  fsyncSync(fd)
  console.log('patched resources/app.asar')
  console.log(`backup: ${backupPath}`)
  console.log('quit DeepSeek Harness completely, then start it again')
} finally {
  closeSync(fd)
}
