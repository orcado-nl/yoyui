import { DocSectionCode } from '@/components/doc/common/docsectioncode';
import { DocSectionText } from '@/components/doc/common/docsectiontext';

export function BuiltInThemesDoc(props) {
    const code = {
        basic: `
@orcado/yoyui/resources/themes/bootstrap4-light-blue/theme.css
@orcado/yoyui/resources/themes/bootstrap4-light-purple/theme.css
@orcado/yoyui/resources/themes/bootstrap4-dark-blue/theme.css
@orcado/yoyui/resources/themes/bootstrap4-dark-purple/theme.css
@orcado/yoyui/resources/themes/md-light-indigo/theme.css
@orcado/yoyui/resources/themes/md-light-deeppurple/theme.css
@orcado/yoyui/resources/themes/md-dark-indigo/theme.css
@orcado/yoyui/resources/themes/md-dark-deeppurple/theme.css
@orcado/yoyui/resources/themes/mdc-light-indigo/theme.css
@orcado/yoyui/resources/themes/mdc-light-deeppurple/theme.css
@orcado/yoyui/resources/themes/mdc-dark-indigo/theme.css
@orcado/yoyui/resources/themes/mdc-dark-deeppurple/theme.css
@orcado/yoyui/resources/themes/tailwind-light/theme.css
@orcado/yoyui/resources/themes/fluent-light/theme.css
@orcado/yoyui/resources/themes/lara-light-blue/theme.css
@orcado/yoyui/resources/themes/lara-light-indigo/theme.css
@orcado/yoyui/resources/themes/lara-light-purple/theme.css
@orcado/yoyui/resources/themes/lara-light-teal/theme.css
@orcado/yoyui/resources/themes/lara-dark-blue/theme.css
@orcado/yoyui/resources/themes/lara-dark-indigo/theme.css
@orcado/yoyui/resources/themes/lara-dark-purple/theme.css
@orcado/yoyui/resources/themes/lara-dark-teal/theme.css
@orcado/yoyui/resources/themes/soho-light/theme.css
@orcado/yoyui/resources/themes/soho-dark/theme.css
@orcado/yoyui/resources/themes/viva-light/theme.css
@orcado/yoyui/resources/themes/viva-dark/theme.css
@orcado/yoyui/resources/themes/mira/theme.css
@orcado/yoyui/resources/themes/nano/theme.css
@orcado/yoyui/resources/themes/saga-blue/theme.css
@orcado/yoyui/resources/themes/saga-green/theme.css
@orcado/yoyui/resources/themes/saga-orange/theme.css
@orcado/yoyui/resources/themes/saga-purple/theme.css
@orcado/yoyui/resources/themes/vela-blue/theme.css
@orcado/yoyui/resources/themes/vela-green/theme.css
@orcado/yoyui/resources/themes/vela-orange/theme.css
@orcado/yoyui/resources/themes/vela-purple/theme.css
@orcado/yoyui/resources/themes/arya-blue/theme.css
@orcado/yoyui/resources/themes/arya-green/theme.css
@orcado/yoyui/resources/themes/arya-orange/theme.css
@orcado/yoyui/resources/themes/arya-purple/theme.css
        `
    };

    return (
        <>
            <DocSectionText {...props}>
                <p>
                    YoYui ships with various free themes to choose from. The list below states all the available themes in the npm distribution with import paths. For a live preview, use the configurator{' '}
                    <span className="border-round inline-flex border-1 w-2rem h-2rem p-0 align-items-center justify-content-center bg-primary">
                        <span className="pi pi-palette" />
                    </span>{' '}
                    at the topbar to switch themes.
                </p>
            </DocSectionText>
            <DocSectionCode code={code} hideToggleCode import hideStackBlitz codeClassName="h-20rem overflow-auto" />
        </>
    );
}
