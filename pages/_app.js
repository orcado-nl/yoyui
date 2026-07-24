import { GTagManager } from '@/components/analytics/analytics';
import AppContentContext from '@/components/layout/appcontentcontext';
import Layout from '@/components/layout/layout';
import { PrimeReactProvider } from '@/components/lib/api/PrimeReactContext';
import { switchTheme } from '@/components/utils/utils';
import '@docsearch/css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import { useCallback, useMemo, useState } from 'react';
import '../styles/demo/demo.scss';
import '../styles/layout/layout.scss';

function AppContent({ component: Component, pageProps }) {
    if (Component.getLayout) {
        return Component.getLayout(<Component {...pageProps} />);
    }

    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
}

const primereactConfig = {
    ripple: true,
    hideOverlaysOnDocumentScrolling: false
};

export default function MyApp({ Component, pageProps }) {
    const isProduction = process.env.NODE_ENV === 'production';
    const [darkMode, setDarkMode] = useState(false);
    const [theme, setTheme] = useState('lara-light-cyan');
    const [newsActive, setNewsActive] = useState(false);
    const [announcement, setAnnouncement] = useState(null);

    const changeTheme = useCallback(
        (newTheme, dark) => {
            if (newTheme !== theme) {
                switchTheme(theme, newTheme, 'theme-link', () => {
                    setDarkMode(dark);
                    setTheme(newTheme);
                });
            }
        },
        [theme]
    );
    const showNews = useCallback((message) => {
        setNewsActive(true);
        setAnnouncement(message);
    }, []);
    const hideNews = useCallback(() => setNewsActive(false), []);
    const appState = useMemo(() => ({ darkMode, theme, newsActive, announcement, changeTheme, showNews, hideNews }), [announcement, changeTheme, darkMode, hideNews, newsActive, showNews, theme]);

    return (
        <AppContentContext.Provider value={appState}>
            <PrimeReactProvider value={primereactConfig}>
                {isProduction && <GTagManager />}
                <AppContent component={Component} pageProps={pageProps} />
            </PrimeReactProvider>
        </AppContentContext.Provider>
    );
}
