import { copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const routes = ['explore', 'trust', 'verify', 'recruiters', 'dashboard', 'recruiter-dashboard', 'admin']

await Promise.all(
  routes.map(async (route) => {
    const destination = join('dist', route)
    await mkdir(destination, { recursive: true })
    await copyFile(join('dist', 'index.html'), join(destination, 'index.html'))
  }),
)
