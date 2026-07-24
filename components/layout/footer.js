import pkg from 'package.json';

export default function Footer() {
    const version = pkg.version;

    return (
        <div className="layout-footer">
            <div>
                <span>YoYui {version} by </span>
                <a href="https://www.orcado.nl" target="_blank" rel="noopener noreferrer">
                    Orcado
                </a>
            </div>
        </div>
    );
}
