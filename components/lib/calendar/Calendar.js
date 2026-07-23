import { resolveConditional } from '../utils/ConditionalUtils';
import * as React from 'react';
import { PrimeReactContext, localeOption, localeOptions, PrimeReactConfig } from '../api/Api';
import { Button } from '../button/Button';
import { useHandleStyle } from '../componentbase/ComponentBase';
import { ESC_KEY_HANDLING_PRIORITIES, useDisplayOrder, useGlobalOnEscapeKey, useMergeProps, useMountEffect, useOverlayListener, usePrevious, useUnmountEffect, useUpdateEffect } from '../hooks/Hooks';
import { CalendarIcon } from '../icons/calendar';
import { ChevronDownIcon } from '../icons/chevrondown';
import { ChevronLeftIcon } from '../icons/chevronleft';
import { ChevronRightIcon } from '../icons/chevronright';
import { ChevronUpIcon } from '../icons/chevronup';
import { InputText } from '../inputtext/InputText';
import { OverlayService } from '../overlayservice/OverlayService';
import { Ripple } from '../ripple/Ripple';
import { DomHandler, IconUtils, ObjectUtils, UniqueComponentId, ZIndexUtils, classNames, mask } from '../utils/Utils';
import { CalendarBase } from './CalendarBase';
import { CalendarPanel } from './CalendarPanel';

function handleSonarNested1() {
    return 4;
}

function handleSonarNested2(match) {
    return resolveConditional(
        match === 'o',
        () => 3,
        () => 2
    );
}

function hasFocusableRowCell(cellIndex, row) {
    const focusCell = row.children[cellIndex].children[0];

    return !DomHandler.getAttribute(focusCell, 'data-p-disabled');
}

function hasFocusableCell(cell) {
    const focusCell = cell.children[0];

    return !DomHandler.getAttribute(focusCell, 'data-p-disabled');
}

export const Calendar = React.memo(
    React.forwardRef((inProps, ref) => {
        const mergeProps = useMergeProps();
        const context = React.useContext(PrimeReactContext);
        const props = CalendarBase.getProps(inProps, context);
        const [focusedState, setFocusedState] = React.useState(false);
        const [overlayVisibleState, setOverlayVisibleState] = React.useState(false);
        const [viewDateState, setViewDateState] = React.useState(null);
        const [idState, setIdState] = React.useState(props.id);
        const isCloseOnEscape = overlayVisibleState && props.closeOnEscape;
        const overlayDisplayOrder = useDisplayOrder('overlay-panel', isCloseOnEscape);
        const metaData = {
            props,
            state: {
                focused: focusedState,
                overlayVisible: overlayVisibleState,
                viewDate: viewDateState
            }
        };
        const { ptm, cx, isUnstyled } = CalendarBase.setMetaData(metaData);

        useGlobalOnEscapeKey({
            callback: () => {
                hide(null, reFocusInputField);
            },
            when: overlayVisibleState && overlayDisplayOrder,
            priority: [ESC_KEY_HANDLING_PRIORITIES.OVERLAY_PANEL, overlayDisplayOrder]
        });
        useHandleStyle(CalendarBase.css.styles, isUnstyled, {
            name: 'calendar'
        });
        const elementRef = React.useRef(null);
        const overlayRef = React.useRef(null);
        const inputRef = React.useRef(props.inputRef);
        const navigation = React.useRef(null);
        const ignoreFocusFunctionality = React.useRef(false);
        const timePickerTimer = React.useRef(null);
        const viewStateChanged = React.useRef(false);
        const touchUIMask = React.useRef(null);
        const overlayEventListener = React.useRef(null);
        const touchUIMaskClickListener = React.useRef(null);
        const isOverlayClicked = React.useRef(false);
        const previousButton = React.useRef(false);
        const nextButton = React.useRef(false);
        const viewChangedWithKeyDown = React.useRef(false);
        const onChangeRef = React.useRef(null);
        const isClearClicked = React.useRef(false);
        const updateInputfieldRef = React.useRef(null);
        const [currentView, setCurrentView] = React.useState('date');
        const [currentMonth, setCurrentMonth] = React.useState(null);
        const [currentYear, setCurrentYear] = React.useState(null);
        const [yearOptions, setYearOptions] = React.useState([]);
        const previousValue = usePrevious(props.value);
        const visible = props.inline || (props.onVisibleChange ? props.visible : overlayVisibleState);
        const attributeSelector = UniqueComponentId();
        const panelId = idState + '_panel';
        const [bindOverlayListener, unbindOverlayListener] = useOverlayListener({
            target: elementRef,
            overlay: overlayRef,
            listener: (event, { type, valid }) => {
                if (valid) {
                    if (type === 'outside') {
                        if (!isOverlayClicked.current && !isNavIconClicked(event.target)) {
                            hide('outside');
                        }
                    } else if (context?.hideOverlaysOnDocumentScrolling || PrimeReactConfig.hideOverlaysOnDocumentScrolling) {
                        hide();
                    } else if (!DomHandler.isDocument(event.target)) {
                        alignOverlay();
                    }
                }

                isOverlayClicked.current = false;
            },
            when: !(props.touchUI || props.inline) && visible,
            type: 'mousedown'
        });

        const getDateFormat = () => {
            return props.dateFormat || localeOption('dateFormat', props.locale);
        };

        const onInputClick = () => {
            if (!visible && props.showOnFocus) {
                show();
            }
        };

        const onInputFocus = (event) => {
            if (ignoreFocusFunctionality.current) {
                setFocusedState(true);
                ignoreFocusFunctionality.current = false;
            } else {
                if (props.showOnFocus && !visible) {
                    show();
                }

                setFocusedState(true);
                props.onFocus?.(event);
            }
        };

        const onInputBlur = (event) => {
            updateInputfield(props.value);
            props.onBlur?.(event);
            setFocusedState(false);
        };

        const onInputKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowDown': {
                    if (!overlayVisibleState) {
                        show();
                    } else {
                        focusToFirstCell();
                        event.preventDefault();
                    }

                    break;
                }

                case 'Escape': {
                    hide();
                    props.touchUI && disableModality();
                    break;
                }

                case 'Tab': {
                    if (overlayRef?.current) {
                        DomHandler.getFocusableElements(overlayRef.current).forEach((el) => (el.tabIndex = '-1'));
                        hide();
                        props.touchUI && disableModality();
                    }

                    break;
                }

                default:
                    //no op
                    break;
            }
        };

        const onUserInput = (event) => {
            updateValueOnInput(event, event.target.value);
            props.onInput?.(event);
        };

        const updateValueOnInput = (event, rawValue, invalidCallback) => {
            props.onInput?.(event);

            try {
                const value = parseValueFromString(props.timeOnly ? rawValue.replace('_', '') : rawValue);

                if (isValidSelection(value)) {
                    validateDate(value);
                    updateModel(event, value);
                    const date = value.length ? value[0] : value;

                    updateViewDate(event, date);
                }
            } catch (err) {
                if (!err) throw err; //invalid date

                if (invalidCallback) {
                    invalidCallback();
                } else {
                    const value = props.keepInvalid ? rawValue : null;

                    updateModel(event, value);
                }
            }
        };

        const onViewDateSelect = ({ event, date }) => {
            if (date && props.onSelect) {
                const day = date.getDate();
                const month = date.getMonth();
                const year = date.getFullYear();

                onDateSelect(
                    event,
                    {
                        day,
                        month,
                        year,
                        selectable: isSelectable(day, month, year)
                    },
                    null,
                    true
                );
            }
        };

        const reFocusInputField = () => {
            if (!props.inline && inputRef.current) {
                ignoreFocusFunctionality.current = true;
                DomHandler.focus(inputRef.current);
            }
        };

        const isValidSelection = (value) => {
            let isValid = true;

            if (isSingleSelection()) {
                if (!(isSelectable(value.getDate(), value.getMonth(), value.getFullYear(), false) && (!props.showTime || isSelectableTime(value)))) {
                    isValid = false;
                }
            } else if (value.every((v) => isSelectable(v.getDate(), v.getMonth(), v.getFullYear(), false) && isSelectableTime(v))) {
                if (isRangeSelection()) {
                    isValid = value.length > 1 && value[1] >= value[0];
                }
            }

            return isValid;
        };

        const onButtonClick = () => {
            visible ? hide() : show();
        };

        const onPrevButtonClick = (event) => {
            navigation.current = {
                backward: true,
                button: true
            };
            navBackward(event);
        };

        const onNextButtonClick = (event) => {
            navigation.current = {
                backward: false,
                button: true
            };
            navForward(event);
        };

        const onContainerButtonKeydown = (event) => {
            switch (event.code) {
                case 'Tab':
                    !props.inline && trapFocus(event);
                    break;
                case 'Escape':
                    hide(null, reFocusInputField);
                    event.preventDefault();
                    break;
                default:
                    //no op
                    break;
            }
        };

        const onPickerKeyDown = (event, type, direction) => {
            if (event.key === 'Enter' || event.key === 'Space') {
                onTimePickerElementMouseDown(event, type, direction);
                event.preventDefault();

                return;
            }

            onContainerButtonKeydown(event);
        };

        const onPickerKeyUp = (event) => {
            if (event.key === 'Enter' || event.key === 'Space') {
                onTimePickerElementMouseUp();
                event.preventDefault();
            }
        };

        const trapFocus = (event) => {
            event?.preventDefault();
            const focusableElements = DomHandler.getFocusableElements(overlayRef.current);

            if (focusableElements && focusableElements.length > 0) {
                if (!document.activeElement) {
                    focusableElements[0].focus();
                } else {
                    const focusedIndex = focusableElements.indexOf(document.activeElement);

                    if (event?.shiftKey) {
                        if (focusedIndex === -1 || focusedIndex === 0) {
                            focusableElements.at(-1).focus();
                        } else {
                            focusableElements[focusedIndex - 1].focus();
                        }
                    } else if (focusedIndex === -1 || focusedIndex === focusableElements.length - 1) {
                        focusableElements[0].focus();
                    } else {
                        focusableElements[focusedIndex + 1].focus();
                    }
                }
            }
        };

        const updateFocus = () => {
            const runComplexBranch1 = () => {
                if (navigation.current.button) {
                    initFocusableCell();

                    if (navigation.current.backward) {
                        previousButton.current.focus();
                    } else {
                        nextButton.current.focus();
                    }
                } else {
                    let cell;

                    if (navigation.current.backward) {
                        let cells = DomHandler.find(overlayRef.current, 'table td span:not([data-p-disabled="true"])');

                        cell = cells.at(-1);
                    } else {
                        cell = DomHandler.findSingle(overlayRef.current, 'table td span:not([data-p-disabled="true"])');
                    }

                    if (cell) {
                        cell.tabIndex = '0';
                        cell.focus();
                    }
                }

                navigation.current = null;
            };

            if (navigation.current) {
                runComplexBranch1();
            } else {
                initFocusableCell();
            }
        };

        const initFocusableCell = () => {
            let cell;

            if (currentView === 'month') {
                const cells = DomHandler.find(overlayRef.current, '[data-pc-section="monthpicker"] [data-pc-section="month"]');
                const selectedCell = DomHandler.findSingle(overlayRef.current, '[data-pc-section="monthpicker"] [data-pc-section="month"][data-p-highlight="true"]');

                cells.forEach((cell) => (cell.tabIndex = -1));
                cell = selectedCell || cells[0];
            } else {
                cell = DomHandler.findSingle(overlayRef.current, 'span[data-p-highlight="true"]');

                if (!cell) {
                    const todayCell = DomHandler.findSingle(overlayRef.current, 'td.p-datepicker-today span:not(.p-disabled)');

                    cell = todayCell || DomHandler.findSingle(overlayRef.current, 'table td span:not([data-p-disabled="true"])');
                }
            }

            if (cell) {
                cell.tabIndex = '0';
            }
        };

        const focusToFirstCell = () => {
            if (currentView) {
                let cell;

                if (currentView === 'date') {
                    cell = DomHandler.findSingle(overlayRef.current, 'span[data-p-highlight="true"]');

                    if (!cell) {
                        const todayCell = DomHandler.findSingle(overlayRef.current, 'td.p-datepicker-today span:not(.p-disabled)');

                        cell = todayCell || DomHandler.findSingle(overlayRef.current, 'table td span:not([data-p-disabled="true"])');
                    }
                } else if (currentView === 'month' || currentView === 'year') {
                    cell = DomHandler.findSingle(overlayRef.current, 'span[data-p-highlight="true"]');

                    if (!cell) {
                        cell = DomHandler.findSingle(overlayRef.current, `[data-pc-section="${currentView}picker"] [data-pc-section="${currentView}"]:not([data-p-disabled="true"])`);
                    }
                }

                if (cell) {
                    cell.tabIndex = '0';
                    cell?.focus();
                }
            }
        };

        const navBackward = (event) => {
            if (props.disabled) {
                event.preventDefault();

                return;
            }

            let newViewDate = cloneDate(getViewDate());

            newViewDate.setDate(1);

            if (currentView === 'date') {
                if (newViewDate.getMonth() === 0) {
                    const newYear = decrementYear();

                    newViewDate.setMonth(11);
                    newViewDate.setFullYear(newYear);
                    props.onMonthChange?.({
                        month: 12,
                        year: newYear
                    });
                    setCurrentMonth(11);
                } else {
                    newViewDate.setMonth(newViewDate.getMonth() - 1);
                    props.onMonthChange?.({
                        month: currentMonth,
                        year: currentYear
                    });
                    setCurrentMonth((prevState) => prevState - 1);
                }
            } else if (currentView === 'month') {
                let newYear = newViewDate.getFullYear() - 1;

                if (props.yearNavigator) {
                    const minYear = Number.parseInt(props.yearRange.split(':')[0], 10);

                    if (newYear < minYear) {
                        newYear = minYear;
                    }
                }

                newViewDate.setFullYear(newYear);
            }

            if (currentView === 'month') {
                newViewDate.setFullYear(decrementYear());
            } else if (currentView === 'year') {
                newViewDate.setFullYear(decrementDecade());
            }

            updateViewDate(event, newViewDate);
            event.preventDefault();
        };

        const navForward = (event) => {
            if (props.disabled) {
                event.preventDefault();

                return;
            }

            let newViewDate = cloneDate(getViewDate());

            newViewDate.setDate(1);

            if (currentView === 'date') {
                if (newViewDate.getMonth() === 11) {
                    const newYear = incrementYear();

                    newViewDate.setMonth(0);
                    newViewDate.setFullYear(newYear);
                    props.onMonthChange?.({
                        month: 1,
                        year: newYear
                    });
                    setCurrentMonth(0);
                } else {
                    newViewDate.setMonth(newViewDate.getMonth() + 1);
                    props.onMonthChange?.({
                        month: currentMonth + 2,
                        year: currentYear
                    });
                    setCurrentMonth((prevState) => prevState + 1);
                }
            } else if (currentView === 'month') {
                let newYear = newViewDate.getFullYear() + 1;

                if (props.yearNavigator) {
                    const maxYear = Number.parseInt(props.yearRange.split(':')[1], 10);

                    if (newYear > maxYear) {
                        newYear = maxYear;
                    }
                }

                newViewDate.setFullYear(newYear);
            }

            if (currentView === 'month') {
                newViewDate.setFullYear(incrementYear());
            } else if (currentView === 'year') {
                newViewDate.setFullYear(incrementDecade());
            }

            updateViewDate(event, newViewDate);
            event.preventDefault();
        };

        const populateYearOptions = (start, end) => {
            let _yearOptions = [];

            for (let i = start; i <= end; i++) {
                yearOptions.push(i);
            }

            setYearOptions(_yearOptions);
        };

        const decrementYear = () => {
            const year = getViewYear();
            const _currentYear = year - 1;

            setCurrentYear(_currentYear);

            if (props.yearNavigator && _currentYear < yearOptions[0]) {
                let difference = yearOptions.at(-1) - yearOptions[0];

                populateYearOptions(yearOptions[0] - difference, yearOptions.at(-1) - difference);
            }

            return _currentYear;
        };

        const incrementYear = () => {
            const year = getViewYear();
            const _currentYear = year + 1;

            setCurrentYear(_currentYear);

            if (props.yearNavigator && _currentYear.current > yearOptions.at(-1)) {
                let difference = yearOptions.at(-1) - yearOptions[0];

                populateYearOptions(yearOptions[0] + difference, yearOptions.at(-1) + difference);
            }

            return _currentYear;
        };

        const onMonthDropdownChange = (event, value) => {
            const currentViewDate = getViewDate();
            let newViewDate = cloneDate(currentViewDate);

            newViewDate.setDate(1);
            newViewDate.setMonth(Number.parseInt(value, 10));
            updateViewDate(event, newViewDate);
        };

        const onYearDropdownChange = (event, value) => {
            const currentViewDate = getViewDate();
            let newViewDate = cloneDate(currentViewDate);

            newViewDate.setFullYear(Number.parseInt(value, 10));
            updateViewDate(event, newViewDate);
        };

        const onTodayButtonClick = (event) => {
            const today = new Date();
            const dateMeta = {
                day: today.getDate(),
                month: today.getMonth(),
                year: today.getFullYear(),
                today: true,
                selectable: true
            };
            const timeMeta = {
                hours: today.getHours(),
                minutes: today.getMinutes(),
                seconds: props.showSeconds ? today.getSeconds() : 0,
                milliseconds: props.showMillisec ? today.getMilliseconds() : 0
            };

            updateViewDate(event, today);
            onDateSelect(event, dateMeta, timeMeta);
            props.onTodayButtonClick?.(event);
        };

        const onClearButtonClick = (event) => {
            isClearClicked.current = true;
            updateModel(event, null);
            updateInputfield(null);
            setCurrentYear(new Date().getFullYear()); // #7581
            hide();
            props.onClearButtonClick?.(event);
        };

        const onPanelClick = (event) => {
            if (!props.inline) {
                OverlayService.emit('overlay-click', {
                    originalEvent: event,
                    target: elementRef.current
                });
            }
        };

        const onPanelMouseUp = (event) => {
            onPanelClick(event);
        };

        const onTimePickerElementMouseDown = (event, type, direction) => {
            if (!props.disabled) {
                repeat(event, null, type, direction);
                event.preventDefault();
            }
        };

        const stopTimePickerRepeat = () => {
            if (!props.disabled) {
                clearTimePickerTimer();
            }
        };

        const onTimePickerElementMouseUp = stopTimePickerRepeat;
        const onTimePickerElementMouseLeave = stopTimePickerRepeat;

        const repeat = (event, interval, type, direction) => {
            clearTimePickerTimer();
            timePickerTimer.current = setTimeout(() => {
                repeat(event, 100, type, direction);
            }, interval || 500);

            switch (type) {
                case 0:
                    if (direction === 1) {
                        incrementHour(event);
                    } else {
                        decrementHour(event);
                    }

                    break;
                case 1:
                    if (direction === 1) {
                        incrementMinute(event);
                    } else {
                        decrementMinute(event);
                    }

                    break;
                case 2:
                    if (direction === 1) {
                        incrementSecond(event);
                    } else {
                        decrementSecond(event);
                    }

                    break;
                case 3:
                    if (direction === 1) {
                        incrementMilliSecond(event);
                    } else {
                        decrementMilliSecond(event);
                    }

                    break;
                default:
                    break;
            }
        };

        const clearTimePickerTimer = () => {
            if (timePickerTimer.current) {
                clearTimeout(timePickerTimer.current);
            }
        };

        const roundMinutesToStep = (minutes) => {
            if (props.stepMinute) {
                return Math.round(minutes / props.stepMinute) * props.stepMinute;
            }

            return minutes;
        };

        const incrementHour = (event) => {
            const currentTime = getCurrentDateTime();
            const currentHour = currentTime.getHours();
            let newHour = currentHour + props.stepHour;

            newHour = newHour >= 24 ? newHour - 24 : newHour;

            const runComplexBranch4 = () => {
                if (props.maxDate && props.maxDate.toDateString() === currentTime.toDateString() && props.maxDate.getHours() === newHour) {
                    if (props.maxDate.getMinutes() <= currentTime.getMinutes()) {
                        if (props.maxDate.getSeconds() < currentTime.getSeconds()) {
                            if (props.maxDate.getMilliseconds() < currentTime.getMilliseconds()) {
                                updateTime(event, newHour, props.maxDate.getMinutes(), props.maxDate.getSeconds(), props.maxDate.getMilliseconds());
                            } else {
                                updateTime(event, newHour, props.maxDate.getMinutes(), props.maxDate.getSeconds(), currentTime.getMilliseconds());
                            }
                        } else {
                            updateTime(event, newHour, props.maxDate.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds());
                        }
                    } else {
                        updateTime(event, newHour, roundMinutesToStep(currentTime.getMinutes()), currentTime.getSeconds(), currentTime.getMilliseconds());
                    }
                } else {
                    updateTime(event, newHour, roundMinutesToStep(currentTime.getMinutes()), currentTime.getSeconds(), currentTime.getMilliseconds());
                }
            };

            if (validateHour(newHour, currentTime)) {
                runComplexBranch4();
            }

            event.preventDefault();
        };

        const decrementHour = (event) => {
            const currentTime = getCurrentDateTime();
            const currentHour = currentTime.getHours();
            let newHour = currentHour - props.stepHour;

            newHour = newHour < 0 ? newHour + 24 : newHour;

            const runComplexBranch8 = () => {
                if (props.minDate && props.minDate.toDateString() === currentTime.toDateString() && props.minDate.getHours() === newHour) {
                    if (props.minDate.getMinutes() >= currentTime.getMinutes()) {
                        if (props.minDate.getSeconds() > currentTime.getSeconds()) {
                            if (props.minDate.getMilliseconds() > currentTime.getMilliseconds()) {
                                updateTime(event, newHour, props.minDate.getMinutes(), props.minDate.getSeconds(), props.minDate.getMilliseconds());
                            } else {
                                updateTime(event, newHour, props.minDate.getMinutes(), props.minDate.getSeconds(), currentTime.getMilliseconds());
                            }
                        } else {
                            updateTime(event, newHour, props.minDate.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds());
                        }
                    } else {
                        updateTime(event, newHour, roundMinutesToStep(currentTime.getMinutes()), currentTime.getSeconds(), currentTime.getMilliseconds());
                    }
                } else {
                    updateTime(event, newHour, roundMinutesToStep(currentTime.getMinutes()), currentTime.getSeconds(), currentTime.getMilliseconds());
                }
            };

            if (validateHour(newHour, currentTime)) {
                runComplexBranch8();
            }

            event.preventDefault();
        };

        const doStepMinute = (currentMinute, step) => {
            if (props.stepMinute <= 1) {
                return step ? currentMinute + step : currentMinute;
            }

            if (!step) {
                step = props.stepMinute;

                if (currentMinute % step === 0) {
                    return currentMinute;
                }
            }

            return Math.floor((currentMinute + step) / step) * step;
        };

        const incrementMinute = (event) => {
            const currentTime = getCurrentDateTime();
            const currentMinute = currentTime.getMinutes();
            let newMinute = doStepMinute(currentMinute, props.stepMinute);

            newMinute = newMinute > 59 ? newMinute - 60 : newMinute;

            if (validateMinute(newMinute, currentTime)) {
                if (props.maxDate && props.maxDate.toDateString() === currentTime.toDateString() && props.maxDate.getMinutes() === newMinute) {
                    if (props.maxDate.getSeconds() < currentTime.getSeconds()) {
                        if (props.maxDate.getMilliseconds() < currentTime.getMilliseconds()) {
                            updateTime(event, currentTime.getHours(), newMinute, props.maxDate.getSeconds(), props.maxDate.getMilliseconds());
                        } else {
                            updateTime(event, currentTime.getHours(), newMinute, props.maxDate.getSeconds(), currentTime.getMilliseconds());
                        }
                    } else {
                        updateTime(event, currentTime.getHours(), newMinute, currentTime.getSeconds(), currentTime.getMilliseconds());
                    }
                } else {
                    updateTime(event, currentTime.getHours(), newMinute, currentTime.getSeconds(), currentTime.getMilliseconds());
                }
            }

            event.preventDefault();
        };

        const decrementMinute = (event) => {
            const currentTime = getCurrentDateTime();
            const currentMinute = currentTime.getMinutes();
            let newMinute = doStepMinute(currentMinute, -props.stepMinute);

            newMinute = newMinute < 0 ? newMinute + 60 : newMinute;

            if (validateMinute(newMinute, currentTime)) {
                if (props.minDate && props.minDate.toDateString() === currentTime.toDateString() && props.minDate.getMinutes() === newMinute) {
                    if (props.minDate.getSeconds() > currentTime.getSeconds()) {
                        if (props.minDate.getMilliseconds() > currentTime.getMilliseconds()) {
                            updateTime(event, currentTime.getHours(), newMinute, props.minDate.getSeconds(), props.minDate.getMilliseconds());
                        } else {
                            updateTime(event, currentTime.getHours(), newMinute, props.minDate.getSeconds(), currentTime.getMilliseconds());
                        }
                    } else {
                        updateTime(event, currentTime.getHours(), newMinute, currentTime.getSeconds(), currentTime.getMilliseconds());
                    }
                } else {
                    updateTime(event, currentTime.getHours(), newMinute, currentTime.getSeconds(), currentTime.getMilliseconds());
                }
            }

            event.preventDefault();
        };

        const incrementSecond = (event) => {
            const currentTime = getCurrentDateTime();
            const currentSecond = currentTime.getSeconds();
            let newSecond = currentSecond + props.stepSecond;

            newSecond = newSecond > 59 ? newSecond - 60 : newSecond;

            if (validateSecond(newSecond, currentTime)) {
                if (props.maxDate && props.maxDate.toDateString() === currentTime.toDateString() && props.maxDate.getSeconds() === newSecond) {
                    if (props.maxDate.getMilliseconds() < currentTime.getMilliseconds()) {
                        updateTime(event, currentTime.getHours(), currentTime.getMinutes(), newSecond, props.maxDate.getMilliseconds());
                    } else {
                        updateTime(event, currentTime.getHours(), currentTime.getMinutes(), newSecond, currentTime.getMilliseconds());
                    }
                } else {
                    updateTime(event, currentTime.getHours(), currentTime.getMinutes(), newSecond, currentTime.getMilliseconds());
                }
            }

            event.preventDefault();
        };

        const decrementSecond = (event) => {
            const currentTime = getCurrentDateTime();
            const currentSecond = currentTime.getSeconds();
            let newSecond = currentSecond - props.stepSecond;

            newSecond = newSecond < 0 ? newSecond + 60 : newSecond;

            if (validateSecond(newSecond, currentTime)) {
                if (props.minDate && props.minDate.toDateString() === currentTime.toDateString() && props.minDate.getSeconds() === newSecond) {
                    if (props.minDate.getMilliseconds() > currentTime.getMilliseconds()) {
                        updateTime(event, currentTime.getHours(), currentTime.getMinutes(), newSecond, props.minDate.getMilliseconds());
                    } else {
                        updateTime(event, currentTime.getHours(), currentTime.getMinutes(), newSecond, currentTime.getMilliseconds());
                    }
                } else {
                    updateTime(event, currentTime.getHours(), currentTime.getMinutes(), newSecond, currentTime.getMilliseconds());
                }
            }

            event.preventDefault();
        };

        const incrementMilliSecond = (event) => {
            const currentTime = getCurrentDateTime();
            const currentMillisecond = currentTime.getMilliseconds();
            let newMillisecond = currentMillisecond + props.stepMillisec;

            newMillisecond = newMillisecond > 999 ? newMillisecond - 1000 : newMillisecond;

            if (validateMillisecond(newMillisecond, currentTime)) {
                updateTime(event, currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), newMillisecond);
            }

            event.preventDefault();
        };

        const decrementMilliSecond = (event) => {
            const currentTime = getCurrentDateTime();
            const currentMillisecond = currentTime.getMilliseconds();
            let newMillisecond = currentMillisecond - props.stepMillisec;

            newMillisecond = newMillisecond < 0 ? newMillisecond + 999 : newMillisecond;

            if (validateMillisecond(newMillisecond, currentTime)) {
                updateTime(event, currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), newMillisecond);
            }

            event.preventDefault();
        };

        const toggleAmPm = (event) => {
            const currentTime = getCurrentDateTime();
            const currentHour = currentTime.getHours();
            const newHour = currentHour >= 12 ? currentHour - 12 : currentHour + 12;

            if (validateHour(convertTo24Hour(newHour, currentHour > 11), currentTime)) {
                updateTime(event, newHour, currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds());
            }

            event.preventDefault();
        };

        const getViewDate = (date) => {
            let propValue = props.value;
            let viewDate = date || (props.onViewDateChange ? props.viewDate : viewDateState);

            if (Array.isArray(propValue)) {
                propValue = propValue[0];
            }

            return viewDate && isValidDate(viewDate)
                ? viewDate
                : resolveConditional(
                      propValue && isValidDate(propValue),
                      () => propValue,
                      () => new Date()
                  );
        };

        const getCurrentDateTime = () => {
            if (isSingleSelection()) {
                return props.value && props.value instanceof Date ? cloneDate(props.value) : getViewDate();
            } else if (isMultipleSelection()) {
                if (props.value?.length) {
                    return cloneDate(props.value[props.value.length - 1]);
                }
            } else if (isRangeSelection()) {
                if (props.value?.length) {
                    let startDate = cloneDate(props.value[0]);
                    let endDate = cloneDate(props.value[1]);

                    return endDate || startDate;
                }
            }

            return new Date();
        };

        const cloneDate = (date) => {
            return isValidDate(date) ? new Date(date.valueOf()) : date;
        };

        const isValidDate = (date) => {
            return date instanceof Date && !Number.isNaN(date.valueOf());
        };

        const convertTo24Hour = (hour, pm) => {
            if (props.hourFormat === '12') {
                return hour === 12
                    ? resolveConditional(
                          pm,
                          () => 12,
                          () => 0
                      )
                    : resolveConditional(
                          pm,
                          () => hour + 12,
                          () => hour
                      );
            }

            return hour;
        };

        const validateHour = (hour, value) => {
            let valid = true;
            let valueDateString = value ? value.toDateString() : null;

            if (props.minDate && valueDateString && props.minDate.toDateString() === valueDateString) {
                if (props.minDate.getHours() > hour) {
                    valid = false;
                }
            }

            if (props.maxDate && valueDateString && props.maxDate.toDateString() === valueDateString) {
                if (props.maxDate.getHours() < hour) {
                    valid = false;
                }
            }

            return valid;
        };

        const validateMinute = (minute, value) => {
            let valid = true;
            let valueDateString = value ? value.toDateString() : null;

            if (props.minDate && valueDateString && props.minDate.toDateString() === valueDateString) {
                if (value.getHours() === props.minDate.getHours()) {
                    if (props.minDate.getMinutes() > minute) {
                        valid = false;
                    }
                }
            }

            if (props.maxDate && valueDateString && props.maxDate.toDateString() === valueDateString) {
                if (value.getHours() === props.maxDate.getHours()) {
                    if (props.maxDate.getMinutes() < minute) {
                        valid = false;
                    }
                }
            }

            return valid;
        };

        const validateSecond = (second, value) => {
            let valid = true;
            let valueDateString = value ? value.toDateString() : null;

            const runComplexBranch12 = () => {
                if (value.getHours() === props.minDate.getHours() && value.getMinutes() === props.minDate.getMinutes()) {
                    if (props.minDate.getSeconds() > second) {
                        valid = false;
                    }
                }
            };

            if (props.minDate && valueDateString && props.minDate.toDateString() === valueDateString) {
                runComplexBranch12();
            }

            const runComplexBranch14 = () => {
                if (value.getHours() === props.maxDate.getHours() && value.getMinutes() === props.maxDate.getMinutes()) {
                    if (props.maxDate.getSeconds() < second) {
                        valid = false;
                    }
                }
            };

            if (props.maxDate && valueDateString && props.maxDate.toDateString() === valueDateString) {
                runComplexBranch14();
            }

            return valid;
        };

        const validateMillisecond = (millisecond, value) => {
            let valid = true;
            let valueDateString = value ? value.toDateString() : null;

            const runComplexBranch16 = () => {
                if (value.getHours() === props.minDate.getHours() && value.getSeconds() === props.minDate.getSeconds() && value.getMinutes() === props.minDate.getMinutes()) {
                    if (props.minDate.getMilliseconds() > millisecond) {
                        valid = false;
                    }
                }
            };

            if (props.minDate && valueDateString && props.minDate.toDateString() === valueDateString) {
                runComplexBranch16();
            }

            const runComplexBranch18 = () => {
                if (value.getHours() === props.maxDate.getHours() && value.getSeconds() === props.maxDate.getSeconds() && value.getMinutes() === props.maxDate.getMinutes()) {
                    if (props.maxDate.getMilliseconds() < millisecond) {
                        valid = false;
                    }
                }
            };

            if (props.maxDate && valueDateString && props.maxDate.toDateString() === valueDateString) {
                runComplexBranch18();
            }

            return valid;
        };

        const validateDate = (value) => {
            const runComplexBranch20 = () => {
                const [minRangeYear, maxRangeYear] = props.yearRange ? props.yearRange.split(':').map((year) => Number.parseInt(year, 10)) : [null, null];
                let viewYear = value.getFullYear();
                let minYear = null;
                let maxYear = null;

                if (minRangeYear !== null) {
                    minYear = props.minDate ? Math.max(props.minDate.getFullYear(), minRangeYear) : minRangeYear;
                } else {
                    minYear = props.minDate?.getFullYear() || minRangeYear;
                }

                if (maxRangeYear !== null) {
                    maxYear = props.maxDate ? Math.min(props.maxDate.getFullYear(), maxRangeYear) : maxRangeYear;
                } else {
                    maxYear = props.maxDate?.getFullYear() || maxRangeYear;
                }

                if (minYear && minYear > viewYear) viewYear = minYear;
                if (maxYear && maxYear < viewYear) viewYear = maxYear;
                value.setFullYear(viewYear);
            };

            if (props.yearNavigator) {
                runComplexBranch20();
            }

            const runComplexBranch23 = () => {
                let viewMonth = value.getMonth();
                let viewMonthWithMinMax = Number.parseInt((isInMinYear(value) && Math.max(props.minDate.getMonth(), viewMonth).toString()) || (isInMaxYear(value) && Math.min(props.maxDate.getMonth(), viewMonth).toString()) || viewMonth);

                value.setMonth(viewMonthWithMinMax);
            };

            if (renderMonthsNavigator(0)) {
                runComplexBranch23();
            }
        };

        const updateTime = (event, hour, minute, second, millisecond) => {
            let newDateTime = getCurrentDateTime();

            newDateTime.setHours(hour);
            newDateTime.setMinutes(minute);
            newDateTime.setSeconds(second);
            newDateTime.setMilliseconds(millisecond);

            if (isMultipleSelection()) {
                if (props.value?.length) {
                    let value = [...props.value];

                    value[value.length - 1] = newDateTime;
                    newDateTime = value;
                } else {
                    newDateTime = [newDateTime];
                }
            } else if (isRangeSelection()) {
                if (props.value?.length) {
                    let startDate = props.value[0];
                    let endDate = props.value[1];

                    newDateTime = endDate ? [startDate, newDateTime] : [newDateTime, null];
                } else {
                    newDateTime = [newDateTime, null];
                }
            }

            updateModel(event, newDateTime);

            if (props.onSelect) {
                props.onSelect({
                    originalEvent: event,
                    value: newDateTime
                });
            }

            updateInputfield(newDateTime);
        };

        const updateViewDate = (event, value) => {
            validateDate(value);

            if (props.onViewDateChange && event) {
                props.onViewDateChange({
                    originalEvent: event,
                    value
                });
            } else {
                viewStateChanged.current = true;
                setViewDateState(value);
            }

            if (!value) onClearButtonClick(event);
        };

        const setNavigationState = (newViewDate) => {
            if (!newViewDate || !props.showMinMaxRange || props.view !== 'date' || !overlayRef.current) {
                return;
            }

            const navPrev = DomHandler.findSingle(overlayRef.current, '[data-pc-section="previousbutton"]');
            const navNext = DomHandler.findSingle(overlayRef.current, '[data-pc-section="nextbutton"]');

            if (props.disabled) {
                !isUnstyled() && DomHandler.addClass(navPrev, 'p-disabled');
                navPrev.dataset.pDisabled = true;
                !isUnstyled() && DomHandler.addClass(navNext, 'p-disabled');
                navNext.dataset.pDisabled = true;

                return;
            } // previous (check first day of month at 00:00:00)

            const runComplexBranch24 = () => {
                let firstDayOfMonth = cloneDate(newViewDate);

                if (firstDayOfMonth.getMonth() === 0) {
                    firstDayOfMonth.setMonth(11, 1);
                    firstDayOfMonth.setFullYear(firstDayOfMonth.getFullYear() - 1);
                } else {
                    firstDayOfMonth.setMonth(firstDayOfMonth.getMonth(), 1);
                }

                firstDayOfMonth.setHours(0);
                firstDayOfMonth.setMinutes(0);
                firstDayOfMonth.setSeconds(0);

                if (props.minDate > firstDayOfMonth) {
                    DomHandler.addClass(navPrev, 'p-disabled');
                } else {
                    DomHandler.removeClass(navPrev, 'p-disabled');
                }
            };

            if (props.minDate) {
                runComplexBranch24();
            } // next (check last day of month at 11:59:59)

            const runComplexBranch25 = () => {
                let lastDayOfMonth = cloneDate(newViewDate);

                if (lastDayOfMonth.getMonth() === 11) {
                    lastDayOfMonth.setMonth(0, 1);
                    lastDayOfMonth.setFullYear(lastDayOfMonth.getFullYear() + 1);
                } else {
                    lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1, 1);
                }

                lastDayOfMonth.setHours(0);
                lastDayOfMonth.setMinutes(0);
                lastDayOfMonth.setSeconds(0);
                lastDayOfMonth.setSeconds(-1);

                if (props.maxDate < lastDayOfMonth) {
                    DomHandler.addClass(navNext, 'p-disabled');
                } else {
                    DomHandler.removeClass(navNext, 'p-disabled');
                }
            };

            if (props.maxDate) {
                runComplexBranch25();
            }
        };

        const onDateCellKeydown = (event, date, groupIndex) => {
            const cellContent = event.currentTarget;
            const cell = cellContent.parentElement;
            const cellIndex = DomHandler.index(cell);

            const handleComplexCase1 = () => {
                cellContent.tabIndex = '-1';
                let nextRow = cell.parentElement.nextElementSibling;

                const runComplexBranch26 = () => {
                    let tableRowIndex = DomHandler.index(cell.parentElement);
                    const tableRows = Array.from(cell.parentElement.parentElement.children);
                    const nextTableRows = tableRows.slice(tableRowIndex + 1);
                    let hasNextFocusableDate = nextTableRows.find(hasFocusableRowCell.bind(null, cellIndex));

                    if (hasNextFocusableDate) {
                        let focusCell = hasNextFocusableDate.children[cellIndex].children[0];

                        focusCell.tabIndex = '0';
                        focusCell.focus();
                    } else {
                        navigation.current = {
                            backward: false
                        };
                        navForward(event);
                    }
                };

                if (nextRow) {
                    runComplexBranch26();
                } else {
                    navigation.current = {
                        backward: false
                    };
                    navForward(event);
                }

                event.preventDefault();
            };

            const handleComplexCase2 = () => {
                cellContent.tabIndex = '-1';

                const runComplexBranch27 = () => {
                    let prevRow = cell.parentElement.previousElementSibling;

                    if (prevRow) {
                        let tableRowIndex = DomHandler.index(cell.parentElement);
                        const tableRows = Array.from(cell.parentElement.parentElement.children);
                        const prevTableRows = tableRows.slice(0, tableRowIndex).reverse();
                        let hasNextFocusableDate = prevTableRows.find(hasFocusableRowCell.bind(null, cellIndex));

                        if (hasNextFocusableDate) {
                            let focusCell = hasNextFocusableDate.children[cellIndex].children[0];

                            focusCell.tabIndex = '0';
                            focusCell.focus();
                        } else {
                            navigation.current = {
                                backward: true
                            };
                            navBackward(event);
                        }
                    } else {
                        navigation.current = {
                            backward: true
                        };
                        navBackward(event);
                    }
                };

                if (event.altKey) {
                    hide(null, reFocusInputField);
                } else {
                    runComplexBranch27();
                }

                event.preventDefault();
            };

            const handleComplexCase3 = () => {
                cellContent.tabIndex = '-1';
                let prevCell = cell.previousElementSibling;

                const runComplexBranch29 = () => {
                    const cells = Array.from(cell.parentElement.children);
                    const prevCells = cells.slice(0, cellIndex).reverse();
                    let hasNextFocusableDate = prevCells.find(hasFocusableCell);

                    if (hasNextFocusableDate) {
                        let focusCell = hasNextFocusableDate.children[0];

                        focusCell.tabIndex = '0';
                        focusCell.focus();
                    } else {
                        navigateToMonth(true, groupIndex, event);
                    }
                };

                if (prevCell) {
                    runComplexBranch29();
                } else {
                    navigateToMonth(true, groupIndex, event);
                }

                event.preventDefault();
            };

            const handleComplexCase4 = () => {
                cellContent.tabIndex = '-1';
                let nextCell = cell.nextElementSibling;

                const runComplexBranch30 = () => {
                    const cells = Array.from(cell.parentElement.children);
                    const nextCells = cells.slice(cellIndex + 1);
                    let hasNextFocusableDate = nextCells.find(hasFocusableCell);

                    if (hasNextFocusableDate) {
                        let focusCell = hasNextFocusableDate.children[0];

                        focusCell.tabIndex = '0';
                        focusCell.focus();
                    } else {
                        navigateToMonth(false, groupIndex, event);
                    }
                };

                if (nextCell) {
                    runComplexBranch30();
                } else {
                    navigateToMonth(false, groupIndex, event);
                }

                event.preventDefault();
            };

            const handleComplexCase5 = () => {
                if (!props.inline) {
                    trapFocus(event);
                }
            };

            const handleComplexCase6 = () => {
                cellContent.tabIndex = '-1';
                let currentRow = cell.parentElement;
                let focusCell = currentRow.children[0].children[0];

                if (DomHandler.getAttribute(focusCell, 'data-p-disabled')) {
                    navigateToMonth(groupIndex, true, event);
                } else {
                    focusCell.tabIndex = '0';
                    focusCell.focus();
                }

                event.preventDefault();
            };

            const handleComplexCase7 = () => {
                cellContent.tabIndex = '-1';
                let currentRow = cell.parentElement;
                let focusCell = currentRow.children[currentRow.children.length - 1].children[0];

                if (DomHandler.getAttribute(focusCell, 'data-p-disabled')) {
                    navigateToMonth(groupIndex, false, event);
                } else {
                    focusCell.tabIndex = '0';
                    focusCell.focus();
                }

                event.preventDefault();
            };

            const handleComplexCase8 = () => {
                cellContent.tabIndex = '-1';

                if (event.shiftKey) {
                    navigation.current = {
                        backward: true
                    };
                    navBackward(event);
                } else {
                    navigateToMonth(groupIndex, true, event);
                }

                event.preventDefault();
            };

            const handleComplexCase9 = () => {
                cellContent.tabIndex = '-1';

                if (event.shiftKey) {
                    navigation.current = {
                        backward: false
                    };
                    navForward(event);
                } else {
                    navigateToMonth(groupIndex, false, event);
                }

                event.preventDefault();
            };

            switch (event.code) {
                case 'ArrowDown': {
                    handleComplexCase1();
                    break;
                }

                case 'ArrowUp': {
                    handleComplexCase2();
                    break;
                }

                case 'ArrowLeft': {
                    handleComplexCase3();
                    break;
                }

                case 'ArrowRight': {
                    handleComplexCase4();
                    break;
                }

                case 'Enter':
                case 'NumpadEnter':

                case 'Space': {
                    onDateSelect(event, date);
                    event.preventDefault();
                    break;
                }

                case 'Escape': {
                    hide(null, reFocusInputField);
                    event.preventDefault();
                    break;
                }

                case 'Tab': {
                    handleComplexCase5();
                    break;
                }

                case 'Home': {
                    handleComplexCase6();
                    break;
                }

                case 'End': {
                    handleComplexCase7();
                    break;
                }

                case 'PageUp': {
                    handleComplexCase8();
                    break;
                }

                case 'PageDown': {
                    handleComplexCase9();
                    break;
                }

                default:
                    //no op
                    break;
            }
        };

        const navigateToMonth = (prev, groupIndex, event) => {
            if (prev) {
                if (props.numberOfMonths === 1 || groupIndex === 0) {
                    navigation.current = {
                        backward: true
                    };
                    navBackward(event);
                } else {
                    const prevMonthContainer = overlayRef.current.children[0].children[groupIndex - 1];
                    const cells = DomHandler.find(prevMonthContainer, 'table td span:not([data-p-disabled="true"])');
                    const focusCell = cells.at(-1);

                    focusCell.tabIndex = '0';
                    focusCell.focus();
                }
            } else if (props.numberOfMonths === 1 || groupIndex === props.numberOfMonths - 1) {
                navigation.current = {
                    backward: false
                };
                navForward(event);
            } else {
                const nextMonthContainer = overlayRef.current.children[0].children[groupIndex + 1];
                const focusCell = DomHandler.findSingle(nextMonthContainer, 'table td span:not([data-p-disabled="true"])');

                focusCell.tabIndex = '0';
                focusCell.focus();
            }
        };

        const navigateByPageKey = (event, backward) => {
            if (event.shiftKey) {
                return;
            }

            navigation.current = { backward };
            backward ? navBackward(event) : navForward(event);
        };

        const onMonthCellKeydown = (event, index) => {
            const cell = event.currentTarget;

            const handleComplexCase10 = () => {
                cell.tabIndex = '-1';
                const cells = cell.parentElement.children;
                const cellIndex = DomHandler.index(cell);
                const nextCell = cells[event.which === 40 ? cellIndex + 3 : cellIndex - 3];

                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                }

                event.preventDefault();
            };

            const handleComplexCase11 = () => {
                cell.tabIndex = '-1';
                const prevCell = cell.previousElementSibling;

                if (prevCell) {
                    prevCell.tabIndex = '0';
                    prevCell.focus();
                } else {
                    navigation.current = {
                        backward: true
                    };
                    navBackward(event);
                }

                event.preventDefault();
            };

            const handleComplexCase12 = () => {
                cell.tabIndex = '-1';
                const nextCell = cell.nextElementSibling;

                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                } else {
                    navigation.current = {
                        backward: false
                    };
                    navForward(event);
                }

                event.preventDefault();
            };

            const handleComplexCase15 = () => {
                if (props.view !== 'month') {
                    viewChangedWithKeyDown.current = true;
                }

                onMonthSelect(event, index);
                event.preventDefault();
            };

            switch (
                event.code //arrows
            ) {
                case 'ArrowUp':

                case 'ArrowDown': {
                    handleComplexCase10();
                    break;
                }

                case 'ArrowLeft': {
                    handleComplexCase11();
                    break;
                }

                case 'ArrowRight': {
                    handleComplexCase12();
                    break;
                }

                case 'PageUp': {
                    navigateByPageKey(event, true);
                    break;
                }

                case 'PageDown': {
                    navigateByPageKey(event, false);
                    break;
                }

                case 'Enter':
                case 'NumpadEnter':

                case 'Space': {
                    handleComplexCase15();
                    break;
                }

                case 'Escape': {
                    hide(null, reFocusInputField);
                    event.preventDefault();
                    break;
                }

                case 'Tab': {
                    trapFocus(event);
                    break;
                }

                default:
                    //no op
                    break;
            }
        };

        const onYearCellKeydown = (event, index) => {
            const cell = event.currentTarget;

            const handleComplexCase16 = () => {
                cell.tabIndex = '-1';
                let cells = cell.parentElement.children;
                let cellIndex = DomHandler.index(cell);
                let nextCell = cells[event.code === 'ArrowDown' ? cellIndex + 2 : cellIndex - 2];

                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                }

                event.preventDefault();
            };

            const handleComplexCase17 = () => {
                cell.tabIndex = '-1';
                let prevCell = cell.previousElementSibling;

                if (prevCell) {
                    prevCell.tabIndex = '0';
                    prevCell.focus();
                } else {
                    navigation.current = {
                        backward: true
                    };
                    navBackward(event);
                }

                event.preventDefault();
            };

            const handleComplexCase18 = () => {
                cell.tabIndex = '-1';
                let nextCell = cell.nextElementSibling;

                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                } else {
                    navigation.current = {
                        backward: false
                    };
                    navForward(event);
                }

                event.preventDefault();
            };

            const handleComplexCase21 = () => {
                if (props.view !== 'year') {
                    viewChangedWithKeyDown.current = true;
                }

                onYearSelect(event, index);
                event.preventDefault();
            };

            switch (
                event.code //arrows
            ) {
                case 'ArrowUp':

                case 'ArrowDown': {
                    handleComplexCase16();
                    break;
                }

                case 'ArrowLeft': {
                    handleComplexCase17();
                    break;
                }

                case 'ArrowRight': {
                    handleComplexCase18();
                    break;
                }

                case 'PageUp': {
                    navigateByPageKey(event, true);
                    break;
                }

                case 'PageDown': {
                    navigateByPageKey(event, false);
                    break;
                }

                case 'Enter':
                case 'NumpadEnter':

                case 'Space': {
                    handleComplexCase21();
                    break;
                }

                case 'Escape': {
                    hide(null, reFocusInputField);
                    event.preventDefault();
                    break;
                }

                case 'Tab': {
                    trapFocus(event);
                    break;
                }

                default:
                    //no op
                    break;
            }
        };

        const onDateSelect = (event, dateMeta, timeMeta, isUpdateViewDate) => {
            if (!event) {
                return;
            }

            if (props.disabled || !dateMeta.selectable) {
                event.preventDefault();

                return;
            }

            DomHandler.find(overlayRef.current, 'table td span:not([data-p-disabled="true"])').forEach((cell) => (cell.tabIndex = -1));
            event.currentTarget.focus();

            if (isMultipleSelection()) {
                if (isSelected(dateMeta)) {
                    let value = props.value.filter((date) => {
                        return !isDateEquals(date, dateMeta);
                    });

                    updateModel(event, value);
                    updateInputfield(value);
                } else if (!props.maxDateCount || !props.value || props.maxDateCount > props.value.length) {
                    selectDate(event, dateMeta, timeMeta);
                }
            } else {
                selectDate(event, dateMeta, timeMeta);
            }

            if (!props.inline && isSingleSelection() && (!props.showTime || props.hideOnDateTimeSelect) && !isUpdateViewDate) {
                setTimeout(() => {
                    hide('dateselect');

                    if (props.selectionMode !== 'single') {
                        reFocusInputField();
                    }
                }, 100);

                if (touchUIMask.current) {
                    disableModality();
                }
            }

            event.preventDefault();
        };

        const selectTime = (date, timeMeta) => {
            if (props.showTime) {
                let hours;
                let minutes;
                let seconds;
                let milliseconds;

                if (timeMeta) {
                    ({ hours, minutes, seconds, milliseconds } = timeMeta);
                } else {
                    let time = getCurrentDateTime();

                    [hours, minutes, seconds, milliseconds] = [time.getHours(), time.getMinutes(), props.showSeconds ? time.getSeconds() : 0, props.showMillisec ? time.getMilliseconds() : 0];
                }

                date.setHours(hours);
                date.setMinutes(doStepMinute(minutes));
                date.setSeconds(seconds);
                date.setMilliseconds(milliseconds);
            }
        };

        const selectDate = (event, dateMeta, timeMeta) => {
            let date = new Date(dateMeta.year, dateMeta.month, dateMeta.day);

            selectTime(date, timeMeta);

            if (props.minDate && props.minDate > date) {
                date = props.minDate;
            }

            if (props.maxDate && props.maxDate < date) {
                date = props.maxDate;
            }

            let selectedValues = date;

            if (isSingleSelection()) {
                updateModel(event, date);
            } else if (isMultipleSelection()) {
                selectedValues = props.value ? [...props.value, date] : [date];
                updateModel(event, selectedValues);
            } else if (isRangeSelection()) {
                const runComplexBranch31 = () => {
                    let startDate = props.value[0];
                    let endDate = props.value[1];

                    if (!endDate) {
                        if (date.getTime() >= startDate.getTime()) {
                            endDate = date;
                        } else {
                            endDate = startDate;
                            startDate = date;
                        }
                    } else {
                        startDate = date;
                        endDate = null;
                    }

                    selectedValues = [startDate, endDate];
                    updateModel(event, selectedValues);

                    if (props.hideOnRangeSelection && endDate !== null) {
                        setTimeout(() => {
                            setOverlayVisibleState(false);
                        }, 150);
                    }
                };

                if (props.value?.length) {
                    runComplexBranch31();
                } else {
                    selectedValues = [date, null];
                    updateModel(event, selectedValues);
                }
            }

            if (props.onSelect) {
                props.onSelect({
                    originalEvent: event,
                    value: date
                });
            }
        };

        const decrementDecade = () => {
            const _currentYear = currentYear - 10;

            setCurrentYear(_currentYear);

            return _currentYear;
        };

        const incrementDecade = () => {
            const _currentYear = currentYear + 10;

            setCurrentYear(_currentYear);

            return _currentYear;
        };

        const switchToMonthView = (event) => {
            if (event?.code && (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space')) {
                viewChangedWithKeyDown.current = true;
            }

            setCurrentView('month');
            event.preventDefault();
        };

        const switchToYearView = (event) => {
            if (event?.code && (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space')) {
                viewChangedWithKeyDown.current = true;
            }

            setCurrentView('year');
            event.preventDefault();
        };

        const onMonthSelect = (event, month) => {
            if (props.view === 'month') {
                const year = getViewYear();

                onDateSelect(event, {
                    year,
                    month: month,
                    day: 1,
                    selectable: true
                });
                event.preventDefault();
            } else {
                setCurrentMonth(month);
                createMonthsMeta(month, currentYear);
                const currentDate = cloneDate(getCurrentDateTime());

                currentDate.setDate(1); // #2948 always set to 1st of month
                currentDate.setMonth(month);
                currentDate.setYear(currentYear);
                setViewDateState(currentDate);
                setCurrentView('date');
                props.onMonthChange?.({
                    month: month + 1,
                    year: currentYear
                });
                updateViewDate(event, currentDate);
                onViewDateSelect({
                    event,
                    date: currentDate
                });
            }
        };

        const getViewYear = () => {
            return props.yearNavigator ? getViewDate().getFullYear() : currentYear;
        };

        const onYearSelect = (event, year) => {
            if (props.view === 'year') {
                onDateSelect(event, {
                    year: year,
                    month: 0,
                    day: 1,
                    selectable: true
                });
            } else {
                setCurrentYear(year);
                setCurrentView('month');
                props.onMonthChange?.({
                    month: currentMonth + 1,
                    year: year
                });
            }
        };

        const updateModel = (event, value) => {
            if (props.onChange) {
                const newValue = cloneDate(value);

                viewStateChanged.current = true;
                onChangeRef.current({
                    originalEvent: event,
                    value: newValue,
                    stopPropagation: () => {
                        event?.stopPropagation();
                    },
                    preventDefault: () => {
                        event?.preventDefault();
                    },
                    target: {
                        name: props.name,
                        id: props.id,
                        value: newValue
                    }
                });
            }
        };

        const show = (type) => {
            if (props.onVisibleChange) {
                props.onVisibleChange({
                    visible: true,
                    type
                });
            } else {
                setOverlayVisibleState(true);

                overlayEventListener.current = (e) => {
                    if (!isOutsideClicked(e) && visible) {
                        isOverlayClicked.current = true;
                    }
                };

                OverlayService.on('overlay-click', overlayEventListener.current);
            }
        };

        const hide = (type, callback) => {
            const _hideCallback = () => {
                viewStateChanged.current = false;
                ignoreFocusFunctionality.current = false;
                isOverlayClicked.current = false;
                callback?.();
                OverlayService.off('overlay-click', overlayEventListener.current);
                overlayEventListener.current = null;
            };

            props.touchUI && disableModality();

            if (props.onVisibleChange) {
                props.onVisibleChange({
                    visible: type !== 'dateselect',
                    // false only if selecting a value to close panel
                    type,
                    callback: _hideCallback
                });
            } else {
                setOverlayVisibleState(false);
                _hideCallback();
            }
        };

        const onOverlayEnter = () => {
            const styles = props.touchUI
                ? {
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                  }
                : resolveConditional(
                      !props.inline,
                      () => ({
                          position: 'absolute',
                          top: '0',
                          left: '0'
                      }),
                      () => undefined
                  );

            DomHandler.addStyles(overlayRef.current, styles);

            if (props.autoZIndex) {
                const key = props.touchUI ? 'modal' : 'overlay';

                ZIndexUtils.set(key, overlayRef.current, context?.autoZIndex || PrimeReactConfig.autoZIndex, props.baseZIndex || context?.zIndex[key] || PrimeReactConfig.zIndex[key]);
            }

            if (!props.touchUI && overlayRef?.current && inputRef?.current && !appendDisabled()) {
                let inputWidth = DomHandler.getOuterWidth(inputRef.current); // #5435 must have reasonable width if input is too small

                if (inputWidth < 220) {
                    inputWidth = 220;
                }

                if (props.view === 'date') {
                    overlayRef.current.style.width = DomHandler.getOuterWidth(overlayRef.current) + 'px';
                } else {
                    overlayRef.current.style.width = inputWidth + 'px';
                } // #5830 Tailwind does not need a min width it breaks the styling

                if (!isUnstyled()) {
                    overlayRef.current.style.minWidth = inputWidth + 'px';
                }
            }

            alignOverlay();
        };

        const onOverlayEntered = () => {
            bindOverlayListener();
            props.onShow?.();
            setFocusedState(false);
        };

        const onOverlayExit = () => {
            unbindOverlayListener();
        };

        const onOverlayExited = () => {
            ZIndexUtils.clear(overlayRef.current);
            props.onHide?.();
        };

        const appendDisabled = () => {
            const appendTo = props.appendTo || context?.appendTo || PrimeReactConfig.appendTo;

            return appendTo === 'self' || props.inline;
        };

        const alignOverlay = () => {
            if (props.touchUI) {
                enableModality();
            } else if (overlayRef?.current && inputRef?.current) {
                DomHandler.alignOverlay(overlayRef.current, inputRef.current, props.appendTo || context?.appendTo || PrimeReactConfig.appendTo);

                if (appendDisabled()) {
                    DomHandler.relativePosition(overlayRef.current, inputRef.current);
                } else {
                    DomHandler.absolutePosition(overlayRef.current, inputRef.current);
                }
            } // #6093 Forcibly remove minWidth when in unstyled mode

            if (isUnstyled()) {
                overlayRef.current.style.minWidth = '';
            }
        };

        const enableModality = () => {
            if (!touchUIMask.current) {
                touchUIMask.current = document.createElement('div');
                touchUIMask.current.style.zIndex = String(ZIndexUtils.get(overlayRef.current) - 1);
                !isUnstyled() && DomHandler.addMultipleClasses(touchUIMask.current, 'p-component-overlay p-datepicker-mask p-datepicker-mask-scrollblocker p-component-overlay-enter');

                touchUIMaskClickListener.current = () => {
                    disableModality();
                    hide();
                };

                touchUIMask.current.addEventListener('click', touchUIMaskClickListener.current);
                document.body.appendChild(touchUIMask.current);
                DomHandler.blockBodyScroll();
            }
        };

        const disableModality = () => {
            if (touchUIMask.current) {
                if (isUnstyled) {
                    destroyMask();
                } else {
                    !isUnstyled() && DomHandler.addClass(touchUIMask.current, 'p-component-overlay-leave');

                    if (DomHandler.hasCSSAnimation(touchUIMask.current) > 0) {
                        touchUIMask.current.addEventListener('animationend', () => {
                            destroyMask();
                        });
                    } else {
                        destroyMask();
                    }
                }
            }
        };

        const destroyMask = () => {
            if (touchUIMask.current) {
                touchUIMask.current.removeEventListener('click', touchUIMaskClickListener.current);
                touchUIMaskClickListener.current = null;
                touchUIMask.current.remove();
                touchUIMask.current = null;
            }

            let bodyChildren = document.body.children;
            let hasBlockerMasks;

            for (const _item of bodyChildren) {
                let bodyChild = _item;

                if (DomHandler.hasClass(bodyChild, 'p-datepicker-mask-scrollblocker')) {
                    hasBlockerMasks = true;
                    break;
                }
            }

            if (!hasBlockerMasks) {
                DomHandler.unblockBodyScroll();
            }
        };

        const isOutsideClicked = (event) => {
            return elementRef.current && !(elementRef.current.isSameNode(event.target) || isNavIconClicked(event.target) || elementRef.current.contains(event.target) || overlayRef.current?.contains(event.target));
        };

        const isNavIconClicked = (target) => {
            return (previousButton.current && (previousButton.current.isSameNode(target) || previousButton.current.contains(target))) || (nextButton.current && (nextButton.current.isSameNode(target) || nextButton.current.contains(target)));
        };

        const getFirstDayOfMonthIndex = (month, year) => {
            let day = new Date();

            day.setDate(1);
            day.setMonth(month);
            day.setFullYear(year);
            let dayIndex = day.getDay() + getSundayIndex();

            return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
        };

        const getDaysCountInMonth = (month, year) => {
            return 32 - daylightSavingAdjust(new Date(year, month, 32)).getDate();
        };

        const getDaysCountInPrevMonth = (month, year) => {
            let prev = getPreviousMonthAndYear(month, year);

            return getDaysCountInMonth(prev.month, prev.year);
        };

        const daylightSavingAdjust = (date) => {
            if (!date) {
                return null;
            }

            date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);

            return date;
        };

        const getPreviousMonthAndYear = (month, year) => {
            let m;
            let y;

            if (month === 0) {
                m = 11;
                y = year - 1;
            } else {
                m = month - 1;
                y = year;
            }

            return {
                month: m,
                year: y
            };
        };

        const getNextMonthAndYear = (month, year) => {
            let m;
            let y;

            if (month === 11) {
                m = 0;
                y = year + 1;
            } else {
                m = month + 1;
                y = year;
            }

            return {
                month: m,
                year: y
            };
        };

        const getSundayIndex = () => {
            const firstDayOfWeek = localeOption('firstDayOfWeek', props.locale);

            return firstDayOfWeek > 0 ? 7 - firstDayOfWeek : 0;
        };

        const createWeekDaysMeta = () => {
            let weekDays = [];
            let { firstDayOfWeek: dayIndex, dayNamesMin } = localeOptions(props.locale);

            for (let i = 0; i < 7; i++) {
                weekDays.push(dayNamesMin[dayIndex]);
                dayIndex = dayIndex === 6 ? 0 : ++dayIndex;
            }

            return weekDays;
        };

        const createMonthsMeta = (month, year) => {
            let months = [];

            for (let i = 0; i < props.numberOfMonths; i++) {
                let m = month + i;
                let y = year;

                if (m > 11) {
                    m = (m % 11) - 1;
                    y = year + 1;
                }

                months.push(createMonthMeta(m, y));
            }

            return months;
        };

        const createMonthMeta = (month, year) => {
            let dates = [];
            let firstDay = getFirstDayOfMonthIndex(month, year);
            let daysLength = getDaysCountInMonth(month, year);
            let prevMonthDaysLength = getDaysCountInPrevMonth(month, year);
            let dayNo = 1;
            let today = new Date();
            let weekNumbers = [];
            let monthRows = Math.ceil((daysLength + firstDay) / 7);

            for (let i = 0; i < monthRows; i++) {
                let week = [];

                const runComplexBranch33 = () => {
                    for (let j = prevMonthDaysLength - firstDay + 1; j <= prevMonthDaysLength; j++) {
                        let prev = getPreviousMonthAndYear(month, year);

                        week.push({
                            day: j,
                            month: prev.month,
                            year: prev.year,
                            otherMonth: true,
                            today: isToday(today, j, prev.month, prev.year),
                            selectable: isSelectable(j, prev.month, prev.year, true)
                        });
                    }

                    let remainingDaysLength = 7 - week.length;

                    for (let j = 0; j < remainingDaysLength; j++) {
                        week.push({
                            day: dayNo,
                            month: month,
                            year: year,
                            today: isToday(today, dayNo, month, year),
                            selectable: isSelectable(dayNo, month, year, false)
                        });
                        dayNo++;
                    }
                };

                const runComplexBranch34 = () => {
                    for (let j = 0; j < 7; j++) {
                        if (dayNo > daysLength) {
                            let next = getNextMonthAndYear(month, year);

                            week.push({
                                day: dayNo - daysLength,
                                month: next.month,
                                year: next.year,
                                otherMonth: true,
                                today: isToday(today, dayNo - daysLength, next.month, next.year),
                                selectable: isSelectable(dayNo - daysLength, next.month, next.year, true)
                            });
                        } else {
                            week.push({
                                day: dayNo,
                                month: month,
                                year: year,
                                today: isToday(today, dayNo, month, year),
                                selectable: isSelectable(dayNo, month, year, false)
                            });
                        }

                        dayNo++;
                    }
                };

                if (i === 0) {
                    runComplexBranch33();
                } else {
                    runComplexBranch34();
                }

                if (props.showWeek) {
                    weekNumbers.push(getWeekNumber(new Date(week[0].year, week[0].month, week[0].day)));
                }

                dates.push(week);
            }

            return {
                month: month,
                year: year,
                dates: dates,
                weekNumbers: weekNumbers
            };
        };

        const getWeekNumber = (date) => {
            let checkDate = cloneDate(date);

            checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
            let time = checkDate.getTime();

            checkDate.setMonth(0);
            checkDate.setDate(1);

            return Math.floor(Math.round((time - checkDate.getTime()) / 86400000) / 7) + 1;
        };

        const isSelectable = (day, month, year, otherMonth) => {
            let validMin = true;
            let validMax = true;
            let validDate = true;
            let validDay = true;
            let validMonth = true;

            const runComplexBranch35 = () => {
                if (props.minDate.getFullYear() > year) {
                    validMin = false;
                } else if (props.minDate.getFullYear() === year) {
                    if (month > -1 && props.minDate.getMonth() > month) {
                        validMin = false;
                    } else if (month > -1 && props.minDate.getMonth() === month) {
                        if (day > 0 && props.minDate.getDate() > day) {
                            validMin = false;
                        }
                    }
                }
            };

            if (props.minDate) {
                runComplexBranch35();
            }

            const runComplexBranch36 = () => {
                if (props.maxDate.getFullYear() < year) {
                    validMax = false;
                } else if (props.maxDate.getFullYear() === year) {
                    if (month > -1 && props.maxDate.getMonth() < month) {
                        validMax = false;
                    } else if (month > -1 && props.maxDate.getMonth() === month) {
                        if (day > 0 && props.maxDate.getDate() < day) {
                            validMax = false;
                        }
                    }
                }
            };

            if (props.maxDate) {
                runComplexBranch36();
            }

            if (props.disabledDates || props.enabledDates || props.disabledDays) {
                validDay = !isDayDisabled(day, month, year);
            }

            if (props.selectOtherMonths === false && otherMonth) {
                validMonth = false;
            }

            return validMin && validMax && validDate && validDay && validMonth;
        };

        const isSelectableTime = (value) => {
            let validMin = true;
            let validMax = true;

            const runComplexBranch37 = () => {
                if (props.minDate.getHours() > value.getHours()) {
                    validMin = false;
                } else if (props.minDate.getHours() === value.getHours()) {
                    if (props.minDate.getMinutes() > value.getMinutes()) {
                        validMin = false;
                    } else if (props.minDate.getMinutes() === value.getMinutes()) {
                        const runComplexBranch1 = () => {
                            if (props.minDate.getSeconds() > value.getSeconds()) {
                                validMin = false;
                            } else if (props.minDate.getSeconds() === value.getSeconds()) {
                                if (!props.showMillisec || props.minDate.getMilliseconds() > value.getMilliseconds()) {
                                    validMin = false;
                                }
                            }
                        };

                        if (props.showSeconds) {
                            runComplexBranch1();
                        }
                    }
                }
            };

            if (props.minDate && props.minDate.toDateString() === value.toDateString()) {
                runComplexBranch37();
            }

            const runComplexBranch39 = () => {
                if (props.maxDate.getHours() < value.getHours()) {
                    validMax = false;
                } else if (props.maxDate.getHours() === value.getHours()) {
                    if (props.maxDate.getMinutes() < value.getMinutes()) {
                        validMax = false;
                    } else if (props.maxDate.getMinutes() === value.getMinutes()) {
                        const runComplexBranch2 = () => {
                            if (props.maxDate.getSeconds() < value.getSeconds()) {
                                validMax = false;
                            } else if (props.maxDate.getSeconds() === value.getSeconds()) {
                                if (!props.showMillisec || props.maxDate.getMilliseconds() < value.getMilliseconds()) {
                                    validMax = false;
                                }
                            }
                        };

                        if (props.showSeconds) {
                            runComplexBranch2();
                        }
                    }
                }
            };

            if (props.maxDate && props.maxDate.toDateString() === value.toDateString()) {
                runComplexBranch39();
            }

            return validMin && validMax;
        };

        const isSelected = (dateMeta) => {
            if (!props.value) return false;
            if (isSingleSelection()) return isDateEquals(props.value, dateMeta);
            if (isMultipleSelection()) return props.value.some((date) => isDateEquals(date, dateMeta));
            if (!isRangeSelection()) return false;

            const [startDate, endDate] = props.value;

            if (!endDate) return isDateEquals(startDate, dateMeta);

            return isDateEquals(startDate, dateMeta) || isDateEquals(endDate, dateMeta) || isDateBetween(startDate, endDate, dateMeta);
        };

        const isComparable = () => {
            return props.value != null && typeof props.value !== 'string';
        };

        const isMonthSelected = (month) => {
            if (!isComparable()) return false;
            if (isMultipleSelection()) return props.value.some((value) => value.getMonth() === month && value.getFullYear() === currentYear);
            if (!isRangeSelection()) return props.value.getMonth() === month && props.value.getFullYear() === currentYear;

            const [start, end] = props.value;
            const currentDate = new Date(currentYear, month, 1);
            const startDate = new Date(start.getFullYear(), start.getMonth(), 1);

            if (!end) return currentDate.getTime() === startDate.getTime();

            const endDate = new Date(end.getFullYear(), end.getMonth(), 1);

            return currentDate >= startDate && currentDate <= endDate;
        };

        const isYearSelected = (year) => {
            if (!isComparable()) return false;

            if (isMultipleSelection()) {
                return props.value.some((v) => v.getFullYear() === year);
            } else if (isRangeSelection()) {
                const start = props.value[0] ? props.value[0].getFullYear() : null;
                const end = props.value[1] ? props.value[1].getFullYear() : null;

                return start === year || end === year || (start < year && end > year);
            } else {
                return props.value.getFullYear() === year;
            }
        };

        const switchViewButtonDisabled = () => {
            return props.numberOfMonths > 1 || props.disabled;
        };

        const isDateEquals = (value, dateMeta) => {
            if (value && value instanceof Date) {
                return value.getDate() === dateMeta.day && value.getMonth() === dateMeta.month && value.getFullYear() === dateMeta.year;
            }

            return false;
        };

        const isDateBetween = (start, end, dateMeta) => {
            let between = false;

            if (start && end) {
                let date = new Date(dateMeta.year, dateMeta.month, dateMeta.day);

                return start.getTime() <= date.getTime() && end.getTime() >= date.getTime();
            }

            return between;
        };

        const isSingleSelection = () => {
            return props.selectionMode === 'single';
        };

        const isRangeSelection = () => {
            return props.selectionMode === 'range';
        };

        const isMultipleSelection = () => {
            return props.selectionMode === 'multiple';
        };

        const isToday = (today, day, month, year) => {
            return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        };

        const isDayDisabled = (day, month, year) => {
            let isDisabled = false; // first check for disabled dates

            if (props.disabledDates) {
                if (props.disabledDates.some((d) => d.getFullYear() === year && d.getMonth() === month && d.getDate() === day)) {
                    isDisabled = true;
                }
            } // next if not disabled then check for disabled days

            if (!isDisabled && props.disabledDays && currentView === 'date') {
                let weekday = new Date(year, month, day);
                let weekdayNumber = weekday.getDay();

                if (props.disabledDays.includes(weekdayNumber)) {
                    isDisabled = true;
                }
            } // last check for enabled dates to force dates enabled

            if (props.enabledDates) {
                const isEnabled = props.enabledDates.some((d) => d.getFullYear() === year && d.getMonth() === month && d.getDate() === day);

                if (isEnabled) {
                    isDisabled = false;
                } else if (!props.disabledDays && !props.disabledDates) {
                    // disable other dates when only enabledDates are present
                    isDisabled = true;
                }
            }

            return isDisabled;
        };

        const isMonthYearDisabled = (month, year) => {
            const daysCountInAllMonth = month === -1 ? new Array(12).fill(0).map((_, i) => getDaysCountInMonth(i, year)) : [getDaysCountInMonth(month, year)];

            for (let i = 0; i < daysCountInAllMonth.length; i++) {
                const monthDays = daysCountInAllMonth[i];
                const _month = month === -1 ? i : month;

                for (let day = 1; day <= monthDays; day++) {
                    let isDateSelectable = isSelectable(day, _month, year);

                    if (isDateSelectable) {
                        return false;
                    }
                }
            }

            return true;
        };

        const formatInputDateValue = (value) => {
            if (isValidDate(value)) {
                return formatDateTime(value);
            }

            return props.keepInvalid ? value : '';
        };

        const updateInputfield = (value) => {
            if (!inputRef.current) {
                return;
            }

            let formattedValue = '';

            const runComplexBranch41 = () => {
                try {
                    const runComplexBranch3 = () => {
                        formattedValue = formatInputDateValue(value);
                    };

                    if (isSingleSelection()) {
                        runComplexBranch3();
                    } else if (isMultipleSelection()) {
                        const runComplexBranch1 = (i) => {
                            let selectedValue = value[i];
                            let dateAsString = isValidDate(selectedValue) ? formatDateTime(selectedValue) : '';

                            formattedValue = formattedValue + dateAsString;

                            if (i !== value.length - 1) {
                                formattedValue = formattedValue + ', ';
                            }
                        };

                        for (let i = 0; i < value.length; i++) {
                            runComplexBranch1(i);
                        }
                    } else if (isRangeSelection()) {
                        const runComplexBranch4 = () => {
                            let startDate = value[0];
                            let endDate = value[1];

                            formattedValue = isValidDate(startDate) ? formatDateTime(startDate) : '';

                            if (endDate) {
                                formattedValue = formattedValue + (isValidDate(endDate) ? ' - ' + formatDateTime(endDate) : '');
                            }
                        };

                        if (value?.length) {
                            runComplexBranch4();
                        }
                    }
                } catch (err) {
                    if (!err) throw err;
                    formattedValue = value;
                }
            };

            if (value) {
                runComplexBranch41();
            }

            inputRef.current.value = formattedValue;
        };

        updateInputfieldRef.current = updateInputfield;

        const formatDateTime = (date) => {
            if (props.formatDateTime) {
                return props.formatDateTime(date);
            }

            let formattedValue = null;

            if (date) {
                if (props.timeOnly) {
                    formattedValue = formatTime(date);
                } else {
                    formattedValue = formatDate(date, getDateFormat());

                    if (props.showTime) {
                        formattedValue = formattedValue + (' ' + formatTime(date));
                    }
                }
            }

            return formattedValue;
        };

        const formatDate = (date, format) => {
            if (!date) {
                return '';
            }

            let iFormat;

            const lookAhead = (match) => {
                const matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;

                if (matches) {
                    iFormat++;
                }

                return matches;
            };

            const formatNumber = (match, value, len) => {
                let num = '' + value;

                if (lookAhead(match)) {
                    while (num.length < len) {
                        num = '0' + num;
                    }
                }

                return num;
            };

            const formatName = (match, value, shortNames, longNames) => {
                return lookAhead(match) ? longNames[value] : shortNames[value];
            };

            let output = '';
            let literal = false;
            const { dayNamesShort, dayNames, monthNamesShort, monthNames } = localeOptions(props.locale);

            if (date) {
                for (iFormat = 0; iFormat < format.length; iFormat++) {
                    const runComplexBranch45 = () => {
                        if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
                            literal = false;
                        } else {
                            output = output + format.charAt(iFormat);
                        }
                    };

                    if (literal) {
                        runComplexBranch45();
                    } else {
                        const handleComplexCase1 = () => {
                            output =
                                output +
                                (lookAhead('y')
                                    ? date.getFullYear()
                                    : resolveConditional(
                                          date.getFullYear() % 100 < 10,
                                          () => '0',
                                          () => ''
                                      ) +
                                      (date.getFullYear() % 100));
                        };

                        const handleComplexCase2 = () => {
                            if (lookAhead("'")) {
                                output = output + "'";
                            } else {
                                literal = true;
                            }
                        };

                        switch (format.charAt(iFormat)) {
                            case 'd':
                                output = output + formatNumber('d', date.getDate(), 2);
                                break;
                            case 'D':
                                output = output + formatName('D', date.getDay(), dayNamesShort, dayNames);
                                break;
                            case 'o':
                                output = output + formatNumber('o', Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
                                break;
                            case 'm':
                                output = output + formatNumber('m', date.getMonth() + 1, 2);
                                break;
                            case 'M':
                                output = output + formatName('M', date.getMonth(), monthNamesShort, monthNames);
                                break;
                            case 'y':
                                handleComplexCase1();
                                break;
                            case '@':
                                output = output + date.getTime();
                                break;
                            case '!':
                                output = output + (date.getTime() * 10000 + ticksTo1970);
                                break;
                            case "'":
                                handleComplexCase2();
                                break;
                            default:
                                output = output + format.charAt(iFormat);
                        }
                    }
                }
            }

            return output;
        };

        const formatTime = (date) => {
            if (!date) {
                return '';
            }

            let output = '';
            let hours = date.getHours();
            let minutes = date.getMinutes();
            let seconds = date.getSeconds();
            let milliseconds = date.getMilliseconds();

            if (props.hourFormat === '12' && hours > 11 && hours !== 12) {
                hours = hours - 12;
            }

            const runComplexBranch46 = () => {
                output =
                    output +
                    (hours === 0
                        ? 12
                        : resolveConditional(
                              hours < 10,
                              () => '0' + hours,
                              () => hours
                          ));
            };

            const runComplexBranch47 = () => {
                output = output + (hours < 10 ? '0' + hours : hours);
            };

            if (props.hourFormat === '12') {
                runComplexBranch46();
            } else {
                runComplexBranch47();
            }

            output = output + ':';
            output = output + (minutes < 10 ? '0' + minutes : minutes);

            const runComplexBranch48 = () => {
                output = output + ':';
                output = output + (seconds < 10 ? '0' + seconds : seconds);
            };

            if (props.showSeconds) {
                runComplexBranch48();
            }

            const runComplexBranch49 = () => {
                output = output + '.';
                output =
                    output +
                    (milliseconds < 100
                        ? resolveConditional(
                              milliseconds < 10,
                              () => '00',
                              () => '0'
                          ) + milliseconds
                        : milliseconds);
            };

            if (props.showMillisec) {
                runComplexBranch49();
            }

            const runComplexBranch50 = () => {
                output = output + (date.getHours() > 11 ? ' PM' : ' AM');
            };

            if (props.hourFormat === '12') {
                runComplexBranch50();
            }

            return output;
        };

        const parseValueFromString = (text) => {
            if (!text || text.trim().length === 0) {
                return null;
            }

            let value;

            if (isSingleSelection()) {
                value = parseDateTime(text);
            } else if (isMultipleSelection()) {
                let tokens = text.split(',');

                value = [];

                for (let token of tokens) {
                    value.push(parseDateTime(token.trim()));
                }
            } else if (isRangeSelection()) {
                let tokens = text.split(' - ');

                value = [];

                for (let i = 0; i < tokens.length; i++) {
                    value[i] = parseDateTime(tokens[i].trim());
                }
            }

            return value;
        };

        const parseTimeOnly = (text) => {
            const date = new Date();
            const match = text.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)\s?(AM|PM)?/i);

            if (!match) return null;

            populateTime(date, match[1], match[2]);

            return date;
        };

        const parseDateWithTime = (text) => {
            const timePattern = props.hourFormat === '12' ? /(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)\s?(AM|PM)/i : /(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)$/;
            const match = text.match(timePattern);

            if (!match) return parseDate(text, getDateFormat());

            const datePart = text.replace(timePattern, '').trim();

            if (!datePart) return parseDate(text, getDateFormat());

            const date = parseDate(datePart, getDateFormat());

            populateTime(date, match[1], match[2]);

            return date;
        };

        const parseDateTime = (text) => {
            if (props.parseDateTime) {
                return props.parseDateTime(text);
            }

            if (props.timeOnly) return parseTimeOnly(text);
            if (props.showTime) return parseDateWithTime(text);

            return parseDate(text, getDateFormat());
        };

        const populateTime = (value, timeString, ampm) => {
            if (props.hourFormat === '12' && ampm !== 'PM' && ampm !== 'AM') {
                throw new Error('Invalid Time');
            }

            let time = parseTime(timeString, ampm);

            value.setHours(time.hour);
            value.setMinutes(time.minute);
            value.setSeconds(time.second);
            value.setMilliseconds(time.millisecond);
        };

        const parseTime = (value, ampm) => {
            value = props.showMillisec ? value.replace('.', ':') : value;
            let tokens = value.split(':');
            let validTokenLength = props.showSeconds ? 3 : 2;

            validTokenLength = props.showMillisec ? validTokenLength + 1 : validTokenLength;

            if (tokens.length !== validTokenLength || tokens[0].length !== 2 || tokens[1].length !== 2 || (props.showSeconds && tokens[2].length !== 2) || (props.showMillisec && tokens[3].length !== 3)) {
                throw new Error('Invalid time');
            }

            let h = Number.parseInt(tokens[0], 10);
            let m = Number.parseInt(tokens[1], 10);
            let s = props.showSeconds ? Number.parseInt(tokens[2], 10) : null;
            let ms = props.showMillisec ? Number.parseInt(tokens[3], 10) : null;

            if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59 || (props.hourFormat === '12' && h > 12) || (props.showSeconds && (Number.isNaN(s) || s > 59)) || (props.showMillisec && (Number.isNaN(ms) || ms > 999))) {
                throw new Error('Invalid time');
            } else {
                const runComplexBranch51 = () => {
                    if (h !== 12 && ampm === 'PM') {
                        h = h + 12;
                    }

                    if (h === 12 && ampm === 'AM') {
                        h = h - 12;
                    }
                };

                if (props.hourFormat === '12') {
                    runComplexBranch51();
                }

                return {
                    hour: h,
                    minute: m,
                    second: s,
                    millisecond: ms
                };
            }
        }; // Ported from jquery-ui datepicker parseDate

        const parseDate = (value, format) => {
            if (format == null || value == null) {
                throw new Error('Invalid arguments');
            }

            value = typeof value === 'object' ? value.toString() : value + '';

            if (value === '') {
                return null;
            }

            let iFormat;
            let dim;
            let extra;
            let iValue = 0;
            let shortYearCutoff = typeof props.shortYearCutoff !== 'string' ? props.shortYearCutoff : (new Date().getFullYear() % 100) + Number.parseInt(props.shortYearCutoff, 10);
            let year = -1;
            let month = -1;
            let day = -1;
            let doy = -1;
            let literal = false;
            let date;

            let lookAhead = (match) => {
                let matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;

                if (matches) {
                    iFormat++;
                }

                return matches;
            };

            let getNumber = (match) => {
                let isDoubled = lookAhead(match);
                let size =
                    match === '@'
                        ? 14
                        : resolveConditional(
                              match === '!',
                              () => 20,
                              () => resolveConditional(match === 'y' && isDoubled, handleSonarNested1.bind(null), handleSonarNested2.bind(null, match))
                          );
                let minSize = match === 'y' ? size : 1;
                let digits = new RegExp(String.raw`^\d{${minSize},${size}}`);
                let num = value.substring(iValue).match(digits);

                if (!num) {
                    throw new Error('Missing number at position ' + iValue);
                }

                iValue = iValue + num[0].length;

                return Number.parseInt(num[0], 10);
            };

            let getName = (match, shortNames, longNames) => {
                let index = -1;
                let arr = lookAhead(match) ? longNames : shortNames;
                let names = [];

                for (let i = 0; i < arr.length; i++) {
                    names.push([i, arr[i]]);
                }

                names.sort((a, b) => {
                    return -(a[1].length - b[1].length);
                });

                for (const _item2 of names) {
                    let name = _item2[1];

                    if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
                        index = _item2[0];
                        iValue = iValue + name.length;
                        break;
                    }
                }

                if (index !== -1) {
                    return index + 1;
                }

                throw new Error('Unknown name at position ' + iValue);
            };

            let checkLiteral = () => {
                if (value.charAt(iValue) !== format.charAt(iFormat)) {
                    throw new Error('Unexpected literal at position ' + iValue);
                }

                iValue++;
            };

            if (props.view === 'month') {
                day = 1;
            }

            if (props.view === 'year') {
                day = 1;
                month = 1;
            }

            const { dayNamesShort, dayNames, monthNamesShort, monthNames } = localeOptions(props.locale);

            const readFormat = () => {
                for (iFormat = 0; iFormat < format.length; iFormat++) {
                    if (literal) {
                        if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
                            literal = false;
                        } else {
                            checkLiteral();
                        }

                        continue;
                    }

                    switch (format.charAt(iFormat)) {
                        case 'd':
                            day = getNumber('d');
                            break;
                        case 'D':
                            getName('D', dayNamesShort, dayNames);
                            break;
                        case 'o':
                            doy = getNumber('o');
                            break;
                        case 'm':
                            month = getNumber('m');
                            break;
                        case 'M':
                            month = getName('M', monthNamesShort, monthNames);
                            break;
                        case 'y':
                            year = getNumber('y');
                            break;
                        case '@':
                            date = new Date(getNumber('@'));
                            year = date.getFullYear();
                            month = date.getMonth() + 1;
                            day = date.getDate();
                            break;
                        case '!':
                            date = new Date((getNumber('!') - ticksTo1970) / 10000);
                            year = date.getFullYear();
                            month = date.getMonth() + 1;
                            day = date.getDate();
                            break;
                        case "'":
                            if (lookAhead("'")) {
                                checkLiteral();
                            } else {
                                literal = true;
                            }

                            break;
                        default:
                            checkLiteral();
                    }
                }
            };

            readFormat();

            const runComplexBranch53 = () => {
                extra = value.substr(iValue);

                if (!/^\s+/.test(extra)) {
                    throw new Error('Extra/unparsed characters found in date: ' + extra);
                }
            };

            if (iValue < value.length) {
                runComplexBranch53();
            }

            const resolveYear = () => {
                if (year === -1) {
                    return new Date().getFullYear();
                }

                if (year >= 100) {
                    return year;
                }

                const currentYear = new Date().getFullYear();
                const centuryOffset = year <= shortYearCutoff ? 0 : -100;

                return year + (currentYear - (currentYear % 100) + centuryOffset);
            };

            const resolveDayOfYear = () => {
                if (doy < 0) {
                    return;
                }

                month = 1;
                day = doy;

                do {
                    dim = getDaysCountInMonth(year, month - 1);

                    if (day <= dim) {
                        break;
                    }

                    month++;
                    day -= dim;
                } while (true);
            };

            year = resolveYear();
            resolveDayOfYear();
            date = daylightSavingAdjust(new Date(year, month - 1, day));
            const evaluateComplexCondition1 = () => date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day;

            if (evaluateComplexCondition1()) {
                throw new Error('Invalid date'); // E.g. 31/02/00
            }

            return date;
        };

        const isInMinYear = (viewDate) => {
            return props.minDate && props.minDate.getFullYear() === viewDate.getFullYear();
        };

        const isInMaxYear = (viewDate) => {
            return props.maxDate && props.maxDate.getFullYear() === viewDate.getFullYear();
        };

        React.useEffect(() => {
            ObjectUtils.combinedRefs(inputRef, props.inputRef);
        }, [inputRef, props.inputRef]);
        React.useEffect(() => {
            if (props.value !== previousValue) {
                updateInputfieldRef.current?.(props.value);
            }
        }, [props.value, previousValue]);
        useMountEffect(() => {
            let viewDate = getViewDate(props.viewDate);

            validateDate(viewDate);
            setViewDateState(viewDate);
            setCurrentMonth(viewDate.getMonth());
            setCurrentYear(viewDate.getFullYear());
            setCurrentView(props.view);

            if (!idState) {
                const uniqueId = UniqueComponentId();

                !idState && setIdState(uniqueId);
            }

            if (props.inline) {
                overlayRef?.current.setAttribute(attributeSelector, '');

                if (!props.disabled) {
                    initFocusableCell();

                    if (props.numberOfMonths === 1) {
                        overlayRef.current.style.width = DomHandler.getOuterWidth(overlayRef.current) + 'px';
                    }
                }
            } else {
                alignOverlay();
            }

            if (props.value) {
                updateInputfield(props.value);
                setValue(props.value);
            }

            if (props.autoFocus) {
                // delay showing until rendered so `alignPanel()` method aligns the popup in the right location
                setTimeout(() => DomHandler.focus(inputRef.current, props.autoFocus), 200);
            }
        });
        React.useEffect(() => {
            // see https://github.com/primefaces/primereact/issues/4030
            onChangeRef.current = props.onChange;
        }, [props.onChange]);
        React.useEffect(() => {
            let unbindMaskEvents = null;

            if (props.mask) {
                unbindMaskEvents = mask(inputRef.current, {
                    mask: props.mask,
                    slotChar: props.maskSlotChar,
                    readOnly: props.readOnlyInput || props.disabled,
                    onChange: (e) => {
                        updateValueOnInput(e.originalEvent, e.value, () => {
                            return false;
                        });
                    },
                    onBlur: (e) => {
                        updateValueOnInput(e, e.target.value);
                    }
                }).unbindEvents;
            }

            return () => {
                props.mask && unbindMaskEvents?.();
            }; // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [props.disabled, props.mask, props.readOnlyInput]);
        useUpdateEffect(() => {
            if (viewChangedWithKeyDown.current) {
                setCurrentView(props.view);
            }

            viewChangedWithKeyDown.current = false;
        }, [props.view]);
        useUpdateEffect(() => {
            if (visible && !props.inline) {
                focusToFirstCell();
            }
        }, [visible, currentView, props.inline]);
        useUpdateEffect(() => {
            if (!props.onViewDateChange && !viewStateChanged.current) {
                setValue(props.value);
            }

            if (props.viewDate) {
                const date = getViewDate(props.viewDate);

                updateViewDate(null, date);
                onViewDateSelect({
                    event: null,
                    date
                });
            }
        }, [props.onViewDateChange, props.value, props.viewDate]);
        useUpdateEffect(() => {
            if (overlayVisibleState || props.visible) {
                // Github #5529
                setTimeout(() => {
                    alignOverlay();
                });
            }
        }, [currentView, overlayVisibleState, props.visible]);
        useUpdateEffect(() => {
            const newDate = props.value;

            if (previousValue !== newDate) {
                const isInputFocused = document.activeElement === inputRef.current; // Do not update value in input if user types something in it:

                if (!isInputFocused) {
                    updateInputfield(newDate);
                } // #3516 view date not updated when value set programatically

                if (!newDate) return;
                let viewDate = newDate;

                const runComplexBranch54 = () => {
                    if (newDate.length) {
                        viewDate = newDate[newDate.length - 1];
                    }
                };

                if (isMultipleSelection()) {
                    runComplexBranch54();
                } else if (isRangeSelection()) {
                    if (newDate.length) {
                        let startDate = newDate[0];
                        let endDate = newDate[1];

                        viewDate = endDate || startDate;
                    }
                }

                if (viewDate instanceof Date) {
                    validateDate(viewDate);
                    setViewDateState(viewDate);
                    setCurrentMonth(viewDate.getMonth());
                    setCurrentYear(viewDate.getFullYear());
                }
            }
        }, [props.value, visible]);
        useUpdateEffect(() => {
            updateInputfield(props.value);
        }, [props.dateFormat, props.hourFormat, props.timeOnly, props.showSeconds, props.showMillisec, props.showTime, props.locale]);
        useUpdateEffect(() => {
            if (overlayRef.current) {
                setNavigationState(viewDateState);
                updateFocus();
            }
        });
        useUnmountEffect(() => {
            if (touchUIMask.current) {
                disableModality();
                touchUIMask.current = null;
            }

            ZIndexUtils.clear(overlayRef.current);
        });
        React.useImperativeHandle(ref, () => ({
            props,
            show,
            hide,
            getCurrentDateTime,
            getViewDate,
            updateViewDate,
            focus: () => DomHandler.focus(inputRef.current),
            getElement: () => elementRef.current,
            getOverlay: () => overlayRef.current,
            getInput: () => inputRef.current
        }));

        const setValue = (propValue) => {
            if (Array.isArray(propValue)) {
                propValue = propValue[0];
            }

            let prevPropValue = previousValue;

            if (Array.isArray(prevPropValue)) {
                prevPropValue = prevPropValue[0];
            }

            let viewDate =
                props.viewDate && isValidDate(props.viewDate)
                    ? props.viewDate
                    : resolveConditional(
                          propValue && isValidDate(propValue),
                          () => propValue,
                          () => new Date()
                      );

            if (isClearClicked.current && props.showTime) {
                viewDate.setHours(0, 0, 0);
                isClearClicked.current = false;
            }

            if ((!prevPropValue && propValue) || (propValue && propValue instanceof Date && prevPropValue instanceof Date && propValue.getTime() !== prevPropValue.getTime())) {
                validateDate(viewDate);
            }

            setViewDateState(viewDate);
            viewStateChanged.current = true;
        };

        const createBackwardNavigator = (isVisible) => {
            const navigatorProps = isVisible
                ? {
                      onClick: onPrevButtonClick,
                      onKeyDown: (e) => onContainerButtonKeydown(e)
                  }
                : {
                      style: {
                          visibility: 'hidden'
                      }
                  };
            const previousIconProps = mergeProps(
                {
                    className: cx('previousIcon')
                },
                ptm('previousIcon')
            );
            const icon = props.prevIcon || <ChevronLeftIcon {...previousIconProps} />;
            const backwardNavigatorIcon = IconUtils.getJSXIcon(
                icon,
                {
                    ...previousIconProps
                },
                {
                    props
                }
            );
            const { prevDecade, prevYear, prevMonth } = localeOptions(props.locale);
            const previousButtonLabel =
                currentView === 'year'
                    ? prevDecade
                    : resolveConditional(
                          currentView === 'month',
                          () => prevYear,
                          () => prevMonth
                      );
            const previousButtonProps = mergeProps(
                {
                    type: 'button',
                    className: cx('previousButton'),
                    'aria-label': previousButtonLabel,
                    ...navigatorProps
                },
                ptm('previousButton')
            );

            return (
                <button ref={previousButton} {...previousButtonProps}>
                    {backwardNavigatorIcon}
                    <Ripple />
                </button>
            );
        };

        const createForwardNavigator = (isVisible) => {
            const navigatorProps = isVisible
                ? {
                      onClick: onNextButtonClick,
                      onKeyDown: (e) => onContainerButtonKeydown(e)
                  }
                : {
                      style: {
                          visibility: 'hidden'
                      }
                  };
            const nextIconProps = mergeProps(
                {
                    className: cx('nextIcon')
                },
                ptm('nextIcon')
            );
            const icon = props.nextIcon || <ChevronRightIcon {...nextIconProps} />;
            const forwardNavigatorIcon = IconUtils.getJSXIcon(
                icon,
                {
                    ...nextIconProps
                },
                {
                    props
                }
            );
            const { nextDecade, nextYear, nextMonth } = localeOptions(props.locale);
            const nextButtonLabel =
                currentView === 'year'
                    ? nextDecade
                    : resolveConditional(
                          currentView === 'month',
                          () => nextYear,
                          () => nextMonth
                      );
            const nextButtonProps = mergeProps(
                {
                    type: 'button',
                    className: cx('nextButton'),
                    'aria-label': nextButtonLabel,
                    ...navigatorProps
                },
                ptm('nextButton')
            );

            return (
                <button ref={nextButton} {...nextButtonProps}>
                    {forwardNavigatorIcon}
                    <Ripple />
                </button>
            );
        };

        const renderMonthsNavigator = (index) => {
            return props.monthNavigator && props.view !== 'month' && (props.numberOfMonths === 1 || index === 0);
        };

        const createTitleMonthElement = (month, monthIndex) => {
            const monthNames = localeOption('monthNames', props.locale);

            if (renderMonthsNavigator(monthIndex)) {
                const viewDate = getViewDate();
                const viewMonth = viewDate.getMonth();
                const displayedMonthOptions = monthNames
                    .map((month, index) =>
                        (!isInMinYear(viewDate) || index >= props.minDate.getMonth()) && (!isInMaxYear(viewDate) || index <= props.maxDate.getMonth())
                            ? {
                                  label: month,
                                  value: index,
                                  index
                              }
                            : null
                    )
                    .filter((option) => !!option);
                const displayedMonthNames = displayedMonthOptions.map((option) => option.label);
                const selectProps = mergeProps(
                    {
                        className: cx('select'),
                        onChange: (e) => onMonthDropdownChange(e, e.target.value),
                        value: viewMonth
                    },
                    ptm('select')
                );
                const content = (
                    <select {...selectProps}>
                        {displayedMonthOptions.map((option) => {
                            const optionProps = mergeProps(
                                {
                                    value: option.value
                                },
                                ptm('option')
                            );

                            return (
                                <option {...optionProps} key={option.label}>
                                    {option.label}
                                </option>
                            );
                        })}
                    </select>
                );

                if (props.monthNavigatorTemplate) {
                    const defaultContentOptions = {
                        onChange: onMonthDropdownChange,
                        className: 'p-datepicker-month',
                        value: viewMonth,
                        names: displayedMonthNames,
                        options: displayedMonthOptions,
                        element: content,
                        props
                    };

                    return ObjectUtils.getJSXElement(props.monthNavigatorTemplate, defaultContentOptions);
                }

                return content;
            }

            const monthTitleProps = mergeProps(
                {
                    className: cx('monthTitle'),
                    onKeyDown: onContainerButtonKeydown,
                    'aria-label': localeOption('chooseMonth', props.locale),
                    onClick: switchToMonthView,
                    disabled: switchViewButtonDisabled()
                },
                ptm('monthTitle')
            );

            return currentView === 'date' && <button {...monthTitleProps}>{monthNames[month]}</button>;
        };

        const createTitleYearElement = (metaYear) => {
            const viewDate = getViewDate();
            const viewYear = viewDate.getFullYear();
            const displayYear = props.numberOfMonths > 1 || props.yearNavigator ? metaYear : currentYear;

            if (props.yearNavigator) {
                let yearOptions = [];

                if (props.yearRange) {
                    const years = props.yearRange.split(':');
                    const yearStart = Number.parseInt(years[0], 10);
                    const yearEnd = Number.parseInt(years[1], 10);

                    for (let i = yearStart; i <= yearEnd; i++) {
                        yearOptions.push(i);
                    }
                } else {
                    const base = viewYear - (viewYear % 10);

                    for (let i = 0; i < 10; i++) {
                        yearOptions.push(base + i);
                    }
                }

                const displayedYearNames = yearOptions.filter((year) => !(props.minDate && props.minDate.getFullYear() > year) && !(props.maxDate && props.maxDate.getFullYear() < year));
                const selectProps = mergeProps(
                    {
                        className: cx('select'),
                        onChange: (e) => onYearDropdownChange(e, e.target.value),
                        value: displayYear
                    },
                    ptm('select')
                );
                const content = (
                    <select {...selectProps}>
                        {displayedYearNames.map((year) => {
                            const optionProps = mergeProps(
                                {
                                    value: year
                                },
                                ptm('option')
                            );

                            return (
                                <option {...optionProps} key={year}>
                                    {year}
                                </option>
                            );
                        })}
                    </select>
                );

                if (props.yearNavigatorTemplate) {
                    const options = displayedYearNames.map((name, i) => ({
                        label: name,
                        value: name,
                        index: i
                    }));
                    const defaultContentOptions = {
                        onChange: onYearDropdownChange,
                        className: 'p-datepicker-year',
                        value: viewYear,
                        names: displayedYearNames,
                        options,
                        element: content,
                        props
                    };

                    return ObjectUtils.getJSXElement(props.yearNavigatorTemplate, defaultContentOptions);
                }

                return content;
            }

            const yearTitleProps = mergeProps(
                {
                    className: cx('yearTitle'),
                    'aria-label': localeOption('chooseYear', props.locale),
                    onClick: (e) => switchToYearView(e),
                    disabled: switchViewButtonDisabled()
                },
                ptm('yearTitle')
            );

            return currentView !== 'year' && <button {...yearTitleProps}>{displayYear}</button>;
        };

        const createTitleDecadeElement = () => {
            const years = yearPickerValues();
            const decadeTitleProps = mergeProps(
                {
                    className: cx('decadeTitle')
                },
                ptm('decadeTitle')
            );

            if (currentView === 'year') {
                const decadeTitleTextProps = mergeProps(ptm('decadeTitleText'));

                return <span {...decadeTitleProps}>{props.decadeTemplate ? props.decadeTemplate(years) : <span {...decadeTitleTextProps}>{`${yearPickerValues()[0]} - ${yearPickerValues()[yearPickerValues().length - 1]}`}</span>}</span>;
            }

            return null;
        };

        const createTitle = (monthMetaData, index) => {
            const month = createTitleMonthElement(monthMetaData.month, index);
            const year = createTitleYearElement(monthMetaData.year);
            const decade = createTitleDecadeElement();
            const titleProps = mergeProps(
                {
                    className: cx('title')
                },
                ptm('title')
            );
            const showMonthAfterYear = localeOption('showMonthAfterYear', props.locale);

            return (
                <div {...titleProps}>
                    {showMonthAfterYear ? year : month}
                    {showMonthAfterYear ? month : year}
                    {decade}
                </div>
            );
        };

        const createDayNames = (weekDays) => {
            const weekDayProps = mergeProps(ptm('weekDay'));
            const tableHeaderCellProps = mergeProps(
                {
                    scope: 'col'
                },
                ptm('tableHeaderCell')
            );
            const dayNames = weekDays.map((weekDay, index) => (
                <th {...tableHeaderCellProps} key={weekDay?.id ?? weekDay?.key ?? weekDay?.name ?? weekDay?.label ?? weekDay?.value ?? weekDay?.href ?? weekDay?.src ?? weekDay?.field ?? JSON.stringify(weekDay)}>
                    <span {...weekDayProps}>{weekDay}</span>
                </th>
            ));

            if (props.showWeek) {
                const weekHeaderProps = mergeProps(
                    {
                        scope: 'col',
                        className: cx('weekHeader'),
                        'data-p-disabled': props.showWeek
                    },
                    ptm('weekHeader', {
                        context: {
                            disabled: props.showWeek
                        }
                    })
                );
                const weekLabel = mergeProps(ptm('weekLabel'));
                const weekHeader = (
                    <th {...weekHeaderProps} key="wn">
                        <span {...weekLabel}>{localeOption('weekHeader', props.locale)}</span>
                    </th>
                );

                return [weekHeader, ...dayNames];
            }

            return dayNames;
        };

        const createDateCellContent = (date, className, groupIndex) => {
            const content = props.dateTemplate ? props.dateTemplate(date) : date.day;
            const selected = isSelected(date);
            const dayLabelProps = mergeProps(
                {
                    className: cx('dayLabel', {
                        className
                    }),
                    'aria-selected': selected,
                    'aria-disabled': !date.selectable,
                    onMouseDown: (e) => e.preventDefault(),
                    onClick: (e) => onDateSelect(e, date),
                    onKeyDown: (e) => onDateCellKeydown(e, date, groupIndex),
                    'data-p-highlight': selected,
                    'data-p-disabled': !date.selectable
                },
                ptm('dayLabel', {
                    context: {
                        selected: selected,
                        disabled: !date.selectable
                    }
                })
            );

            return (
                <span {...dayLabelProps}>
                    {content}
                    {selected && <div aria-live="polite" className="p-hidden-accessible" data-p-hidden-accessible={true} {...ptm('hiddenSelectedDay')} />}
                </span>
            );
        };

        const createWeek = (weekDates, weekNumber, groupIndex) => {
            const week = weekDates.map((date) => {
                const selected = isSelected(date);
                const dateClassName = classNames({
                    'p-highlight': selected,
                    'p-disabled': !date.selectable
                });
                const content = date.otherMonth && !props.showOtherMonths ? null : createDateCellContent(date, dateClassName, groupIndex);
                const formattedValue = formatDate(new Date(date.year, date.month, date.day), getDateFormat());
                const dayProps = mergeProps(
                    {
                        className: cx('day', {
                            date
                        }),
                        'aria-label': formattedValue,
                        'data-p-today': date.today,
                        'data-p-other-month': date.otherMonth,
                        'data-p-day': date.day,
                        'data-p-month': date.month,
                        'data-p-year': date.year
                    },
                    ptm('day', {
                        context: {
                            date,
                            today: date.today,
                            otherMonth: date.otherMonth
                        }
                    })
                );

                return (
                    <td {...dayProps} key={date.day}>
                        {content}
                    </td>
                );
            });

            if (props.showWeek) {
                const weekNumberProps = mergeProps(
                    {
                        className: cx('weekNumber')
                    },
                    ptm('weekNumber')
                );
                const weekLabelContainerProps = mergeProps(
                    {
                        className: cx('weekLabelContainer'),
                        'data-p-disabled': props.showWeek
                    },
                    ptm('weekLabelContainer', {
                        context: {
                            disabled: props.showWeek
                        }
                    })
                );
                const weekNumberCell = (
                    <td {...weekNumberProps} key={'wn' + weekNumber}>
                        <span {...weekLabelContainerProps}>{weekNumber}</span>
                    </td>
                );

                return [weekNumberCell, ...week];
            }

            return week;
        };

        const createDates = (monthMetaData, groupIndex) => {
            const tableBodyRowProps = mergeProps(ptm('tableBodyRowProps'));

            return monthMetaData.dates.map((weekDates, index) => (
                <tr {...tableBodyRowProps} key={weekDates?.id ?? weekDates?.key ?? weekDates?.name ?? weekDates?.label ?? weekDates?.value ?? weekDates?.href ?? weekDates?.src ?? weekDates?.field ?? JSON.stringify(weekDates)}>
                    {createWeek(weekDates, monthMetaData.weekNumbers[index], groupIndex)}
                </tr>
            ));
        };

        const createDateViewGrid = (monthMetaData, weekDays, groupIndex) => {
            const dayNames = createDayNames(weekDays);
            const dates = createDates(monthMetaData, groupIndex);
            const containerProps = mergeProps(
                {
                    className: cx('container')
                },
                ptm('container')
            );
            const tableProps = mergeProps(
                {
                    role: 'grid',
                    className: cx('table')
                },
                ptm('table')
            );
            const tableHeaderProps = mergeProps(ptm('tableHeader'));
            const tableHeaderRowProps = mergeProps(ptm('tableHeaderRow'));
            const tableBodyProps = mergeProps(ptm('tableBody'));

            return (
                currentView === 'date' && (
                    <div {...containerProps} key={UniqueComponentId('calendar_container_')}>
                        <table {...tableProps}>
                            <thead {...tableHeaderProps}>
                                <tr {...tableHeaderRowProps}>{dayNames}</tr>
                            </thead>
                            <tbody {...tableBodyProps}>{dates}</tbody>
                        </table>
                    </div>
                )
            );
        };

        const createMonth = (monthMetaData, index) => {
            const weekDays = createWeekDaysMeta();
            const backwardNavigator = createBackwardNavigator(index === 0);
            const forwardNavigator = createForwardNavigator(props.numberOfMonths === 1 || index === props.numberOfMonths - 1);
            const title = createTitle(monthMetaData, index);
            const dateViewGrid = createDateViewGrid(monthMetaData, weekDays, index);
            const header = props.headerTemplate ? props.headerTemplate() : null;
            const monthKey = monthMetaData.month + '-' + monthMetaData.year;
            const groupProps = mergeProps(
                {
                    className: cx('group')
                },
                ptm('group')
            );
            const headerProps = mergeProps(
                {
                    className: cx('header')
                },
                ptm('header')
            );

            return (
                <div {...groupProps} key={monthKey}>
                    <div {...headerProps} key={index}>
                        {header}
                        {backwardNavigator}
                        {title}
                        {forwardNavigator}
                    </div>
                    {dateViewGrid}
                </div>
            );
        };

        const createMonths = (monthsMetaData) => {
            const groups = monthsMetaData.map(createMonth);
            const groupContainerProps = mergeProps(
                {
                    className: cx('groupContainer')
                },
                ptm('groupContainer')
            );

            return <div {...groupContainerProps}>{groups}</div>;
        };

        const createDateView = () => {
            const viewDate = getViewDate();
            const monthsMetaData = createMonthsMeta(viewDate.getMonth(), viewDate.getFullYear());
            const months = createMonths(monthsMetaData);

            return months;
        };

        const monthPickerValues = () => {
            let monthPickerValues = [];
            const monthNamesShort = localeOption('monthNamesShort', props.locale);

            for (let i = 0; i <= 11; i++) {
                monthPickerValues.push(monthNamesShort[i]);
            }

            return monthPickerValues;
        };

        const yearPickerValues = () => {
            let yearPickerValues = [];
            let base = currentYear - (currentYear % 10);

            for (let i = 0; i < 10; i++) {
                yearPickerValues.push(base + i);
            }

            return yearPickerValues;
        };

        const createMonthYearView = () => {
            const backwardNavigator = createBackwardNavigator(true);
            const forwardNavigator = createForwardNavigator(true);
            const yearElement = createTitleYearElement(getViewDate().getFullYear());
            const decade = createTitleDecadeElement();
            const groupContainerProps = mergeProps(
                {
                    className: cx('groupContainer')
                },
                ptm('groupContainer')
            );
            const groupProps = mergeProps(
                {
                    className: cx('group')
                },
                ptm('group')
            );
            const headerProps = mergeProps(
                {
                    className: cx('header')
                },
                ptm('header')
            );
            const titleProps = mergeProps(
                {
                    className: cx('title')
                },
                ptm('title')
            );

            return (
                <div {...groupContainerProps}>
                    <div {...groupProps}>
                        <div {...headerProps}>
                            {backwardNavigator}
                            <div {...titleProps}>
                                {yearElement}
                                {decade}
                            </div>
                            {forwardNavigator}
                        </div>
                    </div>
                </div>
            );
        };

        const createDatePicker = () => {
            if (!props.timeOnly) {
                if (props.view === 'date') {
                    return createDateView();
                }

                return createMonthYearView();
            }

            return null;
        };

        const incrementIconProps = mergeProps(ptm('incrementIcon'));
        const decrementIconProps = mergeProps(ptm('decrementIcon'));
        const incrementIcon = IconUtils.getJSXIcon(
            props.incrementIcon || <ChevronUpIcon {...incrementIconProps} />,
            {
                ...incrementIconProps
            },
            {
                props
            }
        );
        const decrementIcon = IconUtils.getJSXIcon(
            props.decrementIcon || <ChevronDownIcon {...decrementIconProps} />,
            {
                ...decrementIconProps
            },
            {
                props
            }
        );

        const createHourPicker = () => {
            const currentTime = getCurrentDateTime();
            const minute = doStepMinute(currentTime.getMinutes());
            let hour = currentTime.getHours(); // #3770 account for step minutes rolling to next hour

            hour = minute > 59 ? hour + 1 : hour;

            if (props.hourFormat === '12') {
                if (hour === 0) {
                    hour = 12;
                } else if (hour > 11 && hour !== 12) {
                    hour = hour - 12;
                }
            }

            const hourProps = mergeProps(ptm('hour'));
            const { nextHour, prevHour } = localeOptions(props.locale);
            const hourDisplay = hour < 10 ? '0' + hour : hour;
            const hourPickerProps = mergeProps(
                {
                    className: cx('hourPicker')
                },
                ptm('hourPicker')
            );
            const incrementButtonProps = mergeProps(
                {
                    type: 'button',
                    className: cx('incrementButton'),
                    'aria-label': nextHour,
                    onMouseDown: (e) => onTimePickerElementMouseDown(e, 0, 1),
                    onMouseUp: onTimePickerElementMouseUp,
                    onMouseLeave: onTimePickerElementMouseLeave,
                    onKeyDown: (e) => onPickerKeyDown(e, 0, 1),
                    onKeyUp: onPickerKeyUp
                },
                ptm('incrementButton')
            );
            const decrementButtonProps = mergeProps(
                {
                    type: 'button',
                    className: cx('decrementButton'),
                    'aria-label': prevHour,
                    onMouseDown: (e) => onTimePickerElementMouseDown(e, 0, -1),
                    onMouseUp: onTimePickerElementMouseUp,
                    onMouseLeave: onTimePickerElementMouseLeave,
                    onKeyDown: (e) => onPickerKeyDown(e, 0, -1),
                    onKeyUp: onPickerKeyUp
                },
                ptm('decrementButton')
            );

            return (
                <div {...hourPickerProps}>
                    <button {...incrementButtonProps}>
                        {incrementIcon}
                        <Ripple />
                    </button>
                    <span {...hourProps}>{hourDisplay}</span>
                    <button {...decrementButtonProps}>
                        {decrementIcon}
                        <Ripple />
                    </button>
                </div>
            );
        };

        const createMinutePicker = () => {
            const currentTime = getCurrentDateTime();
            let minute = doStepMinute(currentTime.getMinutes());

            minute = minute > 59 ? minute - 60 : minute;
            const minuteProps = mergeProps(ptm('minute'));
            const { nextMinute, prevMinute } = localeOptions(props.locale);
            const minuteDisplay = minute < 10 ? '0' + minute : minute;
            const minutePickerProps = mergeProps(
                {
                    className: cx('minutePicker')
                },
                ptm('minutePicker')
            );
            const incrementButtonProps = mergeProps(
                {
                    type: 'button',
                    className: cx('incrementButton'),
                    'aria-label': nextMinute,
                    onMouseDown: (e) => onTimePickerElementMouseDown(e, 1, 1),
                    onMouseUp: onTimePickerElementMouseUp,
                    onMouseLeave: onTimePickerElementMouseLeave,
                    onKeyDown: (e) => onPickerKeyDown(e, 1, 1),
                    onKeyUp: onPickerKeyUp
                },
                ptm('incrementButton')
            );
            const decrementButtonProps = mergeProps(
                {
                    type: 'button',
                    className: cx('decrementButton'),
                    'aria-label': prevMinute,
                    onMouseDown: (e) => onTimePickerElementMouseDown(e, 1, -1),
                    onMouseUp: onTimePickerElementMouseUp,
                    onMouseLeave: onTimePickerElementMouseLeave,
                    onKeyDown: (e) => onPickerKeyDown(e, 1, -1),
                    onKeyUp: onPickerKeyUp
                },
                ptm('decrementButton')
            );

            return (
                <div {...minutePickerProps}>
                    <button {...incrementButtonProps}>
                        {incrementIcon}
                        <Ripple />
                    </button>
                    <span {...minuteProps}>{minuteDisplay}</span>
                    <button {...decrementButtonProps}>
                        {decrementIcon}
                        <Ripple />
                    </button>
                </div>
            );
        };

        const createSecondPicker = () => {
            if (props.showSeconds) {
                const currentTime = getCurrentDateTime();
                const { nextSecond, prevSecond } = localeOptions(props.locale);
                const secondProps = mergeProps(ptm('second'));
                const second = currentTime.getSeconds();
                const secondDisplay = second < 10 ? '0' + second : second;
                const secondPickerProps = mergeProps(
                    {
                        className: cx('secondPicker')
                    },
                    ptm('secondPicker')
                );
                const incrementButtonProps = mergeProps(
                    {
                        type: 'button',
                        className: cx('incrementButton'),
                        'aria-label': nextSecond,
                        onMouseDown: (e) => onTimePickerElementMouseDown(e, 2, 1),
                        onMouseUp: onTimePickerElementMouseUp,
                        onMouseLeave: onTimePickerElementMouseLeave,
                        onKeyDown: (e) => onPickerKeyDown(e, 2, 1),
                        onKeyUp: onPickerKeyUp
                    },
                    ptm('incrementButton')
                );
                const decrementButtonProps = mergeProps(
                    {
                        type: 'button',
                        className: cx('decrementButton'),
                        'aria-label': prevSecond,
                        onMouseDown: (e) => onTimePickerElementMouseDown(e, 2, -1),
                        onMouseUp: onTimePickerElementMouseUp,
                        onMouseLeave: onTimePickerElementMouseLeave,
                        onKeyDown: (e) => onPickerKeyDown(e, 2, -1),
                        onKeyUp: onPickerKeyUp
                    },
                    ptm('decrementButton')
                );

                return (
                    <div {...secondPickerProps}>
                        <button {...incrementButtonProps}>
                            {incrementIcon}
                            <Ripple />
                        </button>
                        <span {...secondProps}>{secondDisplay}</span>
                        <button {...decrementButtonProps}>
                            {decrementIcon}
                            <Ripple />
                        </button>
                    </div>
                );
            }

            return null;
        };

        const createMiliSecondPicker = () => {
            if (props.showMillisec) {
                const currentTime = getCurrentDateTime();
                const { nextMilliSecond, prevMilliSecond } = localeOptions(props.locale);
                const millisecondProps = mergeProps(ptm('millisecond'));
                const millisecond = currentTime.getMilliseconds();
                const millisecondDisplay =
                    millisecond < 100
                        ? resolveConditional(
                              millisecond < 10,
                              () => '00',
                              () => '0'
                          ) + millisecond
                        : millisecond;
                const millisecondPickerProps = mergeProps(
                    {
                        className: cx('millisecondPicker')
                    },
                    ptm('millisecondPicker')
                );
                const incrementButtonProps = mergeProps(
                    {
                        type: 'button',
                        className: cx('incrementButton'),
                        'aria-label': nextMilliSecond,
                        onMouseDown: (e) => onTimePickerElementMouseDown(e, 3, 1),
                        onMouseUp: onTimePickerElementMouseUp,
                        onMouseLeave: onTimePickerElementMouseLeave,
                        onKeyDown: (e) => onPickerKeyDown(e, 3, 1),
                        onKeyUp: onPickerKeyUp
                    },
                    ptm('incrementButton')
                );
                const decrementButtonProps = mergeProps(
                    {
                        type: 'button',
                        className: cx('decrementButton'),
                        'aria-label': prevMilliSecond,
                        onMouseDown: (e) => onTimePickerElementMouseDown(e, 3, -1),
                        onMouseUp: onTimePickerElementMouseUp,
                        onMouseLeave: onTimePickerElementMouseLeave,
                        onKeyDown: (e) => onPickerKeyDown(e, 3, -1),
                        onKeyUp: onPickerKeyUp
                    },
                    ptm('decrementButton')
                );

                return (
                    <div {...millisecondPickerProps}>
                        <button {...incrementButtonProps}>
                            {incrementIcon}
                            <Ripple />
                        </button>
                        <span {...millisecondProps}>{millisecondDisplay}</span>
                        <button {...decrementButtonProps}>
                            {decrementIcon}
                            <Ripple />
                        </button>
                    </div>
                );
            }

            return null;
        };

        const createAmPmPicker = () => {
            if (props.hourFormat === '12') {
                const currentTime = getCurrentDateTime();
                const { am, pm } = localeOptions(props.locale);
                const hour = currentTime.getHours();
                const display = hour > 11 ? 'PM' : 'AM';
                const ampmProps = mergeProps(ptm('ampm'));
                const ampmPickerProps = mergeProps(
                    {
                        className: cx('ampmPicker')
                    },
                    ptm('ampmPicker')
                );
                const incrementButtonProps = mergeProps(
                    {
                        type: 'button',
                        className: cx('incrementButton'),
                        'aria-label': am,
                        onClick: (e) => toggleAmPm(e)
                    },
                    ptm('incrementButton')
                );
                const decrementButtonProps = mergeProps(
                    {
                        type: 'button',
                        className: cx('decrementButton'),
                        'aria-label': pm,
                        onClick: (e) => toggleAmPm(e)
                    },
                    ptm('decrementButton')
                );

                return (
                    <div {...ampmPickerProps}>
                        <button {...incrementButtonProps}>
                            {incrementIcon}
                            <Ripple />
                        </button>
                        <span {...ampmProps}>{display}</span>
                        <button {...decrementButtonProps}>
                            {decrementIcon}
                            <Ripple />
                        </button>
                    </div>
                );
            }

            return null;
        };

        const createSeparator = (separator) => {
            const separatorContainerProps = mergeProps(
                {
                    className: cx('separatorContainer')
                },
                ptm('separatorContainer')
            );
            const separatorProps = mergeProps(ptm('separator'));

            return (
                <div {...separatorContainerProps}>
                    <span {...separatorProps}>{separator}</span>
                </div>
            );
        };

        const createTimePicker = () => {
            if ((props.showTime || props.timeOnly) && currentView === 'date') {
                const timePickerProps = mergeProps(
                    {
                        className: cx('timePicker')
                    },
                    ptm('timePicker')
                );

                return (
                    <div {...timePickerProps}>
                        {createHourPicker()}
                        {createSeparator(':')}
                        {createMinutePicker()}
                        {props.showSeconds && createSeparator(':')}
                        {createSecondPicker()}
                        {props.showMillisec && createSeparator('.')}
                        {createMiliSecondPicker()}
                        {props.hourFormat === '12' && createSeparator(':')}
                        {createAmPmPicker()}
                    </div>
                );
            }

            return null;
        };

        const createInputElement = () => {
            if (!props.inline) {
                return (
                    <InputText
                        ref={inputRef}
                        id={props.inputId}
                        name={props.name}
                        type="text"
                        role="combobox"
                        className={classNames(
                            props.inputClassName,
                            cx('input', {
                                context
                            })
                        )}
                        style={props.inputStyle}
                        readOnly={props.readOnlyInput}
                        disabled={props.disabled}
                        required={props.required}
                        autoComplete="off"
                        placeholder={props.placeholder}
                        tabIndex={props.tabIndex}
                        onClick={onInputClick}
                        onInput={onUserInput}
                        onFocus={onInputFocus}
                        onBlur={onInputBlur}
                        onKeyDown={onInputKeyDown}
                        aria-expanded={overlayVisibleState}
                        aria-autocomplete="none"
                        aria-haspopup="dialog"
                        aria-controls={panelId}
                        aria-labelledby={props.ariaLabelledBy}
                        aria-label={props.ariaLabel}
                        inputMode={props.inputMode}
                        tooltip={props.tooltip}
                        tooltipOptions={props.tooltipOptions}
                        pt={ptm('input')}
                        unstyled={props.unstyled}
                        __parentMetadata={{
                            parent: metaData
                        }}
                    />
                );
            }

            return null;
        };

        const createButton = () => {
            if (props.showIcon) {
                return (
                    <Button
                        type="button"
                        icon={props.icon || <CalendarIcon />}
                        onClick={onButtonClick}
                        tabIndex="-1"
                        disabled={props.disabled}
                        aria-haspopup="dialog"
                        aria-label={localeOption('chooseDate', props.locale)}
                        aria-expanded={overlayVisibleState}
                        aria-controls={panelId}
                        className={cx('dropdownButton')}
                        pt={ptm('dropdownButton')}
                        __parentMetadata={{
                            parent: metaData
                        }}
                    />
                );
            }

            return null;
        };

        const createContent = () => {
            const input = createInputElement();
            const button = createButton();

            if (props.iconPos === 'left') {
                return (
                    <>
                        {button}
                        {input}
                    </>
                );
            }

            return (
                <>
                    {input}
                    {button}
                </>
            );
        };

        const isPastMaxDateWithBuffer = (bufferInSeconds = 10) => {
            const now = new Date();
            const maxDate = props.maxDate;

            return maxDate < now && Math.abs((now.getTime() - maxDate.getTime()) / 1000) > bufferInSeconds;
        };

        const createButtonBar = () => {
            if (props.showButtonBar) {
                const { today, clear, now } = localeOptions(props.locale);
                const nowDate = new Date();
                const isHidden = (props.minDate && props.minDate > nowDate) || (props.maxDate && isPastMaxDateWithBuffer());
                const buttonbarProps = mergeProps(
                    {
                        className: cx('buttonbar')
                    },
                    ptm('buttonbar')
                );

                return (
                    <div {...buttonbarProps}>
                        <Button
                            type="button"
                            label={props.showTime ? now : today}
                            onClick={onTodayButtonClick}
                            onKeyDown={(e) => onContainerButtonKeydown(e)}
                            className={classNames(props.todayButtonClassName, cx('todayButton'))}
                            pt={ptm('todayButton')}
                            style={
                                isHidden
                                    ? {
                                          visibility: 'hidden'
                                      }
                                    : undefined
                            }
                        />

                        <Button type="button" label={clear} onClick={onClearButtonClick} onKeyDown={(e) => onContainerButtonKeydown(e)} className={classNames(props.clearButtonClassName, cx('clearButton'))} pt={ptm('clearButton')} />
                    </div>
                );
            }

            return null;
        };

        const createFooter = () => {
            if (props.footerTemplate) {
                const content = props.footerTemplate();
                const footerProps = mergeProps(
                    {
                        className: cx('footer')
                    },
                    ptm('footer')
                );

                return <div {...footerProps}>{content}</div>;
            }

            return null;
        };

        const createMonthPicker = () => {
            if (currentView === 'month') {
                const monthPickerProps = mergeProps(
                    {
                        className: cx('monthPicker')
                    },
                    ptm('monthPicker')
                );

                return (
                    <div {...monthPickerProps}>
                        {monthPickerValues().map((m, i) => {
                            const selected = isMonthSelected(i);
                            const monthProps = mergeProps(
                                {
                                    className: cx('month', {
                                        isMonthSelected,
                                        isMonthYearDisabled,
                                        i,
                                        currentYear
                                    }),
                                    onClick: (event) => onMonthSelect(event, i),
                                    onKeyDown: (event) => onMonthCellKeydown(event, i),
                                    'data-p-disabled': isMonthYearDisabled(i, currentYear),
                                    'data-p-highlight': selected
                                },
                                ptm('month', {
                                    context: {
                                        month: m,
                                        monthIndex: i,
                                        selected: selected,
                                        disabled: isMonthYearDisabled(i, currentYear)
                                    }
                                })
                            );

                            return (
                                <span {...monthProps} key={m?.id ?? m?.key ?? m?.name ?? m?.label ?? m?.value ?? m?.href ?? m?.src ?? m?.field ?? JSON.stringify(m)}>
                                    {m}
                                    {selected && (
                                        <div aria-live="polite" className="p-hidden-accessible" data-p-hidden-accessible={true} {...ptm('hiddenMonth')}>
                                            {m}
                                        </div>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                );
            }

            return null;
        };

        const createYearPicker = () => {
            if (currentView === 'year') {
                const yearPickerProps = mergeProps(
                    {
                        className: cx('yearPicker')
                    },
                    ptm('yearPicker')
                );

                return (
                    <div {...yearPickerProps}>
                        {yearPickerValues().map((y, i) => {
                            const selected = isYearSelected(y);
                            const yearProps = mergeProps(
                                {
                                    className: cx('year', {
                                        isYearSelected,
                                        isMonthYearDisabled,
                                        y
                                    }),
                                    onClick: (event) => onYearSelect(event, y),
                                    onKeyDown: (event) => onYearCellKeydown(event, y),
                                    'data-p-highlight': isYearSelected(y),
                                    'data-p-disabled': isMonthYearDisabled(-1, y)
                                },
                                ptm('year', {
                                    context: {
                                        year: y,
                                        yearIndex: i,
                                        selected,
                                        disabled: isMonthYearDisabled(-1, y)
                                    }
                                })
                            );

                            return (
                                <span {...yearProps} key={y?.id ?? y?.key ?? y?.name ?? y?.label ?? y?.value ?? y?.href ?? y?.src ?? y?.field ?? JSON.stringify(y)}>
                                    {y}
                                    {selected && (
                                        <div aria-live="polite" className="p-hidden-accessible" data-p-hidden-accessible={true} {...ptm('hiddenYear')}>
                                            {y}
                                        </div>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                );
            }

            return null;
        };

        const panelClassName = classNames('p-datepicker p-component', props.panelClassName, {
            'p-datepicker-inline': props.inline,
            'p-disabled': props.disabled,
            'p-datepicker-timeonly': props.timeOnly,
            'p-datepicker-multiple-month': props.numberOfMonths > 1,
            'p-datepicker-monthpicker': currentView === 'month',
            'p-datepicker-touch-ui': props.touchUI,
            'p-input-filled': context?.inputStyle === 'filled' || PrimeReactConfig.inputStyle === 'filled',
            'p-ripple-disabled': context?.ripple === false || PrimeReactConfig.ripple === false
        });
        const content = createContent();
        const datePicker = createDatePicker();
        const timePicker = createTimePicker();
        const buttonBar = createButtonBar();
        const footer = createFooter();
        const monthPicker = createMonthPicker();
        const yearPicker = createYearPicker();
        const isFilled = DomHandler.hasClass(inputRef.current, 'p-filled') && inputRef.current.value !== '';
        const rootProps = mergeProps(
            {
                id: props.id,
                className: classNames(
                    props.className,
                    cx('root', {
                        focusedState,
                        isFilled,
                        panelVisible: visible
                    })
                ),
                style: props.style
            },
            CalendarBase.getOtherProps(props),
            ptm('root')
        );

        return (
            <span ref={elementRef} {...rootProps}>
                {content}
                <CalendarPanel
                    hostName="Calendar"
                    id={panelId}
                    locale={props.locale}
                    ref={overlayRef}
                    className={panelClassName}
                    style={props.panelStyle}
                    appendTo={props.appendTo}
                    inline={props.inline}
                    onClick={onPanelClick}
                    onMouseUp={onPanelMouseUp}
                    in={visible}
                    onEnter={onOverlayEnter}
                    onEntered={onOverlayEntered}
                    onExit={onOverlayExit}
                    onExited={onOverlayExited}
                    transitionOptions={props.transitionOptions}
                    ptm={ptm}
                    cx={cx}
                >
                    {datePicker}
                    {timePicker}
                    {monthPicker}
                    {yearPicker}
                    {buttonBar}
                    {footer}
                </CalendarPanel>
            </span>
        );
    })
);
Calendar.displayName = 'Calendar';
