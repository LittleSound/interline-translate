const { exec } = require('node:child_process')

// 导出
module.exports = {
  async sh(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err)
          reject(err)
        else
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
      })
    })
  },
}
