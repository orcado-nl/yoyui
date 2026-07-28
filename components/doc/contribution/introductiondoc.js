import { DocSectionText } from '@/components/doc/common/docsectiontext';
import { DocSectionCode } from '../common/docsectioncode';

export function IntroductionDoc(props) {
    const code = {
        code1: {
            basic: `
git clone https://github.com/orcado-nl/yoyui.git
`
        },
        code2: {
            basic: `
npm install
npm run dev
`
        },
        code3: {
            basic: `
- components
    - doc // Documentations
    - lib // Components
- pages // Routing Pages
- styles // Themes and Styles
- service // Demo Services

`
        }
    };

    return (
        <DocSectionText {...props}>
            <p>YoYui is a popular React library maintained by Orcado, after a licensing change from the original developers PrimeTek.</p>
            <h3>Development Setup</h3>
            <p>To begin with, clone the YoYui repository from GitHub</p>
            <DocSectionCode code={code.code1} hideToggleCode hideStackBlitz />
            <p>
                Then run the showcase in your local environment at <i>http://localhost:3000/</i>.
            </p>
            <DocSectionCode code={code.code2} hideToggleCode hideStackBlitz />
            <h3>Project Structure</h3>

            <DocSectionCode code={code.code3} hideToggleCode hideStackBlitz />
        </DocSectionText>
    );
}
