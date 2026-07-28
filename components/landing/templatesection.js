import AppContentContext from '@/components/layout/appcontentcontext';
import { classNames } from '@/components/lib/utils/ClassNames';
import { useContext, useEffect, useState } from 'react';

const TemplateSection = () => {
    const [animation, setAnimation] = useState(false);
    const { darkMode } = useContext(AppContentContext);

    useEffect(() => {
        setAnimation(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const imageBg = (template) => {
        if (template === 'verona') {
            return "url('/images/templates/verona/verona-hero-dashboard1.png')";
        }

        const extension = template === 'apollo' ? 'jpg' : 'jpeg';

        return `url('/images/landing-new/templates/${template}-${darkMode ? 'dark' : 'light'}.${extension}')`;
    };

    const templateImg = () => {
        return `/images/landing-new/templates/templates-text-${darkMode ? 'dark' : 'light'}.png`;
    };

    return (
        <section className="landing-templates theme-dark py-8">
            <div className="section-header relative z-3">Templates</div>
            <p className="section-detail relative z-3">Professionally designed highly customizable application templates to get started in style.</p>
            <div className="flex justify-content-center relative mt-4 z-3">
                <a href="https://primeui.store/templates" className="font-semibold p-3 border-round flex align-items-center linkbox active">
                    <span>Explore All</span>
                    <i className="pi pi-arrow-right ml-2" />
                </a>
            </div>
            <section className={classNames('templates flex justify-content-center align-items-center flex-column mt-7', { 'templates-animation': animation })}>
                <div className="flex md:flex-row flex-column gap-4 lg:gap-0">
                    <div className="template-block block-5 mr-2 lg:mb-0 flex justify-content-center align-items-center" style={{ backgroundImage: imageBg('verona') }}>
                        <a className="templates-btn" target="_blank" href="https://yoyui.orcado.dev/templates/verona">
                            Verona Preview
                        </a>
                    </div>
                    <div className="template-block block-2 ml-2 flex justify-content-center align-items-center" style={{ backgroundImage: imageBg('freya') }}>
                        <a className="templates-btn" target="_blank" href="https://yoyui.orcado.dev/templates/freya">
                            Freya Preview
                        </a>
                    </div>
                </div>
                <div className="flex my-4 md:flex-row flex-column gap-4 lg:gap-0">
                    <div className="template-block block-3 mr-2 lg:mb-0 flex justify-content-center align-items-center" style={{ backgroundImage: imageBg('atlantis') }}>
                        <a className="templates-btn" target="_blank" href="https://yoyui.orcado.dev/templates/atlantis">
                            Atlantis Preview
                        </a>
                    </div>
                    <div className="template-block block-middle border-none box-shadow-none mr-2 hidden lg:flex justify-content-center align-items-center flex-column">
                        <img className="img-1" src={templateImg()} height="110" alt="Template" />
                    </div>
                    <div className="template-block block-4 ml-2 flex justify-content-center align-items-center" style={{ backgroundImage: imageBg('apollo') }}>
                        <a className="templates-btn" target="_blank" href="https://yoyui.orcado.dev/templates/apollo">
                            Apollo Preview
                        </a>
                    </div>
                </div>
                <div className="flex md:flex-row flex-column gap-4 lg:gap-0">
                    <div className="template-block block-1 mr-2 lg:mb-0 flex justify-content-center align-items-center" style={{ backgroundImage: imageBg('diamond') }}>
                        <a className="templates-btn" target="_blank" href="https://yoyui.orcado.dev/templates/diamond">
                            Diamond Preview
                        </a>
                    </div>
                    <div className="template-block block-6 ml-2 flex justify-content-center align-items-center" style={{ backgroundImage: imageBg('ultima') }}>
                        <a className="templates-btn" target="_blank" href="https://yoyui.orcado.dev/templates/ultima">
                            Ultima Preview
                        </a>
                    </div>
                </div>
                <div className="lines">
                    <div className="top">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                    <div className="left">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                </div>
            </section>
        </section>
    );
};

export default TemplateSection;
