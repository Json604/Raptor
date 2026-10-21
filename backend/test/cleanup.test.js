import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "fs"
import os from "os"
import path from "path"
import { removeStaleWorkDirs } from "../src/helpers/scanners/repository.js"

test('temp folders left by an interrupted scan are removed, nothing else is', () => {
    const stale = fs.mkdtempSync(path.join(os.tmpdir(), 'raptor-'))
    fs.writeFileSync(path.join(stale, 'repo.zip'), 'x')
    const unrelated = fs.mkdtempSync(path.join(os.tmpdir(), 'other-'))
    assert.ok(removeStaleWorkDirs() >= 1)
    assert.equal(fs.existsSync(stale), false)
    assert.equal(fs.existsSync(unrelated), true)
    fs.rmSync(unrelated, { recursive: true })
})
