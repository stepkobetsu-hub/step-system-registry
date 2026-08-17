# ステップ＆ゴール進捗管理 共通学年単元の復旧記録

最終確認日: 2026-08-17  
状態: Cloudflare本番復旧済み  
台帳ID: `learning-progress`

## 1. 障害内容

フォレスタステップの理科・国語・社会で、「目標範囲を選ぶ」に選択可能な単元が表示されず、目標範囲を設定できない状態になりました。英語・数学は学年別単元のため表示されていました。

生徒が以前に設定した目標件数や進捗は画面上に残っていたため、保存データ自体の消失ではなく、選択肢を作る読込条件の障害と判断しました。

## 2. 原因

理科・国語・社会のフォレスタステップ単元は、単元マスタ上で学年が `中1～中3共通` です。

Cloudflare Workerのダッシュボード読込SQLは、空欄または生徒本人の学年だけを許可し、`中1～中3共通` を許可していませんでした。

障害時の条件:

```sql
WHERE m.active=1 AND (u.grade='' OR u.grade=? OR m.grade='' OR m.grade=?)
```

そのため、D1の `student_targets` や進捗行は残ったまま、目標設定画面の `selectableUnits` から共通単元だけが除外されていました。

## 3. 修正内容

単元側と教材側の双方について、`中1～中3共通` を対象に含めました。

```sql
WHERE m.active=1 AND (
  u.grade='' OR u.grade=? OR u.grade='中1～中3共通' OR
  m.grade='' OR m.grade=? OR m.grade='中1～中3共通'
)
```

これにより、理科・国語・社会の共通学年単元が再び目標範囲の選択肢へ表示されます。既存の目標・進捗・宿題データ、D1スキーマ、マイグレーションは変更していません。

## 4. 正本とコミット

| 項目 | 値 |
|---|---|
| GitHub | https://github.com/stepkobetsu-hub/foresta-step-progress |
| 修正ブランチ | `agent/cloudflare-progress-migration` |
| Worker修正コミット | `a3b7ce268ff3ec81b5f75db4c8a2d63762894184` |
| 修正ファイル | `cloudflare/src/index.ts` |
| 回帰試験 | `cloudflare/tests/dashboard.test.mjs` |
| 本番公開ワークフロー | `.github/workflows/deploy-step-progress.yml` |
| ワークフロー整備コミット | `9333bf31c439b1465b1c2feed6fcda827986c1f7` |
| 成功したActions | https://github.com/stepkobetsu-hub/foresta-step-progress/actions/runs/32006933794 |

## 5. Cloudflare本番

| 項目 | 値 |
|---|---|
| Worker | `step-progress-api` |
| 本番URL | https://step-progress-api.stepkobetsu.workers.dev/ |
| health | https://step-progress-api.stepkobetsu.workers.dev/health |
| D1 | `step-progress-db`、binding `DB` |
| D1 database ID | `028f097c-2609-4bf7-9e9b-39b565606941` |
| 現行Version | `bbefb81b-9d7e-4b90-9480-b245a751cd6c` |
| 直前の同修正版Version | `b4eff6ac-62b8-4db7-8f74-845896a29639` |
| 最初の共通単元修正版 | `f7f7f491-5a6e-478e-b2b6-c011e58ba5ac` |

本番 `/health` は、`ok=true`、`productionWriteApproved=false`、`testWriteApproved=true`、`dualWriteEnabled=true` を返すことを確認しました。

## 6. 古い画面キャッシュへの対応

管理者の生徒別ダッシュボードと生徒本人のダッシュボードは、ブラウザーへ保存されます。Workerだけを修正しても、障害中に保存された空の選択肢が最大24時間残る端末がありました。

表示デザインや保存処理を変更せず、次のキャッシュキーだけを新版へ切り替えました。

- 管理者: `fsAdminDashboard:commonGradeFix20260817:`
- 生徒: `forestaProgress.viewCache:commonGradeFix20260817:`

これにより、新しいHTMLを読み込んだ端末は障害中の古い一覧を使用せず、Workerから最新の共通単元を取得します。

本番HTMLの確認用SHA-256:

```text
9d67371dbe8b4e155e85952cdbf626d00ba38aa2f6cc63a636ab5d6fe14a5866
```

## 7. 検証結果

- D1行から本番画面用ダッシュボードを作る試験
- `u.grade='中1～中3共通'` の回帰試験
- `m.grade='中1～中3共通'` の回帰試験
- 進捗分母・周回・5科目・英単語・LCT・宿題集計試験
- 目標0件時の互換試験
- 保存禁止対象のHTTP 403維持試験
- TypeScript型検査
- Cloudflare Assetsの本番画面同一性検査
- 本番 `/health` のHTTP 200・`ok=true`
- 古いダッシュボードキャッシュを無効化した本番HTMLのSHA-256一致

最終GitHub Actionsでは対象試験5件がすべて成功し、Worker upload、D1 binding、Static Assets、毎分Cron、本番health、本番HTML検査まで成功しました。

## 8. 今後のCloudflare公開方法

Cloudflare Dashboardの人間確認でブラウザー操作が止まる場合に備え、GitHub Actionsから公開できる経路を追加しました。

GitHubリポジトリのActions Secretには、次の名前だけを登録しています。

```text
CLOUDFLARE_API_TOKEN
```

秘密値、Cloudflareのログイン情報、APIトークン本文は、GitHubファイル、台帳、チャットへ記録しません。トークンを再発行した場合は、GitHubのRepository secretsで同名Secretの値だけを更新します。

ワークフローは、現行本番HTMLの既知ハッシュを検査してからWorker修正とキャッシュ版を適用します。想定外の画面変更がある場合は公開前に停止します。UIを今後正式変更した場合は、ワークフロー内の許可ハッシュと検証内容も意図的に更新してください。

## 9. 復旧手順

1. まず本番 `/health` を確認します。
2. GitHub Actions `Deploy step-progress common-grade hotfix` の直近実行を確認します。
3. 理科・国語・社会だけ単元がない場合は、Workerの `readDashboard` SQLに `中1～中3共通` が2か所あるか確認します。
4. Workerが正しいのに端末だけ古い場合は、本番HTMLのキャッシュキー版とSHA-256を確認します。
5. 現行Versionに問題がある場合は、同じ修正を含む直前Version `b4eff6ac-62b8-4db7-8f74-845896a29639` を復旧候補にします。
6. D1データを削除・初期化・ロールバックしないでください。今回の障害はデータ消失ではなく読込条件です。

## 10. 変更時の注意

- `中1～中3共通` を学年不一致として除外しない。
- 単元側 `u.grade` と教材側 `m.grade` の両方を確認する。
- 理科・国語・社会だけでなく、英語・数学と既存の空欄学年も回帰試験する。
- 既存の目標・進捗が見えている状態で、データ再投入や全削除を行わない。
- 国語のフォレスタステップではLCTを表示しない既存ルールを維持する。
- Cloudflare APIトークン、ログイン情報、生徒情報を公開台帳へ記録しない。
