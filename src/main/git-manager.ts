import simpleGit, { SimpleGit } from 'simple-git'
import { join, dirname } from 'path'

export interface GitStatus {
  isRepo: boolean
  branch: string
  modified: string[]
  added: string[]
  deleted: string[]
  untracked: string[]
  ahead: number
  behind: number
}

export interface GitLogEntry {
  hash: string
  date: string
  message: string
  author: string
}

export async function getGitStatus(filePath?: string): Promise<GitStatus> {
  try {
    const dir = filePath ? dirname(filePath) : process.cwd()
    const git: SimpleGit = simpleGit(dir)
    const isRepo = await git.checkIsRepo()

    if (!isRepo) {
      return { isRepo: false, branch: '', modified: [], added: [], deleted: [], untracked: [], ahead: 0, behind: 0 }
    }

    const status = await git.status()
    const branch = status.current || 'unknown'

    return {
      isRepo: true,
      branch,
      modified: status.modified,
      added: status.created,
      deleted: status.deleted,
      untracked: status.not_added,
      ahead: status.ahead,
      behind: status.behind
    }
  } catch {
    return { isRepo: false, branch: '', modified: [], added: [], deleted: [], untracked: [], ahead: 0, behind: 0 }
  }
}

export async function gitCommit(filePath: string, message: string): Promise<boolean> {
  try {
    const dir = dirname(filePath)
    const git: SimpleGit = simpleGit(dir)
    await git.add(filePath)
    await git.commit(message)
    return true
  } catch {
    return false
  }
}

export async function gitCommitAll(repoPath: string, message: string): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(repoPath)
    await git.add('.')
    await git.commit(message)
    return true
  } catch {
    return false
  }
}

export async function gitPush(repoPath: string): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(repoPath)
    await git.push()
    return true
  } catch {
    return false
  }
}

export async function gitPull(repoPath: string): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(repoPath)
    await git.pull()
    return true
  } catch {
    return false
  }
}

export async function gitLog(repoPath: string, count: number = 20): Promise<GitLogEntry[]> {
  try {
    const git: SimpleGit = simpleGit(repoPath)
    const log = await git.log({ maxCount: count })
    return log.all.map(entry => ({
      hash: entry.hash,
      date: entry.date,
      message: entry.message,
      author: entry.author_name
    }))
  } catch {
    return []
  }
}

export async function gitInit(repoPath: string): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(repoPath)
    await git.init()
    return true
  } catch {
    return false
  }
}

export async function gitDiff(filePath: string): Promise<string> {
  try {
    const dir = dirname(filePath)
    const git: SimpleGit = simpleGit(dir)
    return await git.diff([filePath])
  } catch {
    return ''
  }
}
