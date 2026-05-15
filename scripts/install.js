#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// ── Constants ──────────────────────────────────────────────
const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const SKILLS_DIR = path.join(CLAUDE_DIR, "skills");
const COMMANDS_DIR = path.join(CLAUDE_DIR, "commands");
const CONFIG_PATH = path.join(CLAUDE_DIR, "obsidian-harness.json");
const ACTIVE_PROFILE_DIR = path.join(CLAUDE_DIR, "obsidian-harness", "active-profile");
const REPO_ROOT = path.resolve(__dirname, "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");
const MODULES_DIR = path.join(REPO_ROOT, "modules");
const REGISTRY_PATH = path.join(REPO_ROOT, "skill-registry.json");

// ── Config helpers ─────────────────────────────────────────
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function saveConfig(config) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function resolveVaultPath(flag) {
  // 1. CLI flag
  if (flag) {
    const p = path.resolve(flag);
    if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
      console.error(`Error: Vault path does not exist or is not a directory: ${p}`);
      process.exit(1);
    }
    return p;
  }
  // 2. Auto-detect .obsidian/ in cwd (takes priority over saved config)
  if (fs.existsSync(path.join(process.cwd(), ".obsidian"))) {
    return process.cwd();
  }
  // 3. Saved config (fallback when cwd is not a vault)
  const config = loadConfig();
  if (config && config.vault) return config.vault;
  return null;
}

// ── Profile helpers ────────────────────────────────────────
function listAvailableProfiles() {
  if (!fs.existsSync(PROFILES_DIR)) return [];
  const profiles = [];
  for (const entry of fs.readdirSync(PROFILES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(PROFILES_DIR, entry.name, "config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      profiles.push({ name: entry.name, description: config.description || "", modules: config.modules || [] });
    }
  }
  return profiles;
}

function loadProfile(profileName) {
  const dir = path.join(PROFILES_DIR, profileName);
  const configPath = path.join(dir, "config.json");
  if (!fs.existsSync(configPath)) return null;
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return { name: profileName, description: cfg.description || "", modules: cfg.modules || [], dir };
}

function deployProfile(profileName) {
  const sourceDir = path.join(PROFILES_DIR, profileName);
  const sourceProfileMd = path.join(sourceDir, "profile.md");
  const sourcePromptJson = path.join(sourceDir, "prompt.json");
  fs.mkdirSync(ACTIVE_PROFILE_DIR, { recursive: true });
  const destProfileMd = path.join(ACTIVE_PROFILE_DIR, "profile.md");
  const destPromptJson = path.join(ACTIVE_PROFILE_DIR, "prompt.json");

  if (fs.existsSync(destProfileMd)) {
    console.log(`  ℹ User profile already exists, keeping it`);
  } else if (fs.existsSync(sourceProfileMd)) {
    fs.copyFileSync(sourceProfileMd, destProfileMd);
    console.log(`  ✓ profile: deployed to ${destProfileMd}`);
    console.log(`  ⚠ Please edit profile.md to fill in your Obsidian usage habits`);
  }

  // Always deploy prompt.json (users may edit it to customize skill prompts)
  if (fs.existsSync(sourcePromptJson)) {
    if (fs.existsSync(destPromptJson)) {
      console.log(`  ℹ prompt.json already exists, keeping user customizations`);
    } else {
      fs.copyFileSync(sourcePromptJson, destPromptJson);
      console.log(`  ✓ prompt.json: deployed to ${destPromptJson}`);
    }
  }
}

// ── Symlink helpers ────────────────────────────────────────
function symlinkForce(target, linkPath) {
  if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath);
}

function findSkillsInDir(dir) {
  const skills = [];
  if (!fs.existsSync(dir)) return skills;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (fs.existsSync(path.join(dir, entry.name, "SKILL.md"))) {
      skills.push({ name: entry.name, dir: path.join(dir, entry.name) });
    }
  }
  return skills;
}

function findCommandsInDir(dir) {
  const commands = [];
  if (!fs.existsSync(dir)) return commands;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      commands.push({ name: entry.name.replace(".md", ""), file: path.join(dir, entry.name) });
    }
  }
  return commands;
}

function findTemplatesInDir(dir) {
  const templates = [];
  if (!fs.existsSync(dir)) return templates;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      templates.push({ name: entry.name, file: path.join(dir, entry.name) });
    }
  }
  return templates;
}

function extractDepends(skillDir) {
  const skillMd = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillMd)) return [];
  const content = fs.readFileSync(skillMd, "utf-8");
  const match = content.match(/^depends:\s*\[([^\]]*)\]/m);
  if (!match) return [];
  return match[1].split(",").map((s) => s.trim().replace(/"/g, "").replace(/'/g, ""));
}

// ── Registry & dependency ──────────────────────────────────
function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
}

function getInstalledSkillNames() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() || e.isSymbolicLink())
    .map((e) => e.name);
}

function installFromRegistry(skillNames, label) {
  if (skillNames.length === 0) return [];
  const registry = loadRegistry();
  const byName = Object.fromEntries(registry.map((r) => [r.name, r]));
  const bySource = {};
  const unknown = [];
  for (const name of skillNames) {
    const info = byName[name];
    if (info) {
      if (!bySource[info.source]) bySource[info.source] = { install: info.install, skills: [] };
      bySource[info.source].skills.push(name);
    } else {
      unknown.push(name);
    }
  }
  const failed = [];
  for (const [source, { install, skills }] of Object.entries(bySource)) {
    console.log(`\n  ${label} ${skills.join(", ")} from ${source}...`);
    try {
      execSync(install, { stdio: "inherit" });
      console.log(`  ✓ Installed: ${source}`);
    } catch {
      console.error(`  ✗ Failed: ${source}`);
      console.error(`    Run manually: ${install}`);
      failed.push(...skills);
    }
  }
  for (const name of unknown) {
    console.error(`  ✗ ${name} — not in registry`);
    failed.push(name);
  }
  return failed;
}

function autoInstallOfficial() {
  const registry = loadRegistry();
  const installed = new Set(getInstalledSkillNames());
  const missing = registry.filter((r) => r.category === "official" && !installed.has(r.name)).map((r) => r.name);
  if (missing.length === 0) { console.log("  ✓ Official skills already installed."); return []; }
  return installFromRegistry(missing, "Installing official");
}

function autoInstallDepends(allDepends) {
  const missing = [...new Set(allDepends)].filter((d) => !new Set(getInstalledSkillNames()).has(d));
  if (missing.length === 0) { console.log("  ✓ All skill dependencies satisfied."); return []; }
  return installFromRegistry(missing, "Installing dependency");
}

function showOptionalSkills() {
  const registry = loadRegistry();
  const installed = new Set(getInstalledSkillNames());
  const optional = registry.filter((r) => r.category !== "official" && !installed.has(r.name));
  if (optional.length === 0) return;
  console.log("\n  Optional skills (install when needed):\n");
  const shown = new Set();
  for (const r of optional) {
    if (!shown.has(r.source)) { console.log(`    [${r.category}] ${r.install}`); shown.add(r.source); }
  }
}

// ── Core: install modules ──────────────────────────────────
function installModules(modules, vaultPath) {
  const allSkills = [];
  const allCommands = [];
  const allDepends = [];

  for (const modName of modules) {
    const modDir = path.join(MODULES_DIR, modName);
    if (!fs.existsSync(modDir)) { console.log(`  Skipping module "${modName}" (not found)`); continue; }

    for (const skill of findSkillsInDir(path.join(modDir, "skills"))) {
      symlinkForce(skill.dir, path.join(SKILLS_DIR, skill.name));
      allSkills.push(skill);
      allDepends.push(...extractDepends(skill.dir));
      console.log(`  ✓ skill: ${skill.name}`);
    }

    for (const cmd of findCommandsInDir(path.join(modDir, "commands"))) {
      symlinkForce(cmd.file, path.join(COMMANDS_DIR, `${cmd.name}.md`));
      allCommands.push(cmd);
      console.log(`  ✓ command: /${cmd.name}`);
    }

    const templates = findTemplatesInDir(path.join(modDir, "templates"));
    if (templates.length > 0) {
      const dest = path.join(vaultPath, ".obsidian", "templates", "obsidian-harness");
      fs.mkdirSync(dest, { recursive: true });
      for (const tpl of templates) { fs.copyFileSync(tpl.file, path.join(dest, tpl.name)); console.log(`  ✓ template: ${tpl.name}`); }
    }

    const rulesDir = path.join(modDir, "rules");
    if (fs.existsSync(rulesDir)) {
      const dest = path.join(vaultPath, ".obsidian", "rules", "obsidian-harness");
      fs.mkdirSync(dest, { recursive: true });
      for (const rule of fs.readdirSync(rulesDir).filter((r) => r.endsWith(".md"))) {
        fs.copyFileSync(path.join(rulesDir, rule), path.join(dest, rule));
        console.log(`  ✓ rule: ${rule}`);
      }
    }
  }
  return { allSkills, allCommands, allDepends };
}

// ── Remove symlinks for skills not in the new profile ──────
function cleanStaleSkills(activeSkillNames) {
  if (!fs.existsSync(SKILLS_DIR)) return;
  const keep = new Set(activeSkillNames);
  let removed = 0;
  for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isSymbolicLink()) continue;
    if (!keep.has(entry.name)) {
      // Only remove symlinks pointing into our repo
      const target = fs.readlinkSync(path.join(SKILLS_DIR, entry.name));
      if (target.startsWith(REPO_ROOT)) {
        fs.unlinkSync(path.join(SKILLS_DIR, entry.name));
        console.log(`  - removed: ${entry.name}`);
        removed++;
      }
    }
  }
  if (removed === 0) console.log("  ✓ No stale skills to remove");
}

function cleanStaleCommands(activeCommandNames) {
  if (!fs.existsSync(COMMANDS_DIR)) return;
  const keep = new Set(activeCommandNames.map((n) => `${n}.md`));
  let removed = 0;
  for (const entry of fs.readdirSync(COMMANDS_DIR, { withFileTypes: true })) {
    if (!entry.isSymbolicLink()) continue;
    if (!keep.has(entry.name)) {
      const target = fs.readlinkSync(path.join(COMMANDS_DIR, entry.name));
      if (target.startsWith(REPO_ROOT)) {
        fs.unlinkSync(path.join(COMMANDS_DIR, entry.name));
        console.log(`  - removed: /${entry.name.replace(".md", "")}`);
        removed++;
      }
    }
  }
  if (removed === 0) console.log("  ✓ No stale commands to remove");
}

// ── Write vault-level marker ───────────────────────────────
function writeVaultMarker(vaultPath, profileName) {
  const marker = { profile: profileName, harnessVersion: "0.1.0" };
  fs.writeFileSync(path.join(vaultPath, ".obsidian-harness.json"), JSON.stringify(marker, null, 2));
}

// ── Commands ───────────────────────────────────────────────

function cmdInit(args) {
  const vaultPath = resolveVaultPath(args.vault);
  if (!vaultPath) {
    console.error("Error: No vault path found. Use --vault or run from inside an Obsidian vault.");
    process.exit(1);
  }

  const profileName = args.profile || "default";
  const profile = loadProfile(profileName);
  if (!profile) {
    console.error(`Error: Unknown profile "${profileName}".`);
    console.log("Available: " + listAvailableProfiles().map((p) => p.name).join(", "));
    process.exit(1);
  }

  console.log(`\nobsidian-harness v0.1.0`);
  console.log(`Profile: ${profileName} — ${profile.description}`);
  console.log(`Vault: ${vaultPath}\n`);

  deployProfile(profileName);
  const { allSkills, allCommands, allDepends } = installModules(profile.modules, vaultPath);

  saveConfig({
    version: "0.1.0",
    vault: vaultPath,
    profile: profileName,
    modules: profile.modules,
    installedAt: new Date().toISOString(),
    skills: allSkills.map((s) => s.name),
    commands: allCommands.map((c) => c.name),
  });
  writeVaultMarker(vaultPath, profileName);
  console.log(`\n  Config saved: ${CONFIG_PATH}`);

  let failedDeps = [];
  if (!args.noAutoDeps) {
    console.log("\nChecking official skills...");
    failedDeps.push(...autoInstallOfficial());
    console.log("\nChecking skill dependencies...");
    failedDeps.push(...autoInstallDepends(allDepends));
  }
  showOptionalSkills();

  console.log(`\n────────────────────────────────`);
  console.log(`Installed: ${allSkills.length} skills, ${allCommands.length} commands`);
  console.log(`Profile: ${profileName} | Vault: ${vaultPath}`);
  if (failedDeps.length > 0) console.log(`⚠ ${failedDeps.length} dependencies failed`);
  console.log(`\nDone! Restart Claude Code to activate.\n`);
}

function cmdSwitch(args) {
  const config = loadConfig();
  if (!config) {
    console.error("Error: Not installed yet. Run `obsidian-harness init` first.");
    process.exit(1);
  }

  const profileName = args.profile || args._[0];
  if (!profileName) {
    console.error("Error: Specify a profile. Usage: obsidian-harness switch <name>");
    console.log("Available: " + listAvailableProfiles().map((p) => p.name).join(", "));
    process.exit(1);
  }

  const profile = loadProfile(profileName);
  if (!profile) {
    console.error(`Error: Unknown profile "${profileName}".`);
    console.log("Available: " + listAvailableProfiles().map((p) => p.name).join(", "));
    process.exit(1);
  }

  const vaultPath = config.vault;
  console.log(`\nSwitching to profile: ${profileName} — ${profile.description}`);
  console.log(`Vault: ${vaultPath}\n`);

  // Clean stale
  console.log("Cleaning previous profile...");
  cleanStaleSkills(config.skills || []);
  cleanStaleCommands(config.commands || []);

  // Install new modules
  console.log("\nInstalling new profile...");
  const { allSkills, allCommands, allDepends } = installModules(profile.modules, vaultPath);

  // Update config
  config.profile = profileName;
  config.modules = profile.modules;
  config.skills = allSkills.map((s) => s.name);
  config.commands = allCommands.map((c) => c.name);
  config.switchedAt = new Date().toISOString();
  saveConfig(config);
  writeVaultMarker(vaultPath, profileName);
  console.log(`\n  Config updated: ${CONFIG_PATH}`);

  // Only install new deps that weren't in previous profile
  const prevInstalled = new Set(getInstalledSkillNames());
  const newDeps = allDepends.filter((d) => !prevInstalled.has(d));
  if (newDeps.length > 0) {
    console.log("\nInstalling new dependencies...");
    installFromRegistry([...new Set(newDeps)], "Installing dependency");
  } else {
    console.log("\n  ✓ All dependencies already satisfied.");
  }

  console.log(`\n────────────────────────────────`);
  console.log(`Switched to: ${profileName}`);
  console.log(`Skills: ${allSkills.map((s) => s.name).join(", ")}`);
  console.log(`Commands: ${allCommands.map((c) => c.name).map((n) => "/" + n).join(", ")}`);
  console.log(`Done! Restart Claude Code to activate.\n`);
}

function cmdListProfiles() {
  const profiles = listAvailableProfiles();
  const config = loadConfig();
  const active = config ? config.profile : null;
  console.log("\nAvailable profiles:\n");
  for (const p of profiles) {
    const marker = p.name === active ? " ← active" : "";
    console.log(`  ${p.name.padEnd(12)} ${p.description}${marker}`);
  }
  console.log("\nSwitch: npx obsidian-harness switch <name>");
  console.log("Custom: Create a directory under profiles/ with config.json + profile.md\n");
}

function cmdDashboard() {
  const config = loadConfig();
  if (!config) {
    console.error("Error: Not installed yet. Run `obsidian-harness init` first.");
    process.exit(1);
  }
  const vaultPath = config.vault;
  const profileName = config.profile || "unknown";

  // Count notes
  let totalNotes = 0;
  let dailyNotes = 0;
  let lastDaily = "none";
  const tags = new Set();

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === ".obsidian" || entry.name === ".agents") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name === "Daily") {
        // Count daily notes in Daily/ folder
        if (fs.existsSync(full)) {
          for (const f of fs.readdirSync(full)) {
            if (f.endsWith(".md")) { dailyNotes++; totalNotes++; }
          }
        }
      } else if (entry.isDirectory()) {
        scanDir(full);
      } else if (entry.name.endsWith(".md")) {
        totalNotes++;
        // Check if it's a daily note (YYYY-MM-DD.md)
        if (/^\d{4}-\d{2}-\d{2}\.md$/.test(entry.name)) {
          dailyNotes++;
          lastDaily = entry.name.replace(".md", "");
        }
        // Extract tags
        try {
          const content = fs.readFileSync(full, "utf-8");
          const tagMatch = content.match(/^tags:\s*\[([^\]]*)\]/m);
          if (tagMatch) tagMatch[1].split(",").forEach((t) => tags.add(t.trim()));
        } catch {}
      }
    }
  }
  scanDir(vaultPath);

  // Check harness version
  let harnessVersion = "unknown";
  const markerPath = path.join(vaultPath, ".obsidian-harness.json");
  if (fs.existsSync(markerPath)) {
    try { harnessVersion = JSON.parse(fs.readFileSync(markerPath, "utf-8")).harnessVersion || "unknown"; } catch {}
  }

  const vaultName = path.basename(vaultPath);
  console.log(`📊 Vault: ${vaultName}\n`);
  console.log(`📁 ${totalNotes} notes | ${tags.size} tags | ${dailyNotes} daily notes`);
  console.log(`📅 Last daily: ${lastDaily}`);
  console.log(`🔧 Profile: ${profileName}`);
  console.log(`📦 Harness: v${harnessVersion}`);
  console.log(`\nQuick actions: /daily /organize /review /process /dashboard /memory`);
}

function cmdRecommend() {
  const registry = loadRegistry();
  const categories = {};
  for (const r of registry) {
    if (!categories[r.category]) categories[r.category] = [];
    categories[r.category].push(r);
  }
  console.log("\nSkill Registry:\n");
  for (const [cat, skills] of Object.entries(categories)) {
    console.log(`## ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    for (const s of skills) {
      console.log(`  ${s.name} — ${s.description}`);
      console.log(`  ${s.install}`);
    }
    console.log();
  }
}

// ── Main ───────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);

  // No args = help
  if (argv.length === 0) { argv[0] = "--help"; }

  // Subcommand detection
  const subcommand = argv[0];
  const rest = argv.slice(1);

  if (subcommand === "init") {
    const args = parseFlags(rest);
    args.noAutoDeps = args.noAutoDeps || false;
    cmdInit(args);
  } else if (subcommand === "switch") {
    const args = parseFlags(rest);
    if (!args.profile && rest[0] && !rest[0].startsWith("--")) args._ = [rest[0]];
    cmdSwitch(args);
  } else if (subcommand === "--list-profiles" || subcommand === "profiles") {
    cmdListProfiles();
  } else if (subcommand === "--recommend") {
    cmdRecommend();
  } else if (subcommand === "dashboard") {
    cmdDashboard();
  } else if (subcommand === "--help" || subcommand === "-h") {
    showHelp();
  } else {
    console.error(`Error: Unknown command "${subcommand}". Run with --help for usage.`);
    process.exit(1);
  }
}

function parseFlags(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--vault": args.vault = argv[++i]; break;
      case "--profile": args.profile = argv[++i]; break;
      case "--no-auto-deps": args.noAutoDeps = true; break;
      default:
        if (!argv[i].startsWith("--")) args._.push(argv[i]);
        break;
    }
  }
  return args;
}

function showHelp() {
  const profiles = listAvailableProfiles();
  const active = (loadConfig() || {}).profile || "not installed";
  console.log(`obsidian-harness v0.1.0 — Curated Obsidian skills for Claude Code

Usage:
  npx obsidian-harness init [--vault <path>] [--profile <name>]   First-time install
  npx obsidian-harness switch <name>                              Switch profile (no reinstall)
  npx obsidian-harness profiles                                   List available profiles
  npx obsidian-harness --recommend                                Show third-party skills

Options:
  --vault <path>          Obsidian vault path (only needed for init; auto-detected if cwd has .obsidian/)
  --profile <name>        Profile to use (default: default)
  --no-auto-deps          Skip automatic dependency installation

Current profile: ${active}

Available profiles:
${profiles.map((p) => `  ${p.name.padEnd(12)} ${p.description}`).join("\n")}

Quick start:
  npx obsidian-harness init                     # Auto-detect vault, use default profile
  npx obsidian-harness init --profile blogging  # Install with blogging profile
  npx obsidian-harness switch project           # Switch to project profile (seconds)
`);
}

main();
