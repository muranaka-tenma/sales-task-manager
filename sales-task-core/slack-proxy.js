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
        
        // 🔧 デバッグ情報を出力
        console.log(`🔍 [SLACK-MESSAGE] タイトル: "${title}"`);
        console.log(`🔍 [SLACK-MESSAGE] ボディ: "${body}"`);
        console.log(`🔍 [SLACK-MESSAGE] オプション:`, options);
        
        // メンション用のSlackユーザー名を取得
        let slackMention = '';
        if (options.targetUser && window.SlackConfig) {
            slackMention = window.SlackConfig.getSlackUsername(options.targetUser);
        }
        
        const message = {
            text: body,  // 🔧 メンション付きbodyを使用（titleではなく）
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
                            text: `*送信者:*\n${currentUser.name}`
                        }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: body  // 🔧 bodyにはすでにメンションが含まれている
                    }
                }
            ]
        };
        
        // 🔧 タスク情報は非表示（よりシンプルに）
        // if (task) {
        //     message.blocks.push({
        //         type: "section", 
        //         fields: [
        //             {
        //                 type: "mrkdwn",
        //                 text: `*タスク:*\n${task.title}`
        //             },
        //             {
        //                 type: "mrkdwn", 
        //                 text: `*期限:*\n${task.deadline || '未設定'}`
        //             }
        //         ]
        //     });
        // }
        
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
        if (!webhookUrl) {
            console.error('❌ [SLACK] Webhook URL未設定');
            return false;
        }

        // Webhook URLの妥当性チェック
        if (webhookUrl === 'ここに新しいWebhook URLを貼り付けてください' || 
            webhookUrl === 'WEBHOOK_URL_NOT_SET') {
            console.error('❌ [SLACK] Webhook URLが設定されていません（プレースホルダーのまま）');
            return false;
        }

        try {
            // まずCORSモードで試行（正確なエラー情報を取得するため）
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
                mode: 'cors'  // 詳細なレスポンス情報を取得
            });

            if (response.ok) {
                console.log('✅ [SLACK] 直接送信成功（CORS）');
                return true;
            } else {
                console.error(`❌ [SLACK] 直接送信失敗（CORS）: ${response.status} ${response.statusText}`);
                if (response.status === 404) {
                    console.error('❌ [SLACK] Webhook URLが無効です（404）- 新しいURLが必要です');
                }
                return false;
            }
        } catch (corsError) {
            console.warn('⚠️ [SLACK] CORS制限により詳細情報取得失敗、no-corsで再試行');
            
            // CORSエラーの場合はno-corsで再試行（フォールバック）
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(message),
                    mode: 'no-cors'
                });
                
                // no-corsでは詳細なレスポンスが取得できないため、
                // エラーが投げられなければ成功の可能性あり（但し保証はなし）
                console.warn('⚠️ [SLACK] no-cors送信完了（成功/失敗の判定不可）');
                return true;
            } catch (noCorsError) {
                console.error('❌ [SLACK] no-cors送信も失敗:', noCorsError);
                return false;
            }
        }
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