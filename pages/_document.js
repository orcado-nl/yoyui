import { Head, Html, Main, NextScript } from 'next/document';

/* eslint-disable @next/next/no-css-tags */

export default function Document() {
    return (
        <Html>
            <Head>
                <link href="/yoyui-icon.svg" rel="icon" type="image/svg+xml"></link>
                <link id="theme-link" href="/themes/lara-light-cyan/theme.css" rel="stylesheet"></link>
                <link id="home-table-link" href="/styles/landing/themes/lara-light-cyan/theme.css" rel="stylesheet"></link>
                <link rel="stylesheet" href="/styles/flags.css"></link>
                <script src="/scripts/prism/prism.js" data-manual defer></script>
                {/* eslint-enable */}
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
