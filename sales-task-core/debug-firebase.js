const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (!msg.text().includes('404') && !msg.text().includes('JSHandle')) {
            console.log('[Browser]', msg.text());
        }
    });

    console.log('Loading page...');
    await page.goto('http://localhost:8080/index-kanban.html', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for Firebase to initialize
    console.log('Waiting for Firebase...');
    await new Promise(r => setTimeout(r, 5000));

    // Check Firebase status
    const result = await page.evaluate(async () => {
        const checks = {
            hasFirebaseAuth: typeof window.FirebaseAuth !== 'undefined',
            hasSignIn: !!(window.FirebaseAuth && window.FirebaseAuth.signIn),
            hasFirebaseDB: typeof window.FirebaseDB !== 'undefined',
            firebaseAuthKeys: window.FirebaseAuth ? Object.keys(window.FirebaseAuth) : [],
            currentUser: window.getCurrentUser ? window.getCurrentUser() : null
        };

        // Try login
        if (window.FirebaseAuth && window.FirebaseAuth.signIn) {
            try {
                console.log('Attempting login...');
                const loginResult = await window.FirebaseAuth.signIn('muranaka-tenma@terracom.co.jp', 'password123');
                checks.loginResult = loginResult;
                checks.loginSuccess = loginResult.success;
            } catch (e) {
                checks.loginError = e.message;
            }
        } else {
            checks.noLoginFunction = true;
        }

        return checks;
    });

    console.log('\nFirebase Status:');
    console.log(JSON.stringify(result, null, 2));

    await browser.close();
})();
