"""Exercise the real browser, including mobile, offline packaging and visible values."""
import contextlib
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright
from build_standalone import HERE, REPO
from verify import expected_data


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def verify_browser():
    expected, annual = expected_data()
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(REPO)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/design/q1/crisis-prototype/'
    shots = HERE / 'screenshots'
    shots.mkdir(exist_ok=True)
    report = {'layouts': [], 'interactions': [], 'errors': [], 'offline_network_requests': []}
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
            page = browser.new_page(viewport={'width': 1360, 'height': 900})
            page.on('pageerror', lambda error: report['errors'].append(str(error)))
            page.on('console', lambda message: report['errors'].append(message.text) if message.type == 'error' else None)
            page.goto(url)
            page.wait_for_function('window.q1PrototypeState?.data?.quarters.length === 36')
            assert page.locator('#error').is_hidden()
            actual = page.evaluate('window.q1PrototypeState.data')
            for want, got in zip(expected, actual['quarters'], strict=True):
                for key in ['ow', 'odsp', 'unemployment', 'owIndex', 'odspIndex', 'owYoY', 'odspYoY', 'unemploymentYoY']:
                    assert got[key] is None if want[key] is None else math.isclose(want[key], got[key], abs_tol=1e-8)
            assert page.locator('#fact-unemployment').inner_text() == '13.0%'
            assert page.locator('#fact-ow').inner_text() == '−24.0%'
            assert page.locator('#scatter-chart circle').count() == 32
            for width in [1360, 820, 400]:
                page.set_viewport_size({'width': width, 'height': 900})
                page.wait_for_timeout(120)
                for theme in ['light', 'dark']:
                    if page.locator('html').get_attribute('data-theme') != theme:
                        page.locator('#theme-toggle').click()
                    overflow = page.evaluate('Math.max(0,document.documentElement.scrollWidth-window.innerWidth)')
                    assert overflow == 0, (width, theme, overflow)
                    assert page.locator('.chart svg').count() == 3
                    bad_svg = page.evaluate('''() => [...document.querySelectorAll('.chart svg')].flatMap(svg => {
                      const w=svg.viewBox.baseVal.width, h=svg.viewBox.baseVal.height;
                      return [...svg.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x < -1 || b.y < -1 || b.x+b.width>w+1 || b.y+b.height>h+1;}).map(t=>t.textContent);
                    })''')
                    assert not bad_svg, (width, theme, bad_svg)
                    page.screenshot(path=str(shots / f'{width}-{theme}.png'), full_page=True)
                    report['layouts'].append({'width':width,'theme':theme,'horizontal_overflow':overflow,'svg_text_outside_viewbox':bad_svg})
            page.set_viewport_size({'width':1360,'height':900})
            for phase, count, yoy_count in [('pre',12,8),('during',13,13),('post',11,11),('all',36,32)]:
                page.locator(f'[data-phase="{phase}"]').click()
                assert page.locator('#quarter-table tbody tr').count() == count
                assert page.locator('#scatter-chart circle').count() == yoy_count
                assert page.evaluate('q1PrototypeState.state.phase') == phase
            report['interactions'].append('All four phase filters update both plots and the table, excluding unavailable YoY.')
            page.locator('[data-measure="count"]').click()
            assert page.evaluate('q1PrototypeState.state.measure') == 'count'
            assert 'quarterly observations' in page.locator('#timeline-chart').inner_text()
            page.locator('[data-measure="index"]').click()
            page.locator('[data-program="ODSP"]').click()
            assert page.evaluate('q1PrototypeState.state.program') == 'ODSP'
            assert 'ODSP cases change' in page.locator('#scatter-readout').inner_text()
            page.locator('#path-toggle').uncheck()
            assert page.locator('#scatter-chart path').count() == 0
            page.locator('#path-toggle').check()
            report['interactions'].append('Counts/index, OW/ODSP and trajectory-path switches work.')
            page.locator('#quarter-slider').focus()
            page.keyboard.press('Home')
            assert page.evaluate('q1PrototypeState.state.selectedQuarter') == '2017 Q1'
            assert 'not available' in page.locator('#scatter-readout').inner_text()
            page.keyboard.press('ArrowRight')
            assert page.evaluate('q1PrototypeState.state.selectedQuarter') == '2017 Q2'
            page.keyboard.press('End')
            assert page.evaluate('q1PrototypeState.state.selectedQuarter') == '2025 Q4'
            report['interactions'].append('Keyboard slider retrieves first/last/adjacent quarters and labels missing YoY.')
            page.locator('details.data-details summary').click()
            for year in [2020,2024]:
                page.locator('#adequacy-year').select_option(str(year))
                rows = page.locator('#adequacy-table tbody tr').all_inner_texts()
                for want, row in zip([r for r in annual if r['year']==year], rows, strict=True):
                    assert f"${want['income']:,.0f}" in row
                    assert f"${want['threshold']:,.0f}" in row
                    assert f"{want['ratio']:.1f}%" in row
                assert 'Benchmark status:' in page.locator('#adequacy-note').inner_text()
                if year == 2020:
                    assert 'excludes CERB/CRB' in page.locator('#adequacy-note').inner_text()
                    assert 'estimate' in page.locator('#adequacy-note').inner_text()
            report['interactions'].append('Both annual snapshots display independently verified incomes, thresholds, ratios and assumptions.')
            assert page.locator('#quarter-table').is_visible()
            page.locator('details.data-details summary').click()
            page.locator('#theme-toggle').click()
            page.locator('[data-program="OW"]').click()
            page.locator('#quarter-slider').focus()
            page.keyboard.press('Home')
            for _ in range(13):
                page.keyboard.press('ArrowRight')
            page.screenshot(path=str(shots / 'desktop-light.png'), full_page=True)
            page.locator('#adequacy').screenshot(path=str(shots / 'adequacy-detail.png'))
            mobile_context = browser.new_context(viewport={'width':400,'height':850}, has_touch=True, is_mobile=True)
            mobile = mobile_context.new_page()
            mobile.goto(url)
            mobile.wait_for_function('window.q1PrototypeState?.data')
            mobile.locator('[data-phase="during"]').tap()
            mobile.locator('[data-program="ODSP"]').tap()
            assert mobile.evaluate('q1PrototypeState.state.phase') == 'during'
            assert mobile.evaluate('q1PrototypeState.state.program') == 'ODSP'
            mobile.screenshot(path=str(shots / 'mobile-interaction.png'), full_page=True)
            mobile_context.close()
            report['interactions'].append('Touch controls work at 400px.')
            offline = browser.new_page()
            offline.on('request', lambda request: report['offline_network_requests'].append(request.url) if request.resource_type != 'document' and request.url.startswith(('http://','https://')) else None)
            offline.on('pageerror', lambda error: report['errors'].append('offline: '+str(error)))
            # A direct file:// probe in this environment returned
            # ERR_BLOCKED_BY_ADMINISTRATOR. Exercise the same portable document
            # over the ordinary local preview server, without changing policy.
            report['portable_open_mode'] = 'HTTP standalone document; this host blocks file:// navigation'
            offline.goto(url + 'standalone.html')
            offline.wait_for_function('window.q1PrototypeState?.data?.quarters.length === 36')
            assert offline.evaluate('window.q1PrototypeState.data') == actual
            assert not report['offline_network_requests']
            report['interactions'].append('Self-contained standalone.html produces identical data without additional network resources.')
            browser.close()
        assert not report['errors'], report['errors']
        report['passed'] = True
        report['limitations'] = 'Automated checks plus screenshot review; not a human usability study or a full accessibility audit. file:// navigation is blocked by this managed browser, so the portable document was checked over HTTP without additional resources.'
        (HERE / 'browser-verification.json').write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(report, indent=2))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    verify_browser()
