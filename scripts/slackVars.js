import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const distFile = path.resolve(process.cwd(), 'dist/app.js')

let content = fs.readFileSync(distFile, 'utf8')

content = content
  .replace(/__SLACK_CLIENT_ID__/g, process.env.SLACK_CLIENT_ID || '')
  .replace(/__SLACK_CLIENT_SECRET__/g, process.env.SLACK_CLIENT_SECRET || '')
  .replace(/__SLACK_REDIRECT_URL__/g, process.env.SLACK_REDIRECT_URL || '')

fs.writeFileSync(distFile, content, 'utf8')