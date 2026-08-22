from pathlib import Path

p = Path('SYSTEM_REGISTRY.md')
s = p.read_text(encoding='utf-8')

s = s.replace('最終更新: 2026-08-20', '最終更新: 2026-08-22', 1)

lines = s.splitlines()
for i, line in enumerate(lines):
    if line.startswith('| ステップ＆ゴール進捗管理 |'):
        lines[i] = '| ステップ＆ゴール進捗管理 | **V3本番稼働中（D1直保存）** | https://step-progress-api.stepkobetsu.workers.dev/ | [foresta-step-progress](https://github.com/stepkobetsu-hub/foresta-step-progress) | `agent/step-progress-v3-implementation`（V3正本）／`main`（公開・切替ワークフロー） | `cloudflare/src/v3.ts`、`cloudflare/src/dashboard.ts`、`cloudflare/public/index.html`、`cloudflare/wrangler.v3.production.jsonc` | GitHub＋Cloudflare Worker＋D1 `step-progress-db`。通常保存・再読込はV3 D1を正本とし、Google Apps Scriptは初回認証・互換用途 | V3実装→1320で進捗・目標範囲・宿題を保存／再読込確認→最終スナップショット→同一Worker URLへ切替 | 2026-08-22 | V3 Version `9b0443f2-5ad1-4827-8743-92f3671c9294`。旧Google経由版ロールバック候補 `7b84a8f6-3b25-4052-ab32-f02d6af55a51`。詳細 `docs/learning-progress-v3-cutover-20260822.md` |'
        break
else:
    raise SystemExit('learning-progress table row not found')

s = '\n'.join(lines) + ('\n' if s.endswith('\n') else '')

heading = '## 登録詳細：ステップ＆ゴール進捗管理\n'
current = '''\n### 2026-08-22 現在状態：V3 D1直保存\n\n- **現在の正本**: Cloudflare Worker `step-progress-api` + D1 `step-progress-db` の V3 専用テーブル。通常の進捗・目標範囲・宿題の保存と再読込は D1 を正本とする。\n- **本番URL**: https://step-progress-api.stepkobetsu.workers.dev/ （URL変更なし）\n- **V3正本ブランチ**: `agent/step-progress-v3-implementation`\n- **主要ファイル**: `cloudflare/src/v3.ts`、`cloudflare/src/dashboard.ts`、`cloudflare/public/index.html`、`cloudflare/wrangler.v3.production.jsonc`。\n- **本番Version**: `9b0443f2-5ad1-4827-8743-92f3671c9294`。\n- **旧Google経由版へのロールバック候補**: `7b84a8f6-3b25-4052-ab32-f02d6af55a51`。D1全体を戻したり削除したりせず、Worker Versionを戻す。\n- **保存方式**: 入力 → Cloudflare Worker → V3 D1。通常の保存成功は Google Apps Script の応答を待たない。初回ログインは既存認証との互換性を維持し、ログイン後の通常保存では V3 D1 セッションを使用する。\n- **自動保存**: 進捗300ms、目標範囲350msのdebounce。必須の保存ボタンに依存しない。\n- **1320実測**: 進捗707ms、目標範囲889ms、宿題1,231ms（Worker内処理）。通信込みでも各2秒未満。3項目とも保存後の再読込保持を確認。\n- **最終データコピー**: 2026-08-22T04:42:35.627Z。生徒34名、進捗1,267件、目標範囲7,011件、宿題2,271件。\n- **目標範囲の同一性**: `units.unit_id` が一意のため、V3では `unit_id` を中心にON/OFFを判定し、旧教材シリーズ表記の差で再読込時に戻る問題を解消。\n- **GitHub Actions**: staging / cutover は完了後 `workflow_dispatch` の手動実行だけに戻し、失敗通知メールの連続発生を防止。\n- **詳細**: `docs/learning-progress-v3-cutover-20260822.md`。\n- **次回の障害調査**: 保存遅延・再読込戻りは、まず `/health` の `mode=d1-isolated-autosave`、V3 D1行、`getStudentDashboard` のD1読込を確認する。Google Apps Scriptの速度調査から始めない。\n\n'''
marker = '### 2026-08-22 現在状態：V3 D1直保存'
if marker not in s:
    if heading not in s:
        raise SystemExit('learning-progress detail heading not found')
    s = s.replace(heading, heading + current, 1)

p.write_text(s, encoding='utf-8')
print('Updated SYSTEM_REGISTRY.md for learning-progress V3')
