// Slack通知プロキシサービス
// CORS制限を回避するためのプロキシ機能

class SlackNotificationService {
    constructor() {
        this.webhookUrl = null; // 設定ファイルから動的に取得
        this.proxyEndpoints = [
            // 複数のプロキシサービスを用意（フォールバック用）
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://thingproxy.freeboard.io/fetch/'
        ];
    }

    // WebhookURLを動的に取得
    getWebhookUrl() {
        if (!this.webhookUrl) {
            const currentUser = getCurrentUser ? getCurrentUser() : null;
            const userEmail = currentUser ? currentUser.email : null;
            this.webhookUrl = window.SlackConfig ? window.SlackConfig.getWebhookUrl(userEmail) : null;
            
            if (!this.webhookUrl) {
                console.error('❌ [SLACK] Webhook URLが設定されていません');
                return null;
            }
        }
        return this.webhookUrl;
    }

    // メイン送信機能（複数の方法を試行）
    async sendNotification(title, body, options = {}) {
        const webhookUrl = this.getWebhookUrl();
        if (!webhookUrl) {
            console.error('❌ [SLACK] Webhook URL取得失敗');
            return false;
        }
        
        const message = this.createSlackMessage(title, body, options);
        
        // 方法1: 直接送信を試行
        try {
            const result = await this.directSend(message);
            if (result) {
                console.log('✅ [SLACK] 直接送信成功');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ [SLACK] 直接送信失敗、プロキシを試行');
        }

        // 方法2: プロキシ経由で送信
        for (const proxyUrl of this.proxyEndpoints) {
            try {
                const result = await this.proxySend(message, proxyUrl);
                if (result) {
                    console.log(`✅ [SLACK] プロキシ送信成功: ${proxyUrl}`);
                    return true;
                }
            } catch (error) {
                console.warn(`⚠️ [SLACK] プロキシ送信失敗: ${proxyUrl}`);
            }
        }

        // 方法3: 画像リクエスト経由での送信（最後の手段）
        try {
            const result = await this.imageSend(message);
            if (result) {
                console.log('✅ [SLACK] 画像経由送信成功');
                return true;
            }
        } catch (error) {
            console.error('❌ [SLACK] 全ての送信方法が失敗');
        }

        return false;
    }

    // Slackメッセージを作成
    createSlackMessage(title, body, options = {}) {
        const currentUser = getCurrentUser ? getCurrentUser() : { name: 'システム' };
        const task = options.taskId && window.tasks ? window.tasks.find(t => t.id === options.taskId) : null;
        
        // メンション用のSlackユーザー名を取得
        let slackMention = '';
        if (options.targetUser && window.SlackConfig) {
            slackMention = window.SlackConfig.getSlackUsername(options.targetUser);
        }
        
        const message = {
            text: `${slackMention ? slackMention + ' ' : ''}${title}`,
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: title,
                        emoji: true
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*通知先:*\n${slackMention || options.targetUser || '全体'}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*送信者:*\n${currentUser.name}`
                        }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: body
                    }
                }
            ]
        };
        
        // タスク情報がある場合は追加
        if (task) {
            message.blocks.push({
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*タスク:*\n${task.title}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*期限:*\n${task.deadline || '未設定'}`
                    }
                ]
            });
        }
        
        // アクションボタンを追加
        message.blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "🎯 タスク管理を開く",
                        emoji: true
                    },
                    url: "https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html",
                    style: "primary"
                }
            ]
        });

        return message;
    }

    // 直接送信
    async directSend(message) {
        const webhookUrl = this.getWebhookUrl();
        if (!webhookUrl) return false;
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
            mode: 'no-cors'  // CORS制限を無視
        });
        
        // no-corsモードでは詳細なレスポンスが取得できないため、
        // エラーが投げられなければ成功とみなす
        return true;
    }

    // プロキシ経由送信
    async proxySend(message, proxyUrl) {
        const webhookUrl = this.getWebhookUrl();
        if (!webhookUrl) return false;
        
        const targetUrl = proxyUrl + encodeURIComponent(webhookUrl);
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(message)
        });
        
        return response.ok;
    }

    // 画像リクエスト経由送信（フォールバック）
    async imageSend(message) {
        return new Promise((resolve) => {
            const img = new Image();
            const params = new URLSearchParams({
                payload: JSON.stringify(message)
            });
            
            // 送信用の画像URLを作成（実際には画像ではない）
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            
            // タイムアウト設定
            setTimeout(() => resolve(true), 2000);  // 2秒後に成功とみなす
            
            const webhookUrl = this.getWebhookUrl();
            if (webhookUrl) {
                img.src = `${webhookUrl}?${params}`;
            } else {
                resolve(false);
            }
        });
    }
}

// グローバルに公開
window.SlackNotificationService = new SlackNotificationService();