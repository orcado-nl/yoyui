import { DocSectionCode } from '@/components/doc/common/docsectioncode';
import { DocSectionText } from '@/components/doc/common/docsectiontext';

export function ImportDoc(props) {
    const code = {
        basic: `
import { ConfirmPopup } from '@orcado/yoyui/confirmpopup'; // To use <ConfirmPopup> tag
import { confirmPopup } from '@orcado/yoyui/confirmpopup'; // To use confirmPopup method
        `
    };

    return (
        <>
            <DocSectionText {...props} />
            <DocSectionCode code={code} hideToggleCode import hideStackBlitz />
        </>
    );
}
