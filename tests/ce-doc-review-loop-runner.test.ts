import { readFile } from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"

const skillPath = path.join(process.cwd(), "skills/ce-doc-review-loop/SKILL.md")
const protocolPath = path.join(process.cwd(), "skills/ce-doc-review-loop/references/loop-protocol.md")

function section(body: string, start: string, end: string): string {
  const from = body.indexOf(start)
  const to = body.indexOf(end, from + start.length)
  expect(from).toBeGreaterThanOrEqual(0)
  expect(to).toBeGreaterThan(from)
  return body.slice(from, to)
}

describe("ce-doc-review-loop canonical runner", () => {
  test("uses one canonical direct or host-native runner route", async () => {
    const [skill, protocol] = await Promise.all([readFile(skillPath, "utf8"), readFile(protocolPath, "utf8")])
    const workflow = section(skill, "## Workflow", "## Interaction Rules")
    const pass1 = section(protocol, "## Pass 1", "## Pass 2")

    expect(workflow).toContain("prefer a direct callable skill mechanism")
    expect(workflow).toContain("host-native child or isolated runner")
    expect(workflow).toContain("invocation adapter, not a substitute")
    expect(pass1).toContain("exact arguments `mode:non-interactive <snapshot-path>`")
    expect(pass1).toContain("Once dispatch may have started, never retry")
    expect(pass1).toContain("invocation_execution_failure")
    expect(pass1).not.toMatch(/broker|registry[_ -]mac|same-UID|attacker|quarantine/i)
  })

  test("preserves output-only handoff and exclusive failure classes", async () => {
    const protocol = await readFile(protocolPath, "utf8")
    const pass1 = section(protocol, "## Pass 1", "## Pass 2")

    expect(pass1).toContain("skill_unreachable")
    expect(pass1).toContain("invocation_adapter_error")
    expect(pass1).toContain("invocation_execution_failure")
    expect(pass1).toContain("output-only handoff text")
    expect(pass1).toContain("$ce-doc-review")
  })

  test("keeps accidental-concurrency and producer receipt checks", async () => {
    const [skill, protocol] = await Promise.all([readFile(skillPath, "utf8"), readFile(protocolPath, "utf8")])
    const pass1 = section(protocol, "## Pass 1", "## Pass 2")

    expect(skill).toContain("realpath`, `dev`, and `ino")
    expect(skill).toContain("concurrent_change")
    expect(pass1).toContain("result fingerprint equals the current disposable snapshot fingerprint")
    expect(pass1).toContain("product path still equals the frozen fingerprint")
    expect(pass1).toContain("producer-owned receipt fields")
    expect(pass1).toContain("`required_reviewers` must be a subset of `selected_reviewers`")
    expect(pass1).toContain("do not infer requiredness from reviewer names")
  })
})
