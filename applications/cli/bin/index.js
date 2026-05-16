#!/usr/bin/env node

import { createRequire } from "node:module";
import { join } from "node:path";

const package_ = createRequire(import.meta.url)("../package.json");

import(join("..", package_.exports["."].default));
