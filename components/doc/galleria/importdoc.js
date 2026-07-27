import { DocSectionCode } from '@/components/doc/common/docsectioncode';
import { DocSectionText } from '@/components/doc/common/docsectiontext';

export function ImportDoc(props) {
    const code = {
        basic: `
import { Galleria } from '@orcado/yoyui/galleria';
        `
    };

    return (
        <>
            <DocSectionText {...props} />
            <DocSectionCode code={code} hideToggleCode import hideStackBlitz />
        </>
    );
}
