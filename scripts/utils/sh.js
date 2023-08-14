import { exec } from 'node:child_process'

export async function sh(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err)
        reject(err)
      else
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
    })
  })
}
