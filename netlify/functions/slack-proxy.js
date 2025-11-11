/**
 * Netlify Function: Slack Webhook Proxy
 *
 * ブラウザのCORS制限を回避するため、サーバーサイドでSlack Webhook APIを呼び出す
 */

exports.handler = async (event, context) => {
    // CORSヘッダー設定
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Preflightリクエスト（OPTIONS）への対応
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // POSTリクエストのみ受け付ける
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // リクエストボディをパース
        const { webhookUrl, message } = JSON.parse(event.body);

        console.log('🔔 [SLACK-PROXY] リクエスト受信:', {
            webhookUrl: webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'undefined',
            messageLength: message ? message.length : 0
        });

        // バリデーション
        if (!webhookUrl || !message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    details: 'webhookUrl and message are required'
                })
            };
        }

        // Slack Webhook URLの検証
        if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid Webhook URL',
                    details: 'Webhook URL must start with https://hooks.slack.com/'
                })
            };
        }

        // Slack APIにPOSTリクエストを送信
        const slackResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });

        console.log('✅ [SLACK-PROXY] Slack API応答:', {
            status: slackResponse.status,
            statusText: slackResponse.statusText
        });

        // Slackからのレスポンスをテキストで取得
        const responseText = await slackResponse.text();

        // Slackが"ok"を返した場合は成功
        if (slackResponse.ok && responseText === 'ok') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Slack notification sent successfully'
                })
            };
        }

        // Slackがエラーを返した場合
        console.error('❌ [SLACK-PROXY] Slack API エラー:', {
            status: slackResponse.status,
            response: responseText
        });

        return {
            statusCode: slackResponse.status,
            headers,
            body: JSON.stringify({
                error: 'Slack API Error',
                details: responseText,
                status: slackResponse.status
            })
        };

    } catch (error) {
        console.error('❌ [SLACK-PROXY] 予期しないエラー:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal Server Error',
                details: error.message
            })
        };
    }
};
