import { ComponentBase } from '../componentbase/ComponentBase';

export const DeferredContentBase = ComponentBase.extend({
    defaultProps: {
        __TYPE: 'DeferredContent',
        onLoad: null,
        children: undefined
    }
});
