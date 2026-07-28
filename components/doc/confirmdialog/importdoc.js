import { DocSectionCode } from '@/components/doc/common/docsectioncode';
import { DocSectionText } from '@/components/doc/common/docsectiontext';

export function ImportDoc(props) {
    const code = {
        basic: `
import { ConfirmDialog } from '@orcado/yoyui/confirmdialog'; // For <ConfirmDialog /> component
import { confirmDialog } from '@orcado/yoyui/confirmdialog'; // For confirmDialog method
        `
    };

    return (
        <>
            <DocSectionText {...props} />
            <DocSectionCode code={code} hideToggleCode import hideStackBlitz />
        </>
    );
}
