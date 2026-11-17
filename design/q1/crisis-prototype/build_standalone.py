"""Package the same UI and source CSVs as a portable, offline HTML prototype."""
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
INPUTS = {
    'ow': REPO / 'datasets/ONT-SA/selected/ont-sa-characteristic-ow-ont.csv',
    'odsp': REPO / 'datasets/ONT-SA/selected/ont-sa-characteristic-odsp-ont.csv',
    'unemployment': REPO / 'datasets/ONT-SA/selected/1410028701_databaseLoadingData.csv',
    'adequacy': HERE / 'data/adequacy.csv',
    'events': HERE / 'data/policy-events.csv',
}


def build():
    html = (HERE / 'index.html').read_text()
    css = (HERE / 'styles.css').read_text()
    analysis = (HERE / 'analysis.js').read_text()
    app = (HERE / 'app.js').read_text()
    raw = {key: path.read_text(encoding='utf-8-sig') for key, path in INPUTS.items()}
    payload = json.dumps(raw, ensure_ascii=False).replace('<', '\\u003c')
    analysis = re.sub(r'^export\s+', '', analysis, flags=re.M)
    app = re.sub(r'^import\s+.*?from\s+[\'"]\./analysis\.js[\'"];?\s*', '', app, flags=re.M)
    bundle = 'globalThis.PROTOTYPE_CSV = ' + payload + ';\n' + analysis + '\n' + app
    if '</script' in bundle.lower():
        raise ValueError('Script terminator in bundle; escape before packaging.')
    html, css_count = re.subn(r'<link\b[^>]*href=[\'"]\./styles\.css[\'"][^>]*>', lambda _: '<style>\n' + css + '\n</style>', html)
    html, js_count = re.subn(r'<script\b[^>]*src=[\'"]\./app\.js[\'"][^>]*>\s*</script>', lambda _: '<script type="module">\n' + bundle + '\n</script>', html)
    assert css_count == js_count == 1, (css_count, js_count)
    for name in ['README.md', 'METHODS.md']:
        html = html.replace(f'href="./{name}"', f'href="https://github.com/mikuknightforever/sta313-project-docs/blob/eric_roughwork/design/q1/crisis-prototype/{name}"')
    (HERE / 'standalone.html').write_text(html)
    manifest = {
        'description': 'Offline package of index.html; all displayed statistical values are derived from embedded CSVs in the browser.',
        'inputs': {key: {'path': str(path.relative_to(REPO)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for key, path in INPUTS.items()},
        'implementation': {name: hashlib.sha256((HERE / name).read_bytes()).hexdigest() for name in ['index.html', 'styles.css', 'app.js', 'analysis.js']},
        'standalone_sha256': hashlib.sha256((HERE / 'standalone.html').read_bytes()).hexdigest(),
    }
    (HERE / 'build-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Built standalone.html ({len(html.encode())} bytes), with {len(raw)} source CSVs.')


if __name__ == '__main__':
    build()
