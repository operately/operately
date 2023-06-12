/**
 * Renders the phases of a project.
 *
 * Example:
 *
 * ```tsx
 * <PhasePills.Container>
 *   <PhasePills.Item name="Concept" state="done" />
 *   <PhasePills.Item name="Planning" state="done" />
 *   <PhasePills.Item name="Execution" state="in-progress" />
 *   <PhasePills.Item name="Control" state="pending" />
 *   <PhasePills.Item name="Closing" state="pending" />
 * </PhasePills.Container>
 * ```
 */

import Container from "./Container";
import Item from "./Item";

export { Container, Item };
