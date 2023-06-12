/**
 * This is a component that renders a paper-like container.
 * It's used in the app to render the main content of the page.
 *
 * Example usage:
 *
 * ```tsx
 * <PaperContainer.Root>
 *   <PaperContainer.Navigation>
 *     <PaperContainer.NavigationItem icon="objectives" title="Increase Revenue" />
 *   </PaperContainer.Navigation>
 *
 *   <PaperContainer.Body>
 *     <h1 className="text-2xl font-bold">Increase Revenue</h1>
 *   </PaperContainer.Body>
 * </PaperContainer.Root>
 * ```
 */

import Root from "./Root";
import Navigation from "./Navigation";
import NavigationItem from "./NavigationItem";
import Body from "./Body";

export { Root, Navigation, NavigationItem, Body };
