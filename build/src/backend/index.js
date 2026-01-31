const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const chokidar = require("chokidar");
const { spawn } = require("child_process");

const CONFIG_FILE = "/config/pdfs.yml";
const CSS_FILE = "/config/styles.css";

console.log("starting watcher");
console.log("config file:", CONFIG_FILE);
console.log();

if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`${CONFIG_FILE} not found`);
    process.exit(1);
}

const configRaw = fs.readFileSync(CONFIG_FILE, "utf8");
const config = yaml.load(configRaw);

if (!config?.pdfs || Object.keys(config.pdfs).length === 0) {
    console.error("no pdf definitions found");
    process.exit(1);
}

const PDF_KEYS = Object.keys(config.pdfs);

console.log("config file content:");
console.log(configRaw);
console.log();

console.log("discovered pdf definitions:");
PDF_KEYS.forEach((k) => console.log(" -", k));
console.log();

async function ensureDir(filePath) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
}

function runPandoc(args) {
    return new Promise((resolve, reject) => {
        const p = spawn("pandoc", args, {
            stdio: "inherit",
            env: {
                ...process.env,
                TMPDIR: "/tmp",
            },
        });

        p.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`pandoc exited with code ${code}`));
        });
    });
}

async function buildHtml(key) {
    const def = config.pdfs[key];
    const inputPath = def.input;
    const pdfOutput = def.output;
    const htmlOutput = pdfOutput.replace(/\.pdf$/, ".html");
    const title = def.title || "";

    await ensureDir(htmlOutput);

    const args = [
        inputPath,
        "-o",
        htmlOutput,
        "--to=html",
        "--standalone",
        "--self-contained",
        `--resource-path=${path.dirname(inputPath)}`,
        `--metadata=title:${title}`,
    ];

    if (fs.existsSync(CSS_FILE)) {
        args.push("--css", CSS_FILE);
    }

    await runPandoc(args);
}

async function buildPdf(key) {
    const def = config.pdfs[key];
    const inputPath = def.input;
    const outputPath = def.output;
    const title = def.title || "";

    if (!inputPath || !outputPath) {
        console.error(`pdf '${key}' has empty input or output`);
        process.exit(1);
    }

    if (!fs.existsSync(inputPath)) {
        return;
    }

    console.log(`building pdf '${key}' -> ${outputPath}`);

    await ensureDir(outputPath);

    await buildHtml(key);

    const args = [
        inputPath,
        "-o",
        outputPath,
        "--pdf-engine=weasyprint",
        `--pdf-engine-opt=--base-url=${path.dirname(inputPath)}`,
        `--metadata=title:${title}`,
    ];

    if (fs.existsSync(CSS_FILE)) {
        args.push("--css", CSS_FILE);
    }

    await runPandoc(args);
}

(async () => {
    console.log("initial build phase starting");

    for (const key of PDF_KEYS) {
        await buildPdf(key);
    }

    console.log("initial build phase completed");
    console.log();

    const WATCH_DIRS = [...new Set(PDF_KEYS.map((key) => path.dirname(config.pdfs[key].input)))];

    console.log("watching directories:");
    WATCH_DIRS.forEach((d) => console.log(" -", d));
    console.log();

    const watcher = chokidar.watch(WATCH_DIRS, { ignoreInitial: true });

    watcher.on("change", async (filePath) => {
        console.log("filesystem event:", filePath);

        for (const key of PDF_KEYS) {
            if (filePath === config.pdfs[key].input) {
                console.log(`change matched pdf '${key}'`);

                try {
                    await buildPdf(key);
                } catch (err) {
                    console.error(`build failed for '${key}':`, err.message);
                }
            }
        }
    });
})();
