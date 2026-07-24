import { DocSectionCode } from '@/components/doc/common/docsectioncode';
import { DocSectionText } from '@/components/doc/common/docsectiontext';
import { InputOtp } from '@/components/lib/inputotp/InputOtp';
import { useState } from 'react';

export function IntegerOnlyDoc(props) {
    const [token, setToken] = useState();

    const code = {
        basic: `
<InputOtp value={token} onChange={(e) => setToken(e.value)} integerOnly/>
        `,
        javascript: `
import React, { useState } from 'react';
import { InputOtp } from 'primereact/inputotp';

export default function IntegerOnlyDemo() {
    const [token, setToken] = useState();

    return (
        <div className="card flex justify-content-center">
            <InputOtp value={token} onChange={(e) => setToken(e.value)} integerOnly/>
        </div>
    );
}
        `,
        typescript: `
import React, { useState } from 'react';
import { InputOtp } from 'primereact/inputotp';

export default function IntegerOnlyDemo() {
    const [token, setToken] = useState<string | number | undefined>();

    return (
        <div className="card flex justify-content-center">
            <InputOtp value={token} onChange={(e) => setToken(e.value)} integerOnly/>
        </div>
    );
}
        `
    };

    return (
        <>
            <DocSectionText {...props}>
                <p>
                    When <i>integerOnly</i> is present, only integers can be accepted as input.
                </p>
            </DocSectionText>
            <div className="card flex justify-content-center">
                <InputOtp value={token} onChange={(e) => setToken(e.value)} integerOnly />
            </div>
            <DocSectionCode code={code} />
        </>
    );
}
