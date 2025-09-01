// Slack通知設定ファイル
// 各ユーザーのSlack Webhook URLを管理

const SLACK_CONFIG = {
    // デフォルトのWebhook URL（テスト用）
    defaultWebhook: 'https://hooks.slack.com/services/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',
    
    // ユーザーごとのWebhook設定
    userWebhooks: {
        // ユーザーID/メールアドレス: Webhook URL
        'muranaka-tenma@terracom.co.jp': 'https://hooks.slack.com/services/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',
    },
    
    // Slackユーザー名マッピング（タスク管理システムのユーザー名 → Slackユーザー名）
    userMappings: {
        '邨中天真': '@muranaka-tenma',
        '加藤純': '@kato-jun',
        '朝日圭一': '@asahi-keiichi',
        '半澤侑果': '@hanzawa-yuka',
        '田村渉': '@tamura-wataru',
        '橋本友美': '@hashimoto-yumi',
        '福島亜未': '@fukushima-ami'
    },
    
    // 通知設定
    notificationSettings: {
        // 通知タイプごとの有効/無効
        enableMentions: true,
        enableTaskAssignment: true,
        enableTaskMove: true,
        enableDeadlineAlerts: true,
        enableComments: true,
        
        // 通知フォーマット
        mentionFormat: '💬 *メンション通知*\n{author}さんがあなたをメンションしました',
        assignmentFormat: '👥 *タスク割り当て通知*\n{assigner}さんがタスクを割り当てました',
        moveFormat: '📦 *タスク移動通知*\n{mover}さんがタスクを移動しました',
        deadlineFormat: '⏰ *期限通知*\nタスクの期限が近づいています',
        commentFormat: '💭 *コメント通知*\n{author}さんがコメントを追加しました'
    }
};

// Webhook URLを取得する関数
function getWebhookUrl(userEmail) {
    return SLACK_CONFIG.userWebhooks[userEmail] || SLACK_CONFIG.defaultWebhook;
}

// Slackユーザー名を取得する関数
function getSlackUsername(userName) {
    return SLACK_CONFIG.userMappings[userName] || `@${userName.toLowerCase().replace(/\s+/g, '-')}`;
}

// エクスポート（グローバル変数として）
window.SlackConfig = {
    SLACK_CONFIG,
    getWebhookUrl,
    getSlackUsername
};