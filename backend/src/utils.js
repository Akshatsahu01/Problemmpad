export function normalizeOutput(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[\t ]+$/g, ''))
    .join('\n')
    .replace(/\n+$/g, '');
}

export function judgeStatus(results) {
  if (results.length && results.every((result) => result.passed)) return 'Accepted';
  if (results.some((result) => result.compileError)) return 'Compile Error';
  if (results.some((result) => result.runtimeError)) return 'Runtime Error';
  return 'Wrong Answer';
}

export function selectExecutionCases(tests, submit, testIds) {
  return tests.filter((testCase) =>
    submit
      ? testCase.source === 'manual' || testCase.verified
      : testCase.visibility === 'sample' || !testIds || testIds.includes(String(testCase.id))
  );
}

export function normalizeGeneratedTests(candidates) {
  if (candidates && !Array.isArray(candidates) && typeof candidates === 'object') {
    candidates = candidates.testCases ?? candidates.test_cases ?? candidates.tests ?? candidates.cases;
  }
  if (!Array.isArray(candidates) || candidates.length > 8) return null;
  const toText = (value) =>
    typeof value === 'string' ? value : JSON.stringify(value);
  const normalized = candidates.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') return null;
    const rawInput = candidate.input ?? candidate.stdin;
    const rawOutput = candidate.expectedOutput ?? candidate.expected_output ?? candidate.expected ?? candidate.output ?? candidate.stdout;
    if (rawInput === undefined || rawOutput === undefined) return null;
    const input = toText(rawInput);
    const expectedOutput = toText(rawOutput);
    if (typeof input !== 'string' || typeof expectedOutput !== 'string' || input.length > 50000 || expectedOutput.length > 50000) return null;
    return {
      input,
      expectedOutput,
      description: typeof candidate.description === 'string' ? candidate.description.slice(0, 500) : '',
    };
  });
  return normalized.every(Boolean) ? normalized : null;
}

export function buildExecutableSource(code, language) {
  if (language === 'python' && /^\s*(?:class\s+Solution\b|def\s+solve\s*\()/m.test(code) && !/^\s*if\s+__name__\s*==\s*["']__main__["']\s*:/m.test(code)) {
    return `${code}\n\n# ProblemPad function-style runner\nimport contextlib as _cv_contextlib\nimport inspect as _cv_inspect\nimport io as _cv_io\nimport json as _cv_json\nimport sys as _cv_sys\n\n_cv_raw = _cv_sys.stdin.read()\ntry:\n    _cv_data = _cv_json.loads(_cv_raw)\nexcept Exception:\n    _cv_parts = _cv_raw.split()\n    def _cv_atom(value):\n        try:\n            return _cv_json.loads(value)\n        except Exception:\n            return value\n    _cv_data = _cv_atom(_cv_parts[0]) if len(_cv_parts) == 1 else [_cv_atom(value) for value in _cv_parts]\n_cv_fn = Solution().solve if 'Solution' in globals() and hasattr(Solution, 'solve') else globals().get('solve')\nif _cv_fn is None:\n    raise RuntimeError('Define Solution.solve(...) or solve(...) so ProblemPad can run this solution.')\n_cv_params = [p for p in _cv_inspect.signature(_cv_fn).parameters.values() if p.name not in ('self', 'cls') and p.kind in (_cv_inspect.Parameter.POSITIONAL_ONLY, _cv_inspect.Parameter.POSITIONAL_OR_KEYWORD)]\n_cv_required = sum(p.default is _cv_inspect.Parameter.empty for p in _cv_params)\nif isinstance(_cv_data, dict):\n    _cv_names = {p.name for p in _cv_params}\n    _cv_args = [] if not _cv_params else ([_cv_data] if len(_cv_params) <= 1 and not _cv_names.issubset(_cv_data) else [])\n    _cv_kwargs = {k: v for k, v in _cv_data.items() if k in _cv_names}\n    if not _cv_args and len(_cv_kwargs) < _cv_required:\n        _cv_args = list(_cv_data.values())\n        _cv_kwargs = {}\nelif isinstance(_cv_data, list) and _cv_required > 1:\n    _cv_args, _cv_kwargs = _cv_data, {}\nelse:\n    _cv_args, _cv_kwargs = ([] if not _cv_params else [_cv_data]), {}\n_cv_capture = _cv_io.StringIO()\nwith _cv_contextlib.redirect_stdout(_cv_capture):\n    _cv_result = _cv_fn(*_cv_args, **_cv_kwargs)\n_cv_printed = _cv_capture.getvalue()\nif _cv_printed:\n    _cv_sys.stdout.write(_cv_printed)\nelif _cv_result is not None:\n    if isinstance(_cv_result, str):\n        _cv_sys.stdout.write(_cv_result)\n    else:\n        _cv_sys.stdout.write(_cv_json.dumps(_cv_result, separators=(',', ':')))\n`;
  }
  if (language === 'javascript' && /(?:function\s+solve\s*\(|(?:const|let|var)\s+solve\s*=|class\s+Solution\b)/.test(code) && !/^\s*if\s*\(\s*require\.main\s*===\s*module\s*\)/m.test(code)) {
    return `${code}\n\n// ProblemPad function-style runner\n(async () => {\n  const _cvRaw = require('fs').readFileSync(0, 'utf8');\n  let _cvData;\n  try { _cvData = JSON.parse(_cvRaw); } catch {\n    const _cvParts = _cvRaw.trim().split(/\\s+/).filter(Boolean);\n    const _cvAtom = (v) => { try { return JSON.parse(v); } catch { return v; } };\n    _cvData = _cvParts.length === 1 ? _cvAtom(_cvParts[0]) : _cvParts.map(_cvAtom);\n  }\n  const _cvFn = typeof solve === 'function' ? solve : (typeof Solution !== 'undefined' ? new Solution().solve : null);\n  if (typeof _cvFn !== 'function') throw new Error('Define solve(...) so ProblemPad can run this solution.');\n  const _cvArgs = Array.isArray(_cvData) && _cvFn.length > 1 ? _cvData : [_cvData];\n  const _cvLogs = [];\n  const _cvOldLog = console.log;\n  console.log = (...args) => _cvLogs.push(require('util').format(...args));\n  try {\n    const _cvResult = await _cvFn(..._cvArgs);\n    if (_cvLogs.length) process.stdout.write(_cvLogs.join('\\n'));\n    else if (_cvResult !== undefined && _cvResult !== null) process.stdout.write(typeof _cvResult === 'string' ? _cvResult : JSON.stringify(_cvResult));\n  } finally { console.log = _cvOldLog; }\n})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });\n`;
  }
  return code;
}
