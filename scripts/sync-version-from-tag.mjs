import fs from 'node:fs';

const tag = process.argv[2];
if (!tag) {
  console.error('Usage: node scripts/sync-version-from-tag.mjs <tag>');
  process.exit(1);
}

const version = tag.startsWith('v') ? tag.slice(1) : tag;
if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`Invalid semver from tag: ${tag}`);
  process.exit(1);
}

console.log(`Syncing version to ${version} from tag ${tag}`);

for (const file of ['package.json', 'src-tauri/tauri.conf.json']) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.version = version;
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8').replace(
  /^version = ".*"$/m,
  `version = "${version}"`
);
fs.writeFileSync('src-tauri/Cargo.toml', cargo);

const lock = fs.readFileSync('src-tauri/Cargo.lock', 'utf8').replace(
  /name = "democue"\nversion = ".*"/,
  `name = "democue"\nversion = "${version}"`
);
fs.writeFileSync('src-tauri/Cargo.lock', lock);
