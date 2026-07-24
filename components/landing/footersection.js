import Link from 'next/link';

const FooterSection = () => {
    return (
        <section className="landing-footer pt-8 px-5 lg:px-8">
            <div className="landing-footer-container">
                <div className="flex flex-wrap z-1">
                    <div className="w-6 lg:w-3 flex">
                        <ul className="list-none p-0 m-0">
                            <li className="font-bold mb-5">General</li>
                            <li className="mb-4">
                                <Link href="/installation" className="text-secondary font-medium hover:text-primary transition-colors transition-duration-150">
                                    Get Started
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="w-6 lg:w-3 flex"></div>
                    <div className="w-6 lg:w-3 flex"></div>
                    <div className="w-6 lg:w-3 flex">
                        <ul className="list-none p-0 m-0">
                            <li className="font-bold mt-5 lg:mt-0 mb-5">Theming</li>
                            <li className="mb-4">
                                <Link href="/theming" className="text-secondary font-medium hover:text-primary transition-colors transition-duration-150">
                                    Styled Mode
                                </Link>
                            </li>
                            <li>
                                <Link href="/unstyled" className="text-secondary font-medium hover:text-primary transition-colors transition-duration-150">
                                    Unstyled Mode
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <hr className="section-divider mt-8" />

                <div className="flex flex-wrap justify-content-between py-6 gap-5">
                    <span>
                        <svg width="146" height="35" viewBox="0 0 146 35" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                            <g transform="scale(0.21875)">
                                <rect x="12" y="12" width="136" height="136" rx="32" fill="#F6F4FF" />
                                <path d="M48 38 C48 58 80 58 80 78" fill="none" stroke="#5B4FE0" strokeWidth="15" strokeLinecap="round" />
                                <path d="M112 38 C112 58 80 58 80 78" fill="none" stroke="#5B4FE0" strokeWidth="15" strokeLinecap="round" />
                                <path d="M48 122 C48 102 80 102 80 82" fill="none" stroke="#26C2B4" strokeWidth="15" strokeLinecap="round" />
                                <path d="M112 122 C112 102 80 102 80 82" fill="none" stroke="#26C2B4" strokeWidth="15" strokeLinecap="round" />
                                <path d="M72.5 80 A7.5 7.5 0 0 1 87.5 80 Z" fill="#26C2B4" />
                                <path d="M72.5 80 A7.5 7.5 0 0 0 87.5 80 Z" fill="#5B4FE0" />
                            </g>
                            <text x="42" y="24.5" fill="#5B4FE0" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" fontSize="22" fontWeight="700" letterSpacing="-0.7">
                                YoY
                            </text>
                            <text x="68" y="24.5" fill="#26C2B4" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" fontSize="22" fontWeight="700" letterSpacing="-0.7">
                                ui
                            </text>
                        </svg>
                    </span>
                </div>
            </div>
        </section>
    );
};

export default FooterSection;
