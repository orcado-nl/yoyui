import { DocSectionCode } from '@/components/doc/common/docsectioncode';
import { DocSectionText } from '@/components/doc/common/docsectiontext';

export function DownloadDoc(props) {
    const code = {
        basic: `
// with npm
npm install yoyui

// with yarn
yarn add yoyui
        `
    };

    return (
        <>
            <DocSectionText {...props}>
                <p>
                    YoYui is available for download at <a href="https://www.npmjs.com/package/@orcado/yoyui">npm</a>.
                </p>
            </DocSectionText>
            <DocSectionCode code={code} hideToggleCode import hideStackBlitz />
        </>
    );
}
