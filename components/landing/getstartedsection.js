/* eslint-disable @next/next/no-html-link-for-pages -- Next 12 Link requires an anchor child; the explicit href also satisfies static accessibility analysis. */
import Link from 'next/link';
import { useState } from 'react';

const GetStartedSection = () => {
    const [npmText, setNpmText] = useState('npm i primereact');
    const [downloadIcon, setDownloadIcon] = useState('pi pi-download mr-3 download-icon');

    return (
        <section className="landing-getstarted flex flex-column  align-items-center justify-content-center mt-8 z-1">
            <div className="flex flex-column md:flex-row align-items-center justify-content-center">
                <Link href="/installation" passHref>
                    <a href="/installation" className="linkbox active font-semibold py-3 px-4 fadeinleft animation-duration-2000 animation-ease-out">
                        Get Started <i className="pi pi-arrow-right ml-3" />
                    </a>
                </Link>
                <button
                    type="button"
                    className="relative cursor-pointer box download-box w-15rem font-medium p-3 px-4 mt-3 md:mt-0 md:ml-3 bg-transparent inline-flex align-items-center fadeinright animation-duration-2000 animation-ease-out border-none"
                    onClick={() => {
                        navigator.clipboard.writeText('npm i primereact');
                        setNpmText('copied!');
                        setDownloadIcon('pi pi-copy mr-3 download-icon');
                        setTimeout(() => {
                            setNpmText('npm i primereact');
                            setDownloadIcon('pi pi-download mr-3 download-icon');
                        }, 2000);
                    }}
                >
                    <i className={downloadIcon} />
                    <span className="font-bold select-all" style={{ fontFamily: 'monaco, monospace' }}>
                        {npmText}
                    </span>
                </button>
            </div>
        </section>
    );
};

export default GetStartedSection;
