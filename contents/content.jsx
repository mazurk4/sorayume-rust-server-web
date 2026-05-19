/* global React */
const { useState, useEffect, useMemo } = React;

// ─── Bilingual text helper ────────────────────────────────────────
const T = ({ jp, en, lang }) => (lang === 'en' ? en : jp);

// ─── Content (bilingual) ──────────────────────────────────────────
const CONTENT = {
  nav: {
    info:    { jp: 'サーバー情報', en: 'Server' },
    rules:   { jp: 'ルール', en: 'Rules' },
    faq:     { jp: 'FAQ', en: 'FAQ' },
    mod:     { jp: 'モデレーター募集', en: 'Recruitment' },
    stream:  { jp: '配信', en: 'Streaming' },
    news:    { jp: 'おしらせ', en: 'News' },
  },
  hero: {
    tag:     { jp: 'バニラ環境・ソロ/デュオ/トリオ', en: 'Vanilla · Solo / Duo / Trio' },
    status:  { jp: 'サーバー稼働中', en: 'Server online' },
  },
  quick: {
    connect:    { jp: '接続コマンド', en: 'Connect command' },
    nextWipe:   { jp: '次回ワイプまで', en: 'Next wipe in' },
    discord:    { jp: '公式 Discord', en: 'Join our Discord' },
    joinNow:    { jp: 'Discordに参加', en: 'Join Discord' },
    wipeNote:   { jp: '毎週水曜 12:00 JST', en: 'Every Wednesday 12:00 JST' },
    copy:       { jp: 'コピー', en: 'Copy' },
    copied:     { jp: 'コピー済', en: 'Copied' },
  },
  welcome: {
    title: { jp: 'ようこそ、SORAYU.ME へ。', en: 'Welcome to SORAYU.ME.' },
    body: {
      jp: [
        '本サーバーは、ソロ・デュオ・トリオ向け（チーム上限 3 人）の vanilla 環境サーバーです。',
        '初心者から上級者までどなたでも歓迎します。それぞれのプレイスタイルを尊重し、公平で快適な環境を目指しています。',
        'チートおよびルール違反は厳格に対応します。サポートは日本語・英語で対応可能です。',
      ],
      en: [
        'A vanilla Rust server for Solo / Duo / Trio players (team limit: 3).',
        'Players of all skill levels are welcome. We respect every play style and aim to keep the server fair and comfortable for everyone.',
        'Cheating and rule violations are handled strictly. Support is available in Japanese and English.',
      ],
    },
  },
  settings: {
    intro: {
      jp: 'サーバー設定の主な項目です。詳細は Discord でも案内しています。',
      en: 'Main server settings. More details are available on our Discord.',
    },
    items: [
      { k:{jp:'チーム上限', en:'Team limit'},        v:'3 (Solo / Duo / Trio)' },
      { k:{jp:'マップサイズ', en:'Map size'},        v:'3800' },
      { k:{jp:'マップ / BP ワイプ', en:'Map / BP wipe'}, v:{jp:'毎週水曜 12:00 JST', en:'Wed 12:00 JST'} },
      { k:{jp:'デイリーリスタート', en:'Daily restart'}, v:'05:30 JST' },
      { k:{jp:'前哨基地統合', en:'Bandit Camp'}, v:{jp:'Outpost に統合', en:'Merged into Outpost'} },
      { k:{jp:'洞窟生成', en:'Cave generation'}, v:{jp:'バンカー強度を調整', en:'Bunker spawns tuned'} },
    ],
  },
  rules: [
    {
      t: { jp:'チーム上限は 3 人', en:'Team limit is 3' },
      d: { jp:'ソロ・デュオ・トリオまで。それを超える協力プレイは禁止です。', en:'Solo, Duo, or Trio only. Playing in groups larger than three is prohibited.' },
    },
    {
      t: { jp:'チーミング（同盟）禁止', en:'No teaming or alliances' },
      d: { jp:'別チームとの協力・同盟・物資の共有は行わないでください。', en:'Cooperating, allying, or sharing supplies with players outside your team is not allowed.' },
    },
    {
      t: { jp:'グループ上限 (TC) は 3', en:'TC group limit: 3' },
      d: { jp:'TC に登録できるのは 3 人まで。4 人目以降は自動で kick されます。', en:'Only three players can authorize on a TC. A fourth or more will be auto-kicked.' },
    },
    {
      t: { jp:'チート・グリッチ禁止', en:'No cheating or glitching' },
      d: { jp:'発見次第 BAN 対応します。動画・スクリーンショットも記録対象です。', en:'Any abuse leads to a ban. Footage and screenshots may be used as evidence.' },
    },
    {
      t: { jp:'ヘイト・差別・ハラスメント禁止', en:'No hate, harassment, or discrimination' },
      d: { jp:'チャット・VOIP・建築のいずれにおいても禁止です。チャットフィルター導入済み。', en:'Prohibited in chat, voice, and in-game builds. A chat filter is enabled.' },
    },
    {
      t: { jp:'BAN リスト共有', en:'Shared ban list' },
      d: { jp:'提携コミュニティーサーバーとの BAN リスト共有を行っています。', en:'We share ban lists with several partner community servers.' },
    },
    {
      t: { jp:'ping 規制', en:'Ping limit' },
      d: { jp:'ping 値が 300 を超えるとヘルスチェックで自動 kick される場合があります。', en:'A ping above 300 may trigger an automatic kick by the server health check.' },
    },
    {
      t: { jp:'サポートはチケットで', en:'Support is ticket-based' },
      d: { jp:'Admin / Mod への DM 直接対応は行いません。Discord の #claim-ticket からどうぞ。', en:'No direct DM support. Please open a ticket from #claim-ticket on Discord.' },
    },
  ],
  faq: [
    {
      q: { jp:'サーバーへの参加は自由ですか？', en:'Is the server open to anyone?' },
      a: {
        jp:['はい、どなたでも参加可能です。','接続元の規制は行っておりません。ただし、ping 値が 300 以上の場合、サーバーのヘルスチェック機能で kick される場合があります。'],
        en:['Yes — anyone can join.','We do not block by region. However, if your ping is above 300 the server health check may kick you.'],
      },
    },
    {
      q: { jp:'Admin / Mod に DM したのに返事がありません', en:'I DM\'d an admin / mod with no reply' },
      a: {
        jp:['Admin / Moderator への DM での個別サポートは行っておりません。','サポートが必要な場合は Discord の #claim-ticket チャンネルからチケットを発行してください。チケットは他のモデレーターにも通知され、より迅速かつ確実に対応できます。'],
        en:['We do not provide DM-based support to admins or moderators.','Please open a ticket from the #claim-ticket channel on Discord. Tickets are visible to all moderators, so you\'ll get a faster and more reliable response.'],
      },
    },
    {
      q: { jp:'管理者はサーバーでプレイするの？', en:'Do admins play on the server?' },
      a: {
        jp:['管理者・モデレーターは基本サーバーでプレイしません。','プラグインや新要素の動作確認のためテストプレイを行うことがありますが、Kill やレイドは行いません。'],
        en:['Admins and moderators do not normally play on the server.','They may run test sessions to verify plugins or new in-game items — but they will never kill players or raid bases.'],
      },
    },
    {
      q: { jp:'チート / グリッチ / チーミングを見つけました', en:'I found cheating / glitching / teaming' },
      a: {
        jp:['ゲーム内 F7 から報告をお願いします。','レポートはリアルタイムでモデレーターに通知されます。スクリーンショットや動画記録がある場合は #claim-ticket からあわせて報告してください。'],
        en:['Please use the in-game F7 report.','Reports are delivered to moderators in real time. If you have screenshots or video, please also open a ticket at #claim-ticket.'],
      },
    },
    {
      q: { jp:'BAN されました。解除してほしいです', en:'I was banned. Can I appeal?' },
      a: {
        jp:['解除リクエストはサポートチケットを発行してください。','本サーバーは一部ログ精査・チャットミュート・自動 BAN 対応に試験的に AI 自動判別を導入しています。BAN に異議がある場合はチケットを開いてください。','なお、#notify チャンネルに BAN 通知があり、かつ Admin 名が記載されている場合は解除いたしません。'],
        en:['Open a ticket to appeal.','We use experimental AI-based detection for some log review, chat muting, and automatic bans. If you believe a ban was a mistake, please open a ticket.','Bans posted in the #notify channel with an admin name attached are final and will not be reversed.'],
      },
    },
    {
      q: { jp:'ログインしてないのに最初から BAN されています', en:'I\'ve never logged in, but I\'m already banned' },
      a: {
        jp:['本サーバーは複数の提携コミュニティーサーバーと BAN リストを共有しています。','提携サーバーで BAN 履歴のある方は本サーバーにもログインできません。'],
        en:['We share ban lists with several partner community servers.','If you have a ban record on a partner server, you cannot log in here either.'],
      },
    },
    {
      q: { jp:'TC を触ったら kick されました', en:'I got kicked when I touched a TC' },
      a: {
        jp:['本サーバーのグループ上限は 3 人です。','4 人目以降のユーザーが TC に登録しようとすると自動で kick されます。'],
        en:['The TC group limit on this server is 3.','A fourth or later player attempting to authorize on the TC will be auto-kicked.'],
      },
    },
  ],
  mod: {
    intro: {
      jp: 'Admin は少数かつ社会人のため、24/7 のサポートができていません。以下の募集要件に当てはまる方は Discord の #sora_lv33 まで DM をお願いいたします。',
      en: 'Our admin team is small and made up of working adults — we can\'t cover 24/7 yet. If you match any of the roles below, please DM #sora_lv33 on Discord.',
    },
    roles: [
      {
        n: '01', badge:{jp:'優先度高', en:'High priority'},
        title: { jp:'ゲーム内モデレーター', en:'In-game moderator' },
        must: { jp:['一般的な Rust の知識がある方'], en:['General Rust knowledge'] },
        want: {
          jp:['英語・中国語・韓国語等のチャット精査ができる方','ホスト型ゲームのサーバーモデレーター / 管理者経験'],
          en:['Able to review chat in English / Chinese / Korean etc.','Moderation or admin experience on a hosted game server'],
        },
        note: { jp:'モデレーターになった際は本サーバーでの通常サバイバルプレイは禁止になります。', en:'In-game moderators may not play normal survival on this server.' },
      },
      {
        n: '02', badge:null,
        title: { jp:'Discord サポートチーム', en:'Discord support team' },
        must: { jp:['Discord を利用できる方','一般的な Rust の知識がある方'], en:['Comfortable using Discord','General Rust knowledge'] },
        want: {
          jp:['モデレーターを兼務してくれる方','英語・中国語・韓国語等の応答が可能な方（翻訳利用も可）'],
          en:['Willing to also serve as moderator','Able to respond in English / Chinese / Korean (translation tools OK)'],
        },
        note: null,
      },
      {
        n: '03', badge:null,
        title: { jp:'サーバーオペレーター', en:'Server operator' },
        must: { jp:['Linux サーバーの知識'], en:['Linux server experience'] },
        want: {
          jp:['一般的な Rust の知識','自身でサーバー運用経験あり（Rust 以外も可）','監視・ログ解析の経験','LLM の利用経験','Python / C / C# / Go などのプログラミング経験'],
          en:['General Rust knowledge','Past server administration experience (any game)','Monitoring or log analysis experience','Experience using LLMs','Programming in Python / C / C# / Go etc.'],
        },
        note: { jp:'in-game のモデレーター権限が不要な場合は通常サバイバルプレイも許可しています。', en:'If you do not require in-game moderator permissions, normal survival play is allowed.' },
      },
    ],
  },
  stream: {
    title: { jp:'配信について', en:'Streaming policy' },
    body: {
      jp: [
        '本サーバーでの配信について特にルールは設けておらず、許諾等は必要ございません。',
        'facepunch 利用規約および RUST の配信ルールに則して行ってください。',
      ],
      en: [
        'There are no special rules for streaming. You do not need to ask permission to stream.',
        'Please follow the Facepunch Terms of Service and the official RUST streaming guidelines.',
      ],
    },
    notes: {
      jp: [
        '本サーバーはチャットフィルター導入済みですが、比較的規制の緩い設定です。',
        'スラング表現や、ゲーム内ペイントの映り込みにはご注意ください。',
      ],
      en: [
        'A chat filter is enabled, though tuned fairly loose.',
        'Be careful of slang appearing in chat / VOIP, or in-game paint showing on stream.',
      ],
    },
    event: {
      title: { jp:'参加型・イベント配信について', en:'Audience-participation streams & events' },
      body: {
        jp:'複数人参加型の配信は事前に Discord からチケットを発行してください。サーバースペックの調整やユーザー権限等で相談可能です。',
        en:'For audience-participation streams, please open a ticket on Discord in advance. We can adjust server resources and user permissions for events.',
      },
    },
    links: [
      { label:'Facepunch ToS', url:'https://facepunch.com/legal' },
      { label:'RUST Support', url:'https://rust.facepunch.com/support' },
    ],
  },
  news: [
    {
      id:   '2026-05-19-web-renewal',
      date: '2026-05-19',
      title: { jp:'サーバー Web ページをリニューアル', en:'Server website renewed' },
      body:  { jp:'サーバー紹介用 Web ページを全面的にリニューアルしました。', en:'The server information website has been fully renewed.' },
      content: {
        jp: [
          'サーバー紹介用の Web ページを全面的にリニューアルしました。',
          'ダーク／ライトテーマ・日英バイリンガル対応、スライド型のページ送り、次回ワイプまでのカウントダウンなどを刷新しています。',
          'お知らせは項目クリックで詳細ページが開けるようになり、長文の告知にも対応しました。',
          '不具合や見にくい点があれば Discord までご連絡ください。',
        ],
        en: [
          'The server information website has been fully renewed.',
          'Highlights: dark / light theme, JP / EN bilingual support, slide-style page navigation, next-wipe countdown.',
          'News items now open a dedicated detail page on click, so long-form announcements are supported.',
          'Please report any issues or hard-to-read spots on Discord.',
        ],
      },
    },
    {
      id:   '2026-02-16-ai-moderation',
      date: '2026-02-16',
      title: { jp:'AI によるログ精査・自動 mute/BAN を試験導入', en:'AI-based log review and auto mute/BAN (trial)' },
      body:  { jp:'チャットログ・行動ログの一次精査と、自動 mute / BAN 判定に AI を試験導入しました。', en:'Started trialing AI for first-pass log review and automatic mute / BAN decisions.' },
      content: {
        jp: [
          'チャットログおよび行動ログの一次精査に AI を試験導入しました。',
          '差別的発言・ハラスメント・あからさまなスパム等は AI 判定で自動 mute / BAN の対象になる場合があります。',
          '誤検知の可能性があるため、不当と感じた場合は Discord の #claim-ticket からチケットを発行してください。',
          '#notify チャンネルに Admin 名つきで BAN 通知がある場合は解除対象外です。',
        ],
        en: [
          'AI is being trialed for first-pass review of chat and behavior logs.',
          'Discriminatory speech, harassment, and obvious spam may now trigger automatic mute / BAN.',
          'False positives are possible — please open a ticket from #claim-ticket on Discord if you believe a decision was wrong.',
          'Bans posted in #notify with an admin name attached are not eligible for appeal.',
        ],
      },
    },
    {
      id:   '2025-12-31-support-discord',
      date: '2025-12-31',
      title: { jp:'サポート Discord を開設', en:'Support Discord opened' },
      body:  { jp:'サポート用の Discord サーバーを開設しました。', en:'A dedicated support Discord server is now open.' },
      content: {
        jp: [
          'チート報告・グリッチ報告・BAN 解除申請などを受け付けるサポート Discord を開設しました。',
          '#claim-ticket チャンネルからチケットを発行してください。',
          '今後の運営アナウンスはサポート Discord でも告知します。',
        ],
        en: [
          'We launched a dedicated support Discord for cheater / glitch reports and ban appeals.',
          'Please open a ticket from the #claim-ticket channel.',
          'Operational announcements will also be posted in the support Discord.',
        ],
      },
    },
    {
      id:   '2025-12-25-hosting-change',
      date: '2025-12-25',
      title: { jp:'ホスティング事業者を変更', en:'Hosting provider changed' },
      body:  { jp:'サーバー不安定の解消のためホスティング事業者を変更しました。12/31 まで平行運用。', en:'Switched hosting providers to address stability. Both stacks will run in parallel until Dec 31.' },
      content: {
        jp: [
          'サーバーが不安定になることが多かったため、ホスティング事業者を変更しました。',
          '2025/12/31 までは旧環境と新環境を平行運用し、順次切り替えを行います。',
          '切り替え期間中は接続先が変わる可能性がありますので、Discord のアナウンスをご確認ください。',
        ],
        en: [
          'Frequent instability led us to switch hosting providers.',
          'The old and new environments will run in parallel until Dec 31, 2025, then we will fully cut over.',
          'The connect target may change during the transition — please watch the Discord announcements.',
        ],
      },
    },
    {
      id:   '2025-12-24-map-revision',
      date: '2025-12-24',
      title: { jp:'マップ生成を見直し', en:'Map generation revised' },
      body:  { jp:'Bandit Camp と Outpost を統合し、環状道路・線路を追加。ジャイアントショベルピットは無効化。', en:'Merged Bandit Camp into Outpost; added a ring road and rail; disabled Giant Excavator Pit.' },
      content: {
        jp: [
          'マップ生成を全面的に見直しました。主な変更点は以下のとおりです。',
          '・Bandit Camp と Outpost を 1 つのモニュメントに統合しました。',
          '・MAP に環状道路と線路が生成されるようになりました。',
          '・トラベルベンダーがスポーンされるようになりました。',
          '・ジャイアントショベルピットを無効化しました。',
        ],
        en: [
          'We revised map generation. Main changes:',
          '- Bandit Camp and Outpost have been merged into a single monument.',
          '- A ring road and rail line now generate on the map.',
          '- Travel vendors now spawn.',
          '- The Giant Excavator Pit has been disabled.',
        ],
      },
    },
    {
      id:   '2025-12-03-settings-review',
      date: '2025-12-03',
      title: { jp:'サーバー設定とワイプスケジュールを見直し', en:'Server settings and wipe schedule reviewed' },
      body:  { jp:'各種サーバー設定、およびワイプスケジュールの設定を見直しました。', en:'Reviewed and adjusted various server settings and the wipe schedule.' },
      content: {
        jp: [
          'プレイヤーフィードバックを反映し、各種サーバー設定とワイプスケジュールを見直しました。',
          '詳細な設定値は サーバー情報 → 設定 を参照してください。',
        ],
        en: [
          'Based on player feedback, we reviewed various server settings and the wipe schedule.',
          'See Server info → Settings for the current values.',
        ],
      },
    },
    {
      id:   '2025-11-04-wipe-day-wed',
      date: '2025-11-04',
      title: { jp:'ワイプ曜日を水曜日に変更', en:'Wipe day moved to Wednesday' },
      body:  { jp:'ワイプ実施日を現在の水曜日に変更しました。', en:'Wipes are now performed on Wednesdays.' },
      content: {
        jp: [
          'ワイプ実施日を水曜日に変更しました。',
          '具体的な日時は サーバー情報、または トップページの「次回ワイプ」カウントダウンをご確認ください。',
        ],
        en: [
          'The wipe day has been moved to Wednesday.',
          'For the exact next time, see Server info or the "Next wipe" countdown on the top page.',
        ],
      },
    },
    {
      id:   '2025-11-02-public-launch',
      date: '2025-11-02',
      title: { jp:'プライベートサーバーを全体公開に変更', en:'Server changed from private to public' },
      body:  { jp:'これまでプライベート運用だった本サーバーを全体公開に変更しました。', en:'Previously private, the server is now open to the public.' },
      content: {
        jp: [
          'これまでプライベート運用だった本サーバーを全体公開に切り替えました。',
          '誰でも接続可能となります。チーム上限・ルール等は本サイトの ルール 欄をご確認ください。',
        ],
        en: [
          'The server has switched from private to fully public.',
          'Anyone can now connect. Please review the Rules section on this site for team caps and other policies.',
        ],
      },
    },
  ],
  terms: {
    title: { jp:'利用規約', en:'Terms of service' },
    link:  { jp:'利用規約', en:'Terms of service' },
    intro: [
      '本利用規約（以下「本規約」といいます）は、本Rustサーバー（以下「本サーバー」）の利用条件を定めるものです。本規約をお読みいただき、内容に同意いただけない場合は、Discordサーバーからの退出をお願いしております。',
      '規約に同意した方に限り、本サーバーにおけるサービス提供を受けられるものとします。',
      'また、未成年者は、法定代理人（親権者等）の同意を得た上で本サーバーをご利用ください。未成年者が本規約に同意し、利用登録を行った場合には、法定代理人の同意があったものとみなします。',
      'Rust サーバーへの接続を行った時点で、別途Rust公式が定める利用規約にも同意したものとみなします。',
    ],
    sections: [
      {
        h: '第1条（適用範囲）',
        body: [
          '本規約は、本サーバーの利用に関する一切の関係に適用されるものとします。',
          '利用者は、本サーバーを利用することで本規約に同意したものとみなされます。',
        ],
      },
      {
        h: '第2条（利用環境）',
        body: [
          '利用者は、Rust本体、Steam、ネットワーク環境等、接続に必要な設備を自己の責任で準備するものとします。',
          '利用者の環境に起因する接続不良、不具合について、運営は責任を負いません。',
        ],
      },
      {
        h: '第3条（禁止行為）',
        lead: '利用者は、本サーバーの利用にあたり、以下の行為を行ってはなりません。',
        body: [
          'チート行為、およびその疑いを招く行為（Aim/ESP、Macro、スクリプト、外部ツール、改造クライアント等）',
          'ゲーム仕様の不具合を利用するグリッチ行為',
          'サーバー設定やゲームバランスの意図的な回避・悪用',
          '他プレイヤーへの迷惑行為・嫌がらせ行為・暴言・差別的表現',
          '運営やスタッフ、他プレイヤーへの誹謗中傷・妨害',
          '不正アクセス、DoS攻撃、サーバー負荷を意図的に増大させる行為',
          '宣伝・スパム・荒らし行為',
          'その他、運営が不適切と判断する行為',
        ],
      },
      {
        h: '第4条（処分・BANについて）',
        body: [
          '利用者が本規約に違反した場合、運営は予告なく、一時的な利用停止・永久BAN・Discordからの退会等の措置を取ることがあります。',
          'BAN理由の詳細公開・説明対応は行わない場合があります。',
          'BANの解除を保証するものではありません。',
        ],
      },
      {
        h: '第5条（サーバー仕様とデータについて）',
        body: [
          '本サーバーは、定期的にワイプを行う特性があります。建築物・インベントリ・ブループリント等、サーバーデータは削除される場合があります。',
          'サーバーダウン・ロールバック・データ消失等が発生する可能性があります。運営はこれらについて一切責任を負いません。',
          'サーバー設定（マップ、プラグイン、制限事項等）は、運営の判断により予告なく変更される場合があります。',
        ],
      },
      {
        h: '第6条（運営の権限）',
        body: [
          '運営は、サーバーの停止・再起動・仕様変更、プレイヤーの行動ログの確認、必要な場合の管理措置（BAN・調整等）を自由に行う権利を有します。',
          '運営はボランティアであり、即時対応はできません。',
        ],
      },
      {
        h: '第7条（免責事項）',
        body: [
          '本サーバーの利用により発生したプレイヤー間トラブル、データ消失、ワイプの影響、ゲームクライアントやSteamの不具合、サーバー障害やネットワークトラブル、損害・損失・不利益の一切について、運営は責任を負いません。',
          'あくまで「個人が趣味として提供するサーバー」である点をご理解ください。',
        ],
      },
      {
        h: '第8条（サポートについて）',
        body: [
          '対応可能なのは原則としてチート報告・グリッチ報告のみとします。',
          '問い合わせは Discord 内のチケットシステムからのみ受け付けます。',
          '回答が遅れる場合があります。即時対応は保証できません。',
        ],
      },
      {
        h: '第9条（規約の変更）',
        body: [
          '本規約は、運営の判断により内容を変更・追記できるものとします。',
          '変更後の規約は、DiscordまたはWebで告知し、告知後に利用を継続した場合は変更に同意したものとみなします。',
        ],
      },
      {
        h: '第10条（準拠法）',
        body: [
          '本規約は、日本法に準拠し解釈されるものとします。',
        ],
      },
    ],
  },
};

window.CONTENT = CONTENT;
window.T = T;
