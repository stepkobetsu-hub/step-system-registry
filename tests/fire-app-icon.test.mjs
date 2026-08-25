import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const approvedSha256 = '11e72b54df1f695f9fe721008838ed6ac4b2452e713f4df2a1048cc442aa574a';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('Fire版と公開ページは承認済みPNGそのものを使う', async () => {
  const [sourceIcon, publicIcon, workflow, installer] = await Promise.all([
    readFile(new URL('fire-app/shuttaikun-icon.png', root)),
    readFile(new URL('images/shuttaikun-icon.png', root)),
    readFile(new URL('.github/workflows/build-fire-app.yml', root), 'utf8'),
    readFile(new URL('fire-install.html', root), 'utf8'),
  ]);

  assert.equal(sha256(sourceIcon), approvedSha256);
  assert.equal(sha256(publicIcon), approvedSha256);
  assert.match(workflow, /cp fire-app\/shuttaikun-icon\.png fire-app\/generated\/app\/src\/main\/res\/drawable-nodpi\/shuttaikun_icon\.png/);
  assert.doesNotMatch(workflow, /rsvg-convert/);
  assert.match(installer, /images\/shuttaikun-icon\.png/);
});
