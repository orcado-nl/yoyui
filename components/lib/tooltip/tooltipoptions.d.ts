/**
 *
 * This module contains the common options and events of Tooltip.
 *
 * @module tooltipoptions
 *
 */
import * as React from 'react';
import { PassThroughOptions } from '../passthrough';
import { TooltipPassThroughOptions } from './tooltip';

/**
 * Custom tooltip event
 * @event
 */
interface TooltipEvent {
    /**
     * Browser event
     */
    originalEvent: React.SyntheticEvent;
    /**
     * Target element.
     * @defaultValue current target
     */
    target: HTMLElement;
}

/**
 * Defines valid properties of TooltipOptions.
 * @group Model
 */
export interface TooltipOptions {
    /**
     * DOM element instance where the overlay panel should be mounted. Valid values are any DOM Element and 'self'. The self value is used to render a component where it is located.
     * @defaultValue document.body
     */
    appendTo?: 'self' | HTMLElement | null | undefined | (() => HTMLElement);
    /**
     * Defines which position on the target element to align the positioned tooltip.
     */
    at?: string | undefined;
    /**
     * Whether to hide tooltip when hovering over tooltip content.
     * @defaultValue true
     */
    autoHide?: boolean | undefined;
    /**
     * Whether to automatically manage layering.
     * @defaultValue true
     */
    autoZIndex?: boolean | undefined;
    /**
     * Base zIndex value to use in layering.
     * @defaultValue 0
     */
    baseZIndex?: number | undefined;
    /**
     * Style class of the tooltip.
     */
    className?: string | undefined;
    /**
     * Specifies if pressing escape key should hide the tooltip.
     * @defaultValue false
     */
    closeOnEscape?: boolean | undefined;
    /**
     * When present, it specifies that the tooltip should be hidden.
     * @defaultValue false
     */
    disabled?: boolean | undefined;
    /**
     * Event to show the tooltip.
     * @defaultValue hover
     */
    event?: 'hover' | 'focus' | 'both' | undefined;
    /**
     * Delay to hide the tooltip in milliseconds.
     * @defaultValue 0
     */
    hideDelay?: number | undefined;
    /**
     * Event to hide the tooltip if the event property is empty.
     * @defaultValue mouseleave
     */
    hideEvent?: string | undefined;
    /**
     * Whether the tooltip will follow the mouse.
     * @defaultValue false
     */
    mouseTrack?: boolean | undefined;
    /**
     * Defines left position of the tooltip in relation to the mouse when the mouseTrack is enabled.
     * @defaultValue 5
     */
    mouseTrackLeft?: number | undefined;
    /**
     * Defines top position of the tooltip in relation to the mouse when the mouseTrack is enabled.
     * @defaultValue 5
     */
    mouseTrackTop?: number | undefined;
    /**
     * Defines which position on the tooltip being positioned to align with the target element.
     */
    my?: string | undefined;
    /**
     * Position of the tooltip.
     * @defaultValue right
     */
    position?: 'top' | 'bottom' | 'left' | 'right' | 'mouse' | undefined;
    /**
     * Delay to show the tooltip in milliseconds.
     * @defaultValue 0
     */
    showDelay?: number | undefined;
    /**
     * Event to show the tooltip if the event property is empty.
     * @defaultValue mouseenter
     */
    showEvent?: string | undefined;
    /**
     * Whether to show tooltip for disabled elements.
     * @defaultValue false
     */
    showOnDisabled?: boolean | undefined;
    /**
     * Style of the tooltip.
     */
    style?: React.CSSProperties | undefined;
    /**
     * Delay to update the tooltip in milliseconds.
     * @defaultValue 0
     */
    updateDelay?: number | undefined;
    /**
     * Uses to pass attributes to DOM elements inside the component.
     */
    pt?: TooltipPassThroughOptions;
    /**
     * Used to configure passthrough(pt) options of the component.
     * @type {PassThroughOptions}
     */
    ptOptions?: PassThroughOptions;
    /**
     * When enabled, it removes component related styles in the core.
     * @defaultValue false
     */
    unstyled?: boolean;
    /**
     * Callback to invoke before the tooltip is shown.
     * @param {TooltipEvent} event - Browser event
     */
    onBeforeShow?(event: TooltipEvent): void;
    /**
     * Callback to invoke before the tooltip is hidden.
     * @param {TooltipEvent} event - Browser event
     */
    onBeforeHide?(event: TooltipEvent): void;
    /**
     * Callback to invoke when the tooltip is shown.
     * @param {TooltipEvent} event - Browser event
     */
    onShow?(event: TooltipEvent): void;
    /**
     * Callback to invoke when the tooltip is hidden.
     * @param {TooltipEvent} event - Browser event
     */
    onHide?(event: TooltipEvent): void;
}

/**
 * In addition to React.HTMLAttributes, the following attributes can be used on any HTMLElement if the page has a YoYui {@link tooltip} component.
 * @group Model
 */

interface TooltipHTMLAttributes {
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Content of the tooltip.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltip.TooltipProps.content}
     */
    'data-pr-tooltip'?: string | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * When present, it specifies that the tooltip should be hidden.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.disabled}
     * @defaultValue false
     */
    'data-pr-disabled'?: boolean | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Style class of the tooltip.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.className}
     */
    'data-pr-classname'?: string | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Position of the tooltip.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.position}
     * @defaultValue right
     */
    'data-pr-position'?: 'top' | 'bottom' | 'left' | 'right' | 'mouse' | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Defines which position on the tooltip being positioned to align with the target element.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.my}
     */
    'data-pr-my'?: string | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Defines which position on the target element to align the positioned tooltip.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.at}
     */
    'data-pr-at'?: string | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Event to show the tooltip.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.event}
     * @defaultValue hover
     */
    'data-pr-event'?: 'hover' | 'focus' | 'both' | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Event to show the tooltip if the event property is empty.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.showEvent}
     * @defaultValue mouseenter
     */
    'data-pr-showevent'?: string | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Event to hide the tooltip if the event property is empty.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.hideEvent}
     * @defaultValue mouseleave
     */
    'data-pr-hideevent'?: string | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Whether the tooltip will follow the mouse.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.mouseTrack}
     * @defaultValue false
     */
    'data-pr-mousetrack'?: boolean | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Defines top position of the tooltip in relation to the mouse when the mouseTrack is enabled.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.mouseTrackTop}
     * @defaultValue 5
     */
    'data-pr-mousetracktop'?: number | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Defines left position of the tooltip in relation to the mouse when the mouseTrack is enabled.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.mouseTrackLeft}
     * @defaultValue 5
     */
    'data-pr-mousetrackleft'?: number | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Delay to show the tooltip in milliseconds.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.showDelay}
     * @defaultValue 0
     */
    'data-pr-showdelay'?: number | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Delay to update the tooltip in milliseconds.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.updateDelay}
     * @defaultValue 0
     */
    'data-pr-updatedelay'?: number | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Delay to hide the tooltip in milliseconds.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.hideDelay}
     * @defaultValue 0
     */
    'data-pr-hidedelay'?: number | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Whether to hide tooltip when hovering over tooltip content.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.autoHide}
     * @defaultValue true
     */
    'data-pr-autohide'?: boolean | undefined;
    /**
     * **YoYui - TooltipHTMLAttributes**
     *
     * Whether to show tooltip for disabled elements.*
     *
     * ![YoYui](https://yoyui.orcado.dev/images/logo-100.png)
     * ___
     *
     * _*This feature will be active when there is a YoYui {@link tooltip} component on the page._
     *
     * {@inheritDoc tooltipoptions.TooltipOptions.showOnDisabled}
     * @defaultValue false
     */
    'data-pr-showondisabled'?: boolean | undefined;
}

declare module 'react' {
    export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T>, TooltipHTMLAttributes {}
}
