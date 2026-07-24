const TemplatesPage = () => {
    return (
        <div>
            <div className="doc-intro">
                <h1>Meet the Team</h1>
                <p>
                    <a href="https://www.orcado.nl" className="text-primary hover:underline font-medium">
                        Orcado
                    </a>{' '}
                    is a software company maintaining{' '}
                    <a href="https://yoyui.orcado.dev" className="text-primary hover:underline font-medium">
                        PrimeReact
                    </a>
                </p>
            </div>

            <div className="card p-7">
                <div className="flex flex-wrap gap-7">
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/team/cagatay.jpg" className="border-circle mb-4" alt="Cagatay Civici" />
                        <span className="mb-2 text-xl font-bold">Çağatay Çivici</span>
                        <span>Founder</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/team/mert.jpg" className="border-circle mb-4" alt="Mert Sincan" />
                        <span className="mb-2 text-xl font-bold">Mert Sincan</span>
                        <span>CTO</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/team/dilara.jpg" className="border-circle mb-4" alt="Dilara Can" />
                        <span className="mb-2 text-xl font-bold">Dilara Güngenci</span>
                        <span>Business Administration</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/team/cetin.jpg" className="border-circle mb-4" alt="Çetin Çakıroğlu" />
                        <span className="mb-2 text-xl font-bold">Çetin Çakıroğlu</span>
                        <span>Front-End Developer</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/team/tugce.jpg" className="border-circle mb-4" alt="Tuğçe Küçükoğlu" />
                        <span className="mb-2 text-xl font-bold">Tuğçe Küçükoğlu</span>
                        <span>Front-End Developer</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/team/atakan.jpg" className="border-circle mb-4" alt="Atakan Tepe" />
                        <span className="mb-2 text-xl font-bold">Atakan Tepe</span>
                        <span>Front-End Developer</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/avatar/avatar-placeholder.svg" className="border-circle mb-4" alt="Mehmet Çetin" />
                        <span className="mb-2 text-xl font-bold">Mehmet Çetin</span>
                        <span>Front-End Developer</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/avatar/avatar-placeholder.svg" className="border-circle mb-4" alt="Taner Engin" />
                        <span className="mb-2 text-xl font-bold">Taner Engin</span>
                        <span>Front-End Developer</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/avatar/avatar-placeholder.svg" className="border-circle mb-4" alt="Giray Maviş" />
                        <span className="mb-2 text-xl font-bold">Giray Maviş</span>
                        <span>Front-End Developer</span>
                    </div>
                    <div className="flex flex-column align-items-center flex-auto">
                        <img src="/images/team/kerem.jpg" className="border-circle mb-4" alt="Kerem Yıldan" />
                        <span className="mb-2 text-xl font-bold">Kerem Yıldan</span>
                        <span>Lead Designer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplatesPage;
