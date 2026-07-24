import { resolveConditional } from './ConditionalUtils';

function handleSonarNested1(_k, _v) {
    return `${_k.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}:${_v}`;
}

function handleSonarNested2(_v, _k) {
    return resolveConditional(
        _v,
        () => _k,
        () => undefined
    );
}

export default class DomHandler {
    /**
     * All data- properties like data-test-id
     */
    static DATA_PROPS = ['data-'];
    /**
     * All ARIA properties like aria-label and focus-target for https://www.npmjs.com/package/@q42/floating-focus-a11y
     */
    static ARIA_PROPS = ['aria', 'focus-target'];
    static innerWidth(el) {
        if (el) {
            let width = el.offsetWidth;
            let style = getComputedStyle(el);

            width = width + (Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight));

            return width;
        }

        return 0;
    }
    static width(el) {
        if (el) {
            let width = el.offsetWidth;
            let style = getComputedStyle(el);

            width = width - (Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight));

            return width;
        }

        return 0;
    }
    static getBrowserLanguage() {
        return navigator.userLanguage || (navigator.languages?.length && navigator.languages[0]) || navigator.language || navigator.browserLanguage || navigator.systemLanguage || 'en';
    }
    static getWindowScrollTop() {
        let doc = document.documentElement;

        return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    }
    static getWindowScrollLeft() {
        let doc = document.documentElement;

        return (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    }
    static getOuterWidth(el, margin) {
        if (el) {
            let width = el.getBoundingClientRect().width || el.offsetWidth;

            if (margin) {
                let style = getComputedStyle(el);

                width = width + (Number.parseFloat(style.marginLeft) + Number.parseFloat(style.marginRight));
            }

            return width;
        }

        return 0;
    }
    static getOuterHeight(el, margin) {
        if (el) {
            let height = el.getBoundingClientRect().height || el.offsetHeight;

            if (margin) {
                let style = getComputedStyle(el);

                height = height + (Number.parseFloat(style.marginTop) + Number.parseFloat(style.marginBottom));
            }

            return height;
        }

        return 0;
    }
    static getClientHeight(el, margin) {
        if (el) {
            let height = el.clientHeight;

            if (margin) {
                let style = getComputedStyle(el);

                height = height + (Number.parseFloat(style.marginTop) + Number.parseFloat(style.marginBottom));
            }

            return height;
        }

        return 0;
    }
    static getClientWidth(el, margin) {
        if (el) {
            let width = el.clientWidth;

            if (margin) {
                let style = getComputedStyle(el);

                width = width + (Number.parseFloat(style.marginLeft) + Number.parseFloat(style.marginRight));
            }

            return width;
        }

        return 0;
    }
    static getViewport() {
        let win = window;
        let d = document;
        let e = d.documentElement;
        let g = d.getElementsByTagName('body')[0];
        let w = win.innerWidth || e.clientWidth || g.clientWidth;
        let h = win.innerHeight || e.clientHeight || g.clientHeight;

        return {
            width: w,
            height: h
        };
    }
    static getOffset(el) {
        if (el) {
            let rect = el.getBoundingClientRect();

            return {
                top: rect.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
                left: rect.left + (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0)
            };
        }

        return {
            top: 'auto',
            left: 'auto'
        };
    }
    static index(element) {
        if (element) {
            let children = element.parentNode.childNodes;
            let num = 0;

            for (const _item of children) {
                if (_item === element) {
                    return num;
                }

                if (_item.nodeType === 1) {
                    num++;
                }
            }
        }

        return -1;
    }
    static addMultipleClasses(element, className) {
        if (element && className) {
            if (element.classList) {
                let styles = className.split(' ');

                for (const _item2 of styles) {
                    element.classList.add(_item2);
                }
            } else {
                let styles = className.split(' ');

                for (const _item3 of styles) {
                    element.className = element.className + (' ' + _item3);
                }
            }
        }
    }
    static removeMultipleClasses(element, className) {
        if (element && className) {
            if (element.classList) {
                let styles = className.split(' ');

                for (const _item4 of styles) {
                    element.classList.remove(_item4);
                }
            } else {
                let styles = className.split(' ');

                for (const _item5 of styles) {
                    element.className = element.className.replace(new RegExp(String.raw`(^|\b)${_item5.replaceAll(' ', '|')}(\b|$)`, 'gi'), ' ');
                }
            }
        }
    }
    static addClass(element, className) {
        if (element && className) {
            if (element.classList) {
                element.classList.add(className);
            } else {
                element.className = element.className + (' ' + className);
            }
        }
    }
    static removeClass(element, className) {
        if (element && className) {
            if (element.classList) {
                element.classList.remove(className);
            } else {
                element.className = element.className.replace(new RegExp(String.raw`(^|\b)${className.replaceAll(' ', '|')}(\b|$)`, 'gi'), ' ');
            }
        }
    }
    static hasClass(element, className) {
        if (element) {
            if (element.classList) {
                return element.classList.contains(className);
            }

            return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
        }

        return false;
    }
    static addStyles(element, styles = {}) {
        if (element) {
            Object.entries(styles).forEach(([key, value]) => (element.style[key] = value));
        }
    }
    static find(element, selector) {
        return element ? Array.from(element.querySelectorAll(selector)) : [];
    }
    static findSingle(element, selector) {
        if (element) {
            return element.querySelector(selector);
        }

        return null;
    }
    static setAttributes(element, attributes = {}) {
        if (element) {
            const computedStyles = (rule, value) => {
                const styles = element?.$attrs?.[rule] ? [element?.$attrs?.[rule]] : [];

                return [value].flat().reduce((cv, v) => {
                    if (v !== null && v !== undefined) {
                        const type = typeof v;

                        if (type === 'string' || type === 'number') {
                            cv.push(v);
                        } else if (type === 'object') {
                            const _cv = Array.isArray(v)
                                ? computedStyles(rule, v)
                                : Object.entries(v).map(([_k, _v]) => resolveConditional(rule === 'style' && (!!_v || _v === 0), handleSonarNested1.bind(null, _k, _v), handleSonarNested2.bind(null, _v, _k)));

                            cv = _cv.length ? cv.concat(_cv.filter((c) => !!c)) : cv;
                        }
                    }

                    return cv;
                }, styles);
            };

            Object.entries(attributes).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    const matchedEvent = /^on(.+)/.exec(key);

                    if (matchedEvent) {
                        element.addEventListener(matchedEvent[1].toLowerCase(), value);
                    } else if (key === 'p-bind') {
                        this.setAttributes(element, value);
                    } else {
                        if (key === 'class') value = [...new Set(computedStyles('class', value))].join(' ').trim();
                        else if (key === 'style') value = computedStyles('style', value).join(';').trim();
                        element.$attrs ||= {};
                        element.$attrs[key] = value;
                        element.setAttribute(key, value);
                    }
                }
            });
        }
    }
    static getAttribute(element, name) {
        if (element) {
            const value = element.getAttribute(name);
            const numericValue = Number(value);

            if (!Number.isNaN(numericValue)) {
                return numericValue;
            }

            if (value === 'true' || value === 'false') {
                return value === 'true';
            }

            return value;
        }

        return undefined;
    }
    static isAttributeEquals(element, name, value) {
        return element ? this.getAttribute(element, name) === value : false;
    }
    static isAttributeNotEquals(element, name, value) {
        return !this.isAttributeEquals(element, name, value);
    }
    static getHeight(el) {
        if (el) {
            let height = el.offsetHeight;
            let style = getComputedStyle(el);

            height = height - (Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) + Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth));

            return height;
        }

        return 0;
    }
    static getWidth(el) {
        if (el) {
            let width = el.offsetWidth;
            let style = getComputedStyle(el);

            width = width - (Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight) + Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth));

            return width;
        }

        return 0;
    }
    static alignOverlay(overlay, target, appendTo, calculateMinWidth = true) {
        if (overlay && target) {
            if (appendTo === 'self') {
                this.relativePosition(overlay, target);
            } else {
                calculateMinWidth && (overlay.style.minWidth = DomHandler.getOuterWidth(target) + 'px');
                this.absolutePosition(overlay, target);
            }
        }
    }
    static absolutePosition(element, target, align = 'left') {
        const runComplexBranch1 = () => {
            let elementDimensions = element.offsetParent
                ? {
                      width: element.offsetWidth,
                      height: element.offsetHeight
                  }
                : this.getHiddenElementDimensions(element);
            let elementOuterHeight = elementDimensions.height;
            let elementOuterWidth = elementDimensions.width;
            let targetOuterHeight = target.offsetHeight;
            let targetOuterWidth = target.offsetWidth;
            let targetOffset = target.getBoundingClientRect();
            let windowScrollTop = this.getWindowScrollTop();
            let windowScrollLeft = this.getWindowScrollLeft();
            let viewport = this.getViewport();
            let top;
            let left;

            if (targetOffset.top + targetOuterHeight + elementOuterHeight > viewport.height) {
                top = targetOffset.top + windowScrollTop - elementOuterHeight;

                if (top < 0) {
                    top = windowScrollTop;
                }

                element.style.transformOrigin = 'bottom';
            } else {
                top = targetOuterHeight + targetOffset.top + windowScrollTop;
                element.style.transformOrigin = 'top';
            }

            const targetOffsetPx = targetOffset.left;

            if (align === 'left') {
                if (targetOffsetPx + elementOuterWidth > viewport.width) {
                    left = Math.max(0, targetOffsetPx + windowScrollLeft + targetOuterWidth - elementOuterWidth);
                } else {
                    left = targetOffsetPx + windowScrollLeft;
                }
            } else if (targetOffsetPx + targetOuterWidth - elementOuterWidth < 0) {
                left = windowScrollLeft;
            } else {
                left = targetOffsetPx + targetOuterWidth - elementOuterWidth + windowScrollLeft;
            }

            element.style.top = top + 'px';
            element.style.left = left + 'px';
        };

        if (element && target) {
            runComplexBranch1();
        }
    }
    static relativePosition(element, target) {
        if (element && target) {
            let elementDimensions = element.offsetParent
                ? {
                      width: element.offsetWidth,
                      height: element.offsetHeight
                  }
                : this.getHiddenElementDimensions(element);
            const targetHeight = target.offsetHeight;
            const targetOffset = target.getBoundingClientRect();
            const viewport = this.getViewport();
            let top;
            let left;

            if (targetOffset.top + targetHeight + elementDimensions.height > viewport.height) {
                top = -1 * elementDimensions.height;

                if (targetOffset.top + top < 0) {
                    top = -1 * targetOffset.top;
                }

                element.style.transformOrigin = 'bottom';
            } else {
                top = targetHeight;
                element.style.transformOrigin = 'top';
            }

            if (elementDimensions.width > viewport.width) {
                // element wider then viewport and cannot fit on screen (align at left side of viewport)
                left = targetOffset.left * -1;
            } else if (targetOffset.left + elementDimensions.width > viewport.width) {
                // element wider then viewport but can be fit on screen (align at right side of viewport)
                left = (targetOffset.left + elementDimensions.width - viewport.width) * -1;
            } else {
                // element fits on screen (align with target)
                left = 0;
            }

            element.style.top = top + 'px';
            element.style.left = left + 'px';
        }
    }
    static flipfitCollision(element, target, my = 'left top', at = 'left bottom', callback = undefined) {
        if (element && target) {
            const targetOffset = target.getBoundingClientRect();
            const viewport = this.getViewport();
            const myArr = my.split(' ');
            const atArr = at.split(' ');
            const getPositionValue = (arr, isOffset) => (isOffset ? +arr.substring(arr.search(/[+-]/g)) || 0 : arr.substring(0, arr.search(/[+-]/g)) || arr);
            const position = {
                my: {
                    x: getPositionValue(myArr[0]),
                    y: getPositionValue(myArr[1] || myArr[0]),
                    offsetX: getPositionValue(myArr[0], true),
                    offsetY: getPositionValue(myArr[1] || myArr[0], true)
                },
                at: {
                    x: getPositionValue(atArr[0]),
                    y: getPositionValue(atArr[1] || atArr[0]),
                    offsetX: getPositionValue(atArr[0], true),
                    offsetY: getPositionValue(atArr[1] || atArr[0], true)
                }
            };
            const myOffset = {
                left: () => {
                    const totalOffset = position.my.offsetX + position.at.offsetX;

                    return (
                        totalOffset +
                        targetOffset.left +
                        (position.my.x === 'left'
                            ? 0
                            : -1 *
                              resolveConditional(
                                  position.my.x === 'center',
                                  () => this.getOuterWidth(element) / 2,
                                  () => this.getOuterWidth(element)
                              ))
                    );
                },
                top: () => {
                    const totalOffset = position.my.offsetY + position.at.offsetY;

                    return (
                        totalOffset +
                        targetOffset.top +
                        (position.my.y === 'top'
                            ? 0
                            : -1 *
                              resolveConditional(
                                  position.my.y === 'center',
                                  () => this.getOuterHeight(element) / 2,
                                  () => this.getOuterHeight(element)
                              ))
                    );
                }
            };
            const alignWithAt = {
                count: {
                    x: 0,
                    y: 0
                },
                left: function () {
                    const left = myOffset.left();
                    const scrollLeft = DomHandler.getWindowScrollLeft();

                    element.style.left = left + scrollLeft + 'px';

                    if (this.count.x === 2) {
                        element.style.left = scrollLeft + 'px';
                        this.count.x = 0;
                    } else if (left < 0) {
                        this.count.x++;
                        position.my.x = 'left';
                        position.at.x = 'right';
                        position.my.offsetX *= -1;
                        position.at.offsetX *= -1;
                        this.right();
                    }
                },
                right: function () {
                    const left = myOffset.left() + DomHandler.getOuterWidth(target);
                    const scrollLeft = DomHandler.getWindowScrollLeft();

                    element.style.left = left + scrollLeft + 'px';

                    if (this.count.x === 2) {
                        element.style.left = viewport.width - DomHandler.getOuterWidth(element) + scrollLeft + 'px';
                        this.count.x = 0;
                    } else if (left + DomHandler.getOuterWidth(element) > viewport.width) {
                        this.count.x++;
                        position.my.x = 'right';
                        position.at.x = 'left';
                        position.my.offsetX *= -1;
                        position.at.offsetX *= -1;
                        this.left();
                    }
                },
                top: function () {
                    const top = myOffset.top();
                    const scrollTop = DomHandler.getWindowScrollTop();

                    element.style.top = top + scrollTop + 'px';

                    if (this.count.y === 2) {
                        element.style.left = scrollTop + 'px';
                        this.count.y = 0;
                    } else if (top < 0) {
                        this.count.y++;
                        position.my.y = 'top';
                        position.at.y = 'bottom';
                        position.my.offsetY *= -1;
                        position.at.offsetY *= -1;
                        this.bottom();
                    }
                },
                bottom: function () {
                    const top = myOffset.top() + DomHandler.getOuterHeight(target);
                    const scrollTop = DomHandler.getWindowScrollTop();

                    element.style.top = top + scrollTop + 'px';

                    if (this.count.y === 2) {
                        element.style.left = viewport.height - DomHandler.getOuterHeight(element) + scrollTop + 'px';
                        this.count.y = 0;
                    } else if (top + DomHandler.getOuterHeight(target) > viewport.height) {
                        this.count.y++;
                        position.my.y = 'bottom';
                        position.at.y = 'top';
                        position.my.offsetY *= -1;
                        position.at.offsetY *= -1;
                        this.top();
                    }
                },
                center: function (axis) {
                    if (axis === 'y') {
                        const top = myOffset.top() + DomHandler.getOuterHeight(target) / 2;

                        element.style.top = top + DomHandler.getWindowScrollTop() + 'px';

                        if (top < 0) {
                            this.bottom();
                        } else if (top + DomHandler.getOuterHeight(target) > viewport.height) {
                            this.top();
                        }
                    } else {
                        const left = myOffset.left() + DomHandler.getOuterWidth(target) / 2;

                        element.style.left = left + DomHandler.getWindowScrollLeft() + 'px';

                        if (left < 0) {
                            this.left();
                        } else if (left + DomHandler.getOuterWidth(element) > viewport.width) {
                            this.right();
                        }
                    }
                }
            };

            alignWithAt[position.at.x]('x');
            alignWithAt[position.at.y]('y');

            if (this.isFunction(callback)) {
                callback(position);
            }
        }
    }
    static findCollisionPosition(position) {
        if (position) {
            const isAxisY = position === 'top' || position === 'bottom';
            const myXPosition = position === 'left' ? 'right' : 'left';
            const myYPosition = position === 'top' ? 'bottom' : 'top';

            if (isAxisY) {
                return {
                    axis: 'y',
                    my: `center ${myYPosition}`,
                    at: `center ${position}`
                };
            }

            return {
                axis: 'x',
                my: `${myXPosition} center`,
                at: `${position} center`
            };
        }
    }
    static getParents(element, parents = []) {
        return element.parentNode === null ? parents : this.getParents(element.parentNode, parents.concat([element.parentNode]));
    }

    /**
     * Gets all scrollable parent elements of a given element
     * @param {HTMLElement} element - The element to find scrollable parents for
     * @returns {Array} Array of scrollable parent elements
     */
    static getScrollableParents(element) {
        let scrollableParents = [];

        const runComplexBranch4 = () => {
            // Get all parent elements
            let parents = this.getParents(element);
            // Regex to match auto or scroll overflow values
            // Regex to match auto or scroll overflow values
            const overflowRegex = /(auto|scroll)/;

            /**
             * Checks if an element has overflow scroll/auto in any direction
             * @param {HTMLElement} node - Element to check
             * @returns {boolean} True if element has overflow scroll/auto
             */
            /**
             * Checks if an element has overflow scroll/auto in any direction
             * @param {HTMLElement} node - Element to check
             * @returns {boolean} True if element has overflow scroll/auto
             */
            const overflowCheck = (node) => {
                let styleDeclaration = node ? getComputedStyle(node) : null;

                return (
                    styleDeclaration && (overflowRegex.test(styleDeclaration.getPropertyValue('overflow')) || overflowRegex.test(styleDeclaration.getPropertyValue('overflow-x')) || overflowRegex.test(styleDeclaration.getPropertyValue('overflow-y')))
                );
            };

            /**
             * Adds a scrollable parent element to the collection
             * @param {HTMLElement} node - Element to add
             */
            /**
             * Adds a scrollable parent element to the collection
             * @param {HTMLElement} node - Element to add
             */
            const addScrollableParent = (node) => {
                // For document/body/html elements, add window instead
                scrollableParents.push(node.nodeName === 'BODY' || node.nodeName === 'HTML' || this.isDocument(node) ? window : node);
            };

            // Iterate through all parent elements
            // Iterate through all parent elements
            for (let parent of parents) {
                // Check for custom scroll selectors in data attribute
                let scrollSelectors = parent.nodeType === 1 && parent.dataset?.scrollselectors;

                if (scrollSelectors) {
                    let selectors = scrollSelectors.split(',');

                    // Check each selector
                    for (let selector of selectors) {
                        let el = this.findSingle(parent, selector);

                        if (el && overflowCheck(el)) {
                            addScrollableParent(el);
                        }
                    }
                }

                // Check if the parent itself is scrollable
                if (parent.nodeType === 1 && overflowCheck(parent)) {
                    addScrollableParent(parent);
                }
            }
        };

        if (element) {
            runComplexBranch4();
        }

        return scrollableParents;
    }
    static getHiddenElementOuterHeight(element) {
        if (element) {
            element.style.visibility = 'hidden';
            element.style.display = 'block';
            let elementHeight = element.offsetHeight;

            element.style.display = 'none';
            element.style.visibility = 'visible';

            return elementHeight;
        }

        return 0;
    }
    static getHiddenElementOuterWidth(element) {
        if (element) {
            element.style.visibility = 'hidden';
            element.style.display = 'block';
            let elementWidth = element.offsetWidth;

            element.style.display = 'none';
            element.style.visibility = 'visible';

            return elementWidth;
        }

        return 0;
    }
    static getHiddenElementDimensions(element) {
        let dimensions = {};

        if (element) {
            element.style.visibility = 'hidden';
            element.style.display = 'block';
            dimensions.width = element.offsetWidth;
            dimensions.height = element.offsetHeight;
            element.style.display = 'none';
            element.style.visibility = 'visible';
        }

        return dimensions;
    }
    static fadeIn(element, duration) {
        if (element) {
            element.style.opacity = 0;
            let last = Date.now();
            let opacity = 0;

            let tick = function () {
                opacity = +element.style.opacity + (Date.now() - last) / duration;
                element.style.opacity = opacity;
                last = Date.now();

                if (+opacity < 1) {
                    (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
                }
            };

            tick();
        }
    }
    static fadeOut(element, duration) {
        if (element) {
            let opacity = 1;
            let interval = 50;
            let gap = interval / duration;
            let fading = setInterval(() => {
                opacity = opacity - gap;

                if (opacity <= 0) {
                    opacity = 0;
                    clearInterval(fading);
                }

                element.style.opacity = opacity;
            }, interval);
        }
    }
    static getUserAgent() {
        return navigator.userAgent;
    }
    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    static isAndroid() {
        return /(android)/i.test(navigator.userAgent);
    }
    static isChrome() {
        return /(chrome)/i.test(navigator.userAgent);
    }
    static isClient() {
        return !!(typeof window !== 'undefined' && window.document?.createElement);
    }
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }
    static isFunction(obj) {
        return !!(obj?.constructor && obj.call && obj.apply);
    }
    static appendChild(element, target) {
        if (this.isElement(target)) {
            target.appendChild(element);
        } else if (target.el?.nativeElement) {
            target.el.nativeElement.appendChild(element);
        } else {
            throw new Error('Cannot append ' + target + ' to ' + element);
        }
    }
    static removeChild(element, target) {
        if (this.isElement(target)) {
            element.remove();
        } else if (target.el?.nativeElement) {
            element.remove();
        } else {
            throw new Error('Cannot remove ' + element + ' from ' + target);
        }
    }
    static isElement(obj) {
        return typeof HTMLElement === 'object' ? obj instanceof HTMLElement : obj && typeof obj === 'object' && obj !== null && obj.nodeType === 1 && typeof obj.nodeName === 'string';
    }
    static isDocument(obj) {
        return typeof Document === 'object' ? obj instanceof Document : obj && typeof obj === 'object' && obj !== null && obj.nodeType === 9;
    }
    static scrollInView(container, item) {
        let borderTopValue = getComputedStyle(container).getPropertyValue('border-top-width');
        let borderTop = borderTopValue ? Number.parseFloat(borderTopValue) : 0;
        let paddingTopValue = getComputedStyle(container).getPropertyValue('padding-top');
        let paddingTop = paddingTopValue ? Number.parseFloat(paddingTopValue) : 0;
        let containerRect = container.getBoundingClientRect();
        let itemRect = item.getBoundingClientRect();
        let offset = itemRect.top + document.body.scrollTop - (containerRect.top + document.body.scrollTop) - borderTop - paddingTop;
        let scroll = container.scrollTop;
        let elementHeight = container.clientHeight;
        let itemHeight = this.getOuterHeight(item);

        if (offset < 0) {
            container.scrollTop = scroll + offset;
        } else if (offset + itemHeight > elementHeight) {
            container.scrollTop = scroll + offset - elementHeight + itemHeight;
        }
    }
    static clearSelection() {
        if (window.getSelection) {
            if (window.getSelection().empty) {
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges && window.getSelection().rangeCount > 0 && window.getSelection().getRangeAt(0).getClientRects().length > 0) {
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection?.empty) {
            try {
                document.selection.empty();
            } catch (error) {
                // Internet Explorer can reject an otherwise valid selection clear.
                console.warn('Unable to clear the current document selection.', error); // eslint-disable-line no-console

                return;
            }
        }
    }
    static calculateScrollbarWidth(el) {
        if (el) {
            let style = getComputedStyle(el);

            return el.offsetWidth - el.clientWidth - Number.parseFloat(style.borderLeftWidth) - Number.parseFloat(style.borderRightWidth);
        }

        if (this.calculatedScrollbarWidth != null) {
            return this.calculatedScrollbarWidth;
        }

        let scrollDiv = document.createElement('div');

        scrollDiv.className = 'p-scrollbar-measure';
        document.body.appendChild(scrollDiv);
        let scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

        scrollDiv.remove();
        this.calculatedScrollbarWidth = scrollbarWidth;

        return scrollbarWidth;
    }
    static calculateBodyScrollbarWidth() {
        return window.innerWidth - document.documentElement.offsetWidth;
    }
    static getBrowser() {
        if (!this.browser) {
            let matched = this.resolveUserAgent();

            this.browser = {};

            if (matched.browser) {
                this.browser[matched.browser] = true;
                this.browser.version = matched.version;
            }

            if (this.browser.chrome) {
                this.browser.webkit = true;
            } else if (this.browser.webkit) {
                this.browser.safari = true;
            }
        }

        return this.browser;
    }
    static resolveUserAgent() {
        let ua = navigator.userAgent.toLowerCase();
        let match = /(chrome) ([\w.]+)/.exec(ua) || /(webkit) ([\w.]+)/.exec(ua) || /(opera)(?:.*version|) ([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || (!ua.includes('compatible') && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) || [];

        return {
            browser: match[1] || '',
            version: match[2] || '0'
        };
    }
    static blockBodyScroll(className = 'p-overflow-hidden') {
        // This method may be called repeatedly; the CSS-property check keeps those calls idempotent.
        const hasScrollbarWidth = !!document.body.style.getPropertyValue('--scrollbar-width');

        !hasScrollbarWidth && document.body.style.setProperty('--scrollbar-width', this.calculateBodyScrollbarWidth() + 'px');
        this.addClass(document.body, className);
    }
    static unblockBodyScroll(className = 'p-overflow-hidden') {
        document.body.style.removeProperty('--scrollbar-width');
        this.removeClass(document.body, className);
    }
    static isVisible(element) {
        // https://stackoverflow.com/a/59096915/502366 (in future use IntersectionObserver)
        return element && (element.clientHeight !== 0 || element.getClientRects().length !== 0 || getComputedStyle(element).display !== 'none');
    }
    static isExist(element) {
        return !!(element?.nodeName && element.parentNode);
    }
    static getFocusableElements(element, selector = '') {
        let focusableElements = DomHandler.find(
            element,
            `button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector}`
        );
        let visibleFocusableElements = [];

        for (let focusableElement of focusableElements) {
            if (getComputedStyle(focusableElement).display !== 'none' && getComputedStyle(focusableElement).visibility !== 'hidden') {
                visibleFocusableElements.push(focusableElement);
            }
        }

        return visibleFocusableElements;
    }
    static getFirstFocusableElement(element, selector) {
        const focusableElements = DomHandler.getFocusableElements(element, selector);

        return focusableElements.length > 0 ? focusableElements[0] : null;
    }
    static getLastFocusableElement(element, selector) {
        const focusableElements = DomHandler.getFocusableElements(element, selector);

        return focusableElements.length > 0 ? focusableElements.at(-1) : null;
    }

    /**
     * Focus an input element if it does not already have focus.
     *
     * @param {HTMLElement} el a HTML element
     * @param {boolean} scrollTo flag to control whether to scroll to the element, false by default
     */
    static focus(el, scrollTo = false) {
        const preventScroll = !scrollTo;

        el &&
            document.activeElement !== el &&
            el.focus({
                preventScroll
            });
    }

    /**
     * Focus the first focusable element if it does not already have focus.
     *
     * @param {HTMLElement} el a HTML element
     * @param {boolean} scrollTo flag to control whether to scroll to the element, false by default
     * @return {HTMLElement | undefined} the first focusable HTML element found
     */
    static focusFirstElement(el, scrollTo) {
        if (!el) {
            return;
        }

        const firstFocusableElement = DomHandler.getFirstFocusableElement(el);

        firstFocusableElement && DomHandler.focus(firstFocusableElement, scrollTo);

        return firstFocusableElement;
    }
    static getCursorOffset(el, prevText, nextText, currentText) {
        if (el) {
            let style = getComputedStyle(el);
            let ghostDiv = document.createElement('div');

            ghostDiv.style.position = 'absolute';
            ghostDiv.style.top = '0px';
            ghostDiv.style.left = '0px';
            ghostDiv.style.visibility = 'hidden';
            ghostDiv.style.pointerEvents = 'none';
            ghostDiv.style.overflow = style.overflow;
            ghostDiv.style.width = style.width;
            ghostDiv.style.height = style.height;
            ghostDiv.style.padding = style.padding;
            ghostDiv.style.border = style.border;
            ghostDiv.style.overflowWrap = style.overflowWrap;
            ghostDiv.style.whiteSpace = style.whiteSpace;
            ghostDiv.style.lineHeight = style.lineHeight;
            ghostDiv.innerHTML = prevText.replaceAll(/\r\n|\r|\n/g, '<br />');
            let ghostSpan = document.createElement('span');

            ghostSpan.textContent = currentText;
            ghostDiv.appendChild(ghostSpan);
            let text = document.createTextNode(nextText);

            ghostDiv.appendChild(text);
            document.body.appendChild(ghostDiv);
            const { offsetLeft, offsetTop, clientHeight } = ghostSpan;

            ghostDiv.remove();

            return {
                left: Math.abs(offsetLeft - el.scrollLeft),
                top: Math.abs(offsetTop - el.scrollTop) + clientHeight
            };
        }

        return {
            top: 'auto',
            left: 'auto'
        };
    }
    static invokeElementMethod(element, methodName, args) {
        element[methodName](...args);
    }
    static isClickable(element) {
        const targetNode = element.nodeName;
        const parentNode = element.parentElement?.nodeName;

        return (
            targetNode === 'INPUT' ||
            targetNode === 'TEXTAREA' ||
            targetNode === 'BUTTON' ||
            targetNode === 'A' ||
            parentNode === 'INPUT' ||
            parentNode === 'TEXTAREA' ||
            parentNode === 'BUTTON' ||
            parentNode === 'A' ||
            this.hasClass(element, 'p-button') ||
            this.hasClass(element.parentElement, 'p-button') ||
            this.hasClass(element.parentElement, 'p-checkbox') ||
            this.hasClass(element.parentElement, 'p-radiobutton')
        );
    }
    static applyStyle(element, style) {
        if (typeof style === 'string') {
            element.style.cssText = style;
        } else {
            for (let prop in style) {
                element.style[prop] = style[prop];
            }
        }
    }
    static exportCSV(csv, filename) {
        let blob = new Blob([csv], {
            type: 'application/csv;charset=utf-8;'
        });

        if (window.navigator.msSaveOrOpenBlob) {
            navigator.msSaveOrOpenBlob(blob, filename + '.csv');
        } else {
            const isDownloaded = DomHandler.saveAs({
                name: filename + '.csv',
                src: URL.createObjectURL(blob)
            });

            if (!isDownloaded) {
                csv = 'data:text/csv;charset=utf-8,' + csv;
                window.open(encodeURI(csv));
            }
        }
    }
    static saveAs(file) {
        if (file) {
            let link = document.createElement('a');

            if ('download' in link) {
                const { name, src } = file;

                link.setAttribute('href', src);
                link.setAttribute('download', name);
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();

                return true;
            }
        }

        return false;
    }
    static createInlineStyle(nonce, styleContainer) {
        let styleElement = document.createElement('style');

        DomHandler.addNonce(styleElement, nonce);

        if (!styleContainer) {
            styleContainer = document.head;
        }

        styleContainer.appendChild(styleElement);

        return styleElement;
    }
    static removeInlineStyle(styleElement) {
        if (this.isExist(styleElement)) {
            styleElement.remove();
            styleElement = null;
        }

        return styleElement;
    }
    static addNonce(styleElement, nonce) {
        const resolvedNonce = nonce || process.env.REACT_APP_CSS_NONCE;

        if (resolvedNonce) styleElement.setAttribute('nonce', resolvedNonce);
    }
    static getTargetElement(target) {
        if (!target) {
            return null;
        }

        if (target === 'document') {
            return document;
        } else if (target === 'window') {
            return window;
        } else if (typeof target === 'object' && target.hasOwnProperty('current')) {
            return this.isExist(target.current) ? target.current : null;
        }

        const isFunction = (obj) => !!(obj?.constructor && obj.call && obj.apply);
        const element = isFunction(target) ? target() : target;

        return this.isDocument(element) || this.isExist(element) ? element : null;
    }

    /**
     * Get the attribute names for an element and sorts them alpha for comparison
     */
    static getAttributeNames(node) {
        let index;
        let rv;
        let attrs;

        rv = [];
        attrs = node.attributes;

        for (index = 0; index < attrs.length; ++index) {
            rv.push(attrs[index].nodeName);
        }

        rv.sort((left, right) => left.localeCompare(right));

        return rv;
    }

    /**
     * Compare two elements for equality.  Even will compare if the style element
     * is out of order for example:
     *
     * elem1 = style="color: red; font-size: 28px"
     * elem2 = style="font-size: 28px; color: red"
     */
    static isEqualElement(elm1, elm2) {
        return DomHandler.hasEqualAttributes(elm1, elm2) && DomHandler.hasEqualChildren(elm1, elm2);
    }
    static hasEqualAttributes(elm1, elm2) {
        const attributes = DomHandler.getAttributeNames(elm1);

        if (attributes.join(',') !== DomHandler.getAttributeNames(elm2).join(',')) return false;

        return attributes.every((name) => (name === 'style' ? DomHandler.hasEqualStyles(elm1.style, elm2.style) : elm1.getAttribute(name) === elm2.getAttribute(name)));
    }
    static hasEqualStyles(style1, style2) {
        const digitsOnly = /^\d+$/;

        return Object.keys(style1).every((key) => digitsOnly.test(key) || style1[key] === style2[key]);
    }
    static hasEqualChildren(elm1, elm2) {
        let node1 = elm1.firstChild;
        let node2 = elm2.firstChild;

        while (node1 && node2) {
            if (node1.nodeType !== node2.nodeType) return false;
            if (node1.nodeType === 1 && !DomHandler.isEqualElement(node1, node2)) return false;
            if (node1.nodeType !== 1 && node1.nodeValue !== node2.nodeValue) return false;

            node1 = node1.nextSibling;
            node2 = node2.nextSibling;
        }

        return !node1 && !node2;
    }
    static hasCSSAnimation(element) {
        if (element) {
            const style = getComputedStyle(element);
            const animationDuration = Number.parseFloat(style.getPropertyValue('animation-duration') || '0');

            return animationDuration > 0;
        }

        return false;
    }
    static hasCSSTransition(element) {
        if (element) {
            const style = getComputedStyle(element);
            const transitionDuration = Number.parseFloat(style.getPropertyValue('transition-duration') || '0');

            return transitionDuration > 0;
        }

        return false;
    }
}
